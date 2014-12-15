//合并脚本
var fs = require("fs")
var path = require("path") //不同的操作系统，其 文件目录 分割符是不一样的，不能直接使用 + "/"来实现
var curDir = process.cwd() //当前目录
var otherDir = curDir.replace(/avalon[\/\\]src/, "")
var Buffer = require('buffer').Buffer
var now = new Date
var version = "1.3.8"
var date = now.getFullYear() + "." + now.getMonth() + "." + now.getDate()
function directive(name) {
    return path.join("15 directive", name)
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
            console.log("add " + filePath)
        })
        readable.on("end", callback)
    }
}

//avalon.js 所需要合并的子文件
var compatibleFiles = [
    "00 inter", "01 variable", "01 variable.share", "02 core", "03 es5.shim",
    "04 dom.polyfill", "05 configuration", "06 EventBus", "06 findNodes",
    "07 modelFactory.repeat", "07 modelFactory.shim", "08 Collection.repeat", "09 dispatcher",
    "10 HTML", "12 scan", "12 scanTag", "12 scanNode", "12 scanAttr", "12 scanText",
    "13 dom", "14 parser", "14 parser.share.repeat",
    directive("skip"), directive("controller"), directive("important"),
    directive("attr"), directive("include"), directive("class.hover.active"), directive("data"),
    directive("text"), directive("html"), directive("if"), directive("visible"), directive("on"),
    directive("widget"), directive("duplex.1"), directive("duplex.2"),
    directive("duplex.3"), directive("repeat.next"),
    "16 filter", "17 loader", "18 domReady", "19 outer"
]
//avalon.modern.js 所需要合并的子文件
var modernFiles = compatibleFiles.concat()
modernFiles.splice(modernFiles.indexOf("03 es5.shim"), 1)
modernFiles.splice(modernFiles.indexOf("07 modelFactory.shim"), 1)
modernFiles[modernFiles.indexOf("01 variable")] = "01 variable.modern"
modernFiles[modernFiles.indexOf("02 core")] = "02 core.modern"
modernFiles[modernFiles.indexOf("04 dom.polyfill")] = "04 dom.polyfill.modern"
modernFiles[modernFiles.indexOf("06 findNodes")] = "06 findNodes.modern"
modernFiles[modernFiles.indexOf("10 HTML")] = "10 HTML.modern"
modernFiles[modernFiles.indexOf("12 scanAttr")] = "12 scanAttr.modern"
modernFiles[modernFiles.indexOf("12 scanTag")] = "12 scanTag.modern"
modernFiles[modernFiles.indexOf("13 dom")] = "13 dom.modern"
modernFiles[modernFiles.indexOf("14 parser")] = "14 parser.modern"
modernFiles[modernFiles.indexOf(directive("text"))] = directive("text.modern")
modernFiles[modernFiles.indexOf(directive("duplex.2"))] = directive("duplex.2.modern")
modernFiles[modernFiles.indexOf("18 domReady")] = "18 domReady.modern"


//avalon.shim.js 所需要合并的子文件
var shimFiles = compatibleFiles.slice(0, -3).concat("18 domReady.noop", "19 outer")

//avalon.repeat.js 所需要合并的子文件
//var repeatFiles = compatibleFiles.concat()
//repeatFiles[repeatFiles.indexOf("07 modelFactory")] = "07 modelFactory.repeat"
//repeatFiles[repeatFiles.indexOf("08 Collection")] = "08 Collection.repeat"
//repeatFiles[repeatFiles.indexOf("14 parser.share")] = "14 parser.share.repeat"
//repeatFiles[repeatFiles.indexOf(directive("repeat"))] = directive("repeat.next")

//avalon.mobiles.js 所需要合并的子文件
var mobileFiles = modernFiles.concat()
//mobileFiles[mobileFiles.indexOf("07 modelFactory")] = "07 modelFactory.repeat"
//mobileFiles[mobileFiles.indexOf("08 Collection")] = "08 Collection.repeat"
//mobileFiles[mobileFiles.indexOf("14 parser.share")] = "14 parser.share.repeat"
//mobileFiles[mobileFiles.indexOf(directive("repeat"))] = directive("repeat.next")
mobileFiles.pop()
mobileFiles.push("20 fastclick", "19 outer")

//开始合并avalon.js
new function() {
    var writable = fs.createWriteStream(path.join(curDir, 'avalon.js'), {
        encoding: "utf8"
    });
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboCompatibleFiles = comboFiles(compatibleFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(curDir, 'avalon.js'))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.js"))
        readable2.pipe(writable2)
    }, "avalon.js " + version + " build in " + date + " \n")
    comboCompatibleFiles()
}

//开始合并avalon.modern.js
new function() {
    var writable = fs.createWriteStream(path.join(curDir, 'avalon.modern.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈

    var comboModernFiles = comboFiles(modernFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(curDir, 'avalon.modern.js'))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.modern.js"))
        readable2.pipe(writable2)
    }, "avalon.modern.js " + version + " build in " + date + " \n")
    comboModernFiles()
}

//开始合并avalon.shim.js
new function() {
    var writable = fs.createWriteStream(path.join(curDir, 'avalon.shim.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboShimFiles = comboFiles(shimFiles, writable, function() {
        //更新avalon.test中的文件
        console.log("end!")
    }, "avalon.shim.js(去掉加载器与domReady) " + version + " build in " + date + " \n")
    comboShimFiles()
}

//开始合并avalon.repeat.js
//new function() {
//    var writable = fs.createWriteStream(path.join(curDir, 'avalon.repeat.js'), {
//        encoding: "utf8"
//    })
//    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
//    var comboRepeatFiles = comboFiles(repeatFiles, writable, function() {
//        //更新avalon.test中的文件
//        var readable2 = fs.createReadStream(path.join(curDir, 'avalon.repeat.js'))
//        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test',"src",  "avalon.repeat.js"))
//        readable2.pipe(writable2)
//    }, "avalon.repeat.js(ms-repeat大更新) " + version + " build in " + date + " \n")
//    comboRepeatFiles()
//}


//开始合并avalon.mobile.js
new function() {
    var writable = fs.createWriteStream(path.join(curDir, 'avalon.mobile.js'), {
        encoding: "utf8"
    })
    writable.setMaxListeners(100) //默认只有添加11个事件，很容易爆栈
    var comboMobileFiles = comboFiles(mobileFiles, writable, function() {
        //更新avalon.test中的文件
        var readable2 = fs.createReadStream(path.join(curDir, 'avalon.mobile.js'))
        var writable2 = fs.createWriteStream(path.join(otherDir, 'avalon.test', "src", "avalon.mobile.js"))
        readable2.pipe(writable2)
    }, "avalon.mobile.js(支持触屏事件) " + version + " build in " + date + " \n")
    comboMobileFiles()
}

