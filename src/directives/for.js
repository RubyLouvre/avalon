var parse = require("../parser/parser")


avalon._each = function (obj, fn) {
    if (Array.isArray(obj)) {
        for (var i = 0; i < obj.length; i++) {
            var value = obj[i]
            var type = typeof value
            var key = value && type === "object" ? obj : type + value
            fn(i, obj[i], key)
        }
    } else {
        for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
                fn(i, obj[i], i)
            }
        }
    }
}
var rforPrefix = /av-for:\s+/
var rforLeft = /^\s*\(\s*/
var rforRight = /\s*\)\s*$/
var rforSplit = /\s+,\s+/
avalon.directive("for", {
    parse: function (str, num) {
        var arr = str.replace(rforPrefix, "").split(" in ")

        var def = "var loop" + num + " = " + parse(arr[1]) + "\n"

        var kv = arr[0].replace(rforLeft, "").replace(rforRight, "").split(rforSplit)
        if (kv.length === 1) {
            kv.unshift("$key")
        }

        return def + "avalon._each(loop" + num + ", function(" + kv + ",traceKey){\n\n"
    },
    diff: function (current, previous, i) {
        var first = current[i]
        var hasSign1 = "signature" in first
        var hasSign2 = "signature" in previous[i]

        var curLoop = hasSign1 ? getForBySignature(current, i) :
                getForByNodeValue(current, i)


        var preLoop = hasSign2 ? getForBySignature(previous, i) :
                getForByNodeValue(previous, i)

        var n = curLoop.length - preLoop.length
        if (n > 0) {
            var spliceArgs = [i, 0]
            for (var j = 0; j < n; j++) {
                spliceArgs.push(null)
            }
            previous.splice.apply(previous, spliceArgs)
        } else {
            previous.splice.apply(previous, [i, Math.abs(n)])
        }
        // console.log(current)
        if (!hasSign2) {
            first.change = first.change || []
            first.change.push(function (a, b, parent) {
                var entity = b.entity
                var virtual = b.virtual
                console.log("a1", entity)
                for (var i = 0, n = entity.length; i < n; i++) {
                    parent.removeChild(entity[i])
                }
                var div = document.createElement("div")
                div.innerHTML = "loop"
                parent.appendChild(div)
                //挖空它的内部
                return false
            })
        }
        first.virtual = curLoop
        return i + curLoop.length - 1

    }
})
function getForBySignature(nodes, i) {
    var start = nodes[i], node
    var endText = start.signature + ":end"
    var ret = []
    while (node = nodes[i++]) {
        ret.push(node)
        if (node.nodeValue === endText) {
            break
        }
    }
    return ret
}

function getForByNodeValue(nodes, i) {
    var isBreak = 0, ret = [], node
    while (node = nodes[i++]) {
        if (node.type === "#comment") {
            if (node.nodeValue.indexOf("av-for:") === 0) {
                isBreak++
            } else if (node.nodeValue.indexOf("av-for-end:") === 0) {
                isBreak--
            }
        }
        ret.push(node)
        if (isBreak === 0) {
            break
        }
    }
    return ret
}
