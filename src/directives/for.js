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
        var hasSign1 = "signature" in current[i]
        var hasSign2 = "signature" in previous[i]

        var array1 = hasSign1 ? getForBySignature(current, i) :
                getForByNodeValue(current, i)
        var array2 = hasSign2 ? getForBySignature(previous, i) :
                getForByNodeValue(previous, i)
        console.log(array1, array2)

    }
})
function getForBySignature(nodes, i) {
    var start = nodes[i], node
    var endText = start.signature + ":end"
    var ret = []
    while (node = nodes[++i]) {
        if (node.nodeValue === endText) {
            break
        } else {
            ret.push(node)
        }
    }
    return ret
}

function getForByNodeValue(nodes, i) {
    var isBreak = 1, ret = [], node
    while (node = nodes[++i]) {
        if (node.type === "#comment") {
            if (node.nodeValue.indexOf("av-for:") === 0) {
                isBreak++
            } else if (node.nodeValue.indexOf("av-for-end:") === 0) {
                isBreak--
            }
        }
        if (isBreak === 0) {
            break
        }
        ret.push(node)
    }
    return ret
}
