//合并脚本
var fs = require("fs")
var path = require("path") //不同的操作系统，其 文件目录 分割符是不一样的，不能直接使用 + "/"来实现
var curDir = process.cwd() //当前目录
var parentDir = curDir.replace(path.sep + "src", "")
var otherDir = curDir.replace(/avalon(\w*)[\/\\]src/, "")
var Buffer = require('buffer').Buffer
var now = new Date
var version = 1.42
var date = now.getFullYear() + "." + (now.getMonth() + 1) + "." + now.getDate()
function directive(name) {
    return path.join("18 directive", name)
}

new function() {
    var file1 = path.join(curDir, "02 core.js")
    var file2 = path.join(curDir, "02 core.modern.js")
    var fixVersion = fs.readFileSync(file1, {
        encoding: "utf8"
    }).replace(/version:\s+([\d\.]+)/, function(a, b) {
        return "version: " + version
    })
    fs.writeFileSync(file1, fixVersion)
    var fixVersion = fs.readFileSync(file2, {
        encoding: "utf8"
    }).replace(/version:\s+([\d\.]+)/, function(a, b) {
        return "version: " + version
    })

    fs.writeFileSync(file2, fixVersion)
}

function comboFiles(files, writer, lastCallback, statement) {

    return function callback() {
        var fileName = files.shift()

        if (!fileName) {
            lastCallback()
            return
        }

        var filePath = path.join(curDir, fileName + ".js")
        var readable = fs.createReadStream(filePath)
        if (fileName === "00 inter") {
            readable.on("data", function(chunk) {
                var str = chunk.toString("utf8")
                var offset = (new Buffer(str.slice(0, str.indexOf("!!")), "utf8")).length
                chunk.write(statement, offset)
            })
        }
        readable.pipe(writer, {end: false})
        readable.on("readable", function() {
            writer.write("\n")
          //  console.log("add " + filePath)
        })
        readable.on("end", callback)
    }
}

//avalon.js 所需要合并的子文件
var compatibleFiles = [
    "00 inter", "01 variable", "01 variable.share", "02 core","03 cache", "04 es5.shim",
    "05 dom.polyfill", "06 configuration", "07 EventBus", "07 EventBus.share",
    "08 modelFactory", "08 modelFactory.shim", "09 Collection", "10 dependency",  "11 gc",
    "12 nextTick","13 promise","14 animate", "15 HTML", "16 dom", "17 parser", "17 parser.share",
    "18 scan", "18 scanTag", "18 scanNode", "18 scanAttr", "18 scanText",
    directive("skip"), directive("controller"), directive("important"),
    directive("attr"), directive("include"), directive("class.hover.active"), directive("data"),
    directive("text"), directive("html"), directive("if"), directive("visible"), directive("on"),
    directive("widget"), directive("duplex.1"), directive("duplex.2"),
    directive("duplex.3"), directive("repeat"),
    "20 filter", "21 loader", "22 domReady", "24 outer"
]
//avalon.modern.js 所需要合并的子文件
var modernFiles = compatibleFiles.concat()
modernFiles.splice(modernFiles.indexOf("04 es5.shim"), 1)
modernFiles.splice(modernFiles.indexOf("08 modelFactory.shim"), 1)
modernFiles[modernFiles.indexOf("01 variable")] = "01 variable.modern"
modernFiles[modernFiles.indexOf("02 core")] = "02 core.modern"
modernFiles[modernFiles.indexOf("05 dom.polyfill")] = "05 dom.polyfill.modern"
modernFiles[modernFiles.indexOf("07 EventBus")] = "07 EventBus.modern"
modernFiles[modernFiles.indexOf("08 modelFactory")] = "08 modelFactory.modern"
modernFiles[modernFiles.indexOf("15 HTML")] = "15 HTML.modern"
modernFiles[modernFiles.indexOf("16 dom")] = "16 dom.modern"
modernFiles[modernFiles.indexOf("17 parser")] = "17 parser.modern"
modernFiles[modernFiles.indexOf("18 scanAttr")] = "18 scanAttr.modern"
modernFiles[modernFiles.indexOf("18 scanTag")] = "18 scanTag.modern"
modernFiles[modernFiles.indexOf("21 loader")] = "21 loader.modern"
modernFiles[modernFiles.indexOf(directive("text"))] = directive("text.modern")
modernFiles[modernFiles.indexOf(directive("duplex.2"))] = directive("duplex.2.modern")
modernFiles[modernFiles.indexOf("22 domReady")] = "22 domReady.modern"


//avalon.shim.js 所需要合并的子文件
var shimFiles = compatibleFiles.slice(0, -3).concat("22 domReady.noop", "24 outer")

//avalon.modern.shim.js 所需要合并的子文件
var modernShimFiles = modernFiles.slice(0, -3).concat("22 domReady.noop", "24 outer")

//avalon.mobiles.js 所需要合并的子文件
var mobileFiles = modernFiles.concat()

mobileFiles.pop()
mobileFiles.push("23 touch", "24 outer")

//avalon.mobile.shim.js 所需要合并的子文件
var mobileShimFiles = modernFiles.slice(0, -3).concat("22 domReady.noop","23 touch", "24 outer")


//开始合并avalon.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.js'), {
        encoding: "utf8"
    });
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboCompatibleFiles = comboFiles(compatibleFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(parentDir, 'avalon.js'))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.js"))
        readable2.pipe(writable2)
    }, "avalon.js " + version + " build in " + date + " \n")
    comboCompatibleFiles()
}

//开始合并avalon.modern.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.modern.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈

    var comboModernFiles = comboFiles(modernFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(parentDir, "avalon.modern.js"))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.modern.js"))
        readable2.pipe(writable2)
    }, "avalon.modern.js " + version + " build in " + date + " \n")
    comboModernFiles()
}

//开始合并avalon.modern.shim.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.modern.shim.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboModernShimFiles = comboFiles(modernShimFiles, writable, function() {
        //更新avalon.test中的文件
        console.log("end!")
    }, "avalon.modern.shim.js(去掉加载器与domReady) " + version + " build in " + date + " \n")
    comboModernShimFiles()
}

//开始合并avalon.shim.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, "avalon.shim.js"), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboShimFiles = comboFiles(shimFiles, writable, function() {
        //更新avalon.test中的文件
        console.log("end!")
    }, "avalon.shim.js(去掉加载器与domReady) " + version + " build in " + date + " \n")
    comboShimFiles()
}



//开始合并avalon.mobile.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.mobile.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboMobileFiles = comboFiles(mobileFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(parentDir, 'avalon.mobile.js'))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.mobile.js"))
        readable2.pipe(writable2)
    }, "avalon.mobile.js(支持触屏事件) " + version + " build in " + date + " \n")
    comboMobileFiles()
}

//avalon.mobiles.old.js 所需要合并的子文件
var oldMobileFiles = compatibleFiles.slice(0)
if(oldMobileFiles[0] !== "00 inter"){
    oldMobileFiles.unshift("00 inter")
}

oldMobileFiles.pop()
oldMobileFiles.push("23 touch", "24 outer")

//开始合并avalon.mobile.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.mobile.old.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboMobileFiles = comboFiles(oldMobileFiles, writable, function() {
        //更新avalon.test中的文件
    }, "avalon.mobile.old.js(安卓2.3及其他旧的移动端浏览器) " + version + " build in " + date + " \n")
    comboMobileFiles()
}


//开始合并avalon.mobile.shim.js
new function() {
    var writable = fs.createWriteStream(path.join(parentDir, 'avalon.mobile.shim.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboMobileShimFiles = comboFiles(mobileShimFiles, writable, function() {
        //更新avalon.test中的文件
        console.log("end!")
    }, "avalon.mobile.shim.js(去掉加载器与domReady) " + version + " build in " + date + " \n")
    comboMobileShimFiles()
}