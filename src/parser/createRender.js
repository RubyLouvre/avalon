
var parse = require("./parse")
var parseBindings = require("./parseBindings")
var parseInterpolate = require("./parseInterpolate")


var rexpr = avalon.config.rexpr
var quote = require("../base/builtin").quote
var makeHashCode = require("../base/builtin").makeHashCode

function wrap(a, num) {
    return "(function(){\n\n" + a + "\n\nreturn nodes" + num + "\n})();\n"
}
//av-for: a in @array

function createRender(arr) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = toTemplate(arr, num) + "\n\nreturn nodes" + num
    var fn = Function("__vmodel__", body)
    // console.log(fn+"")
    return fn
}
function toTemplate(arr, num) {
    num = num || String(new Date - 0).slice(0, 5)

    var forstack = []
    var hasIf = false
    var children = "nodes" + num
    var vnode = "vnode" + num
    var str = "var " + children + " = []\n"
    for (var i = 0; i < arr.length; i++) {
        var el = arr[i]
        if (el.type === "#text") {
            str += "var " + vnode + " = {type:'#text', skipContent:true}\n"
            var hasExpr = rexpr.test(el.nodeValue)

            if (hasExpr) {
                var array = parseInterpolate(el.nodeValue, false)
                if (array.length === 1) {
                    var a = parse(array[0].expr)
                } else {
                    a = array.map(function (el) {
                        return el.type ? "String(" + parse(el.expr) + ")" : quote(el.expr)
                    }).join(" + ")

                }
                /* jshint ignore:start */

                str += vnode + ".nodeValue = String(" + a + ")\n"
                str += vnode + ".skipContent = false\n"
            } else {
                str += vnode + ".nodeValue = " + quote(el.nodeValue) + "\n"
            }
            str += children + ".push(" + vnode + ")\n"

        } else if (el.type === "#comment") {
            var nodeValue = el.nodeValue
            if (nodeValue.indexOf("av-for:") === 0) {
                var signature = el.signature
                forstack.push(signature)
                str += children + ".push({" +
                        "\n\ttype:'#comment'," +
                        "\n\tdirective:'for'," +
                        "\n\tskipContent:false," +
                        "\n\tsignature:" + quote(signature) + "," +
                        "\n\tnodeValue:" + quote(signature + ":start") + "," +
                        "\n})\n"
                str += avalon.directives["for"].parse(nodeValue, num)

            } else if (nodeValue.indexOf("av-for-end:") === 0) {
                var signature = forstack[forstack.length - 1]

                str += children + ".push({" +
                        "\n\ttype:'#comment'," +
                        "\n\tskipContent:true," +
                        "\n\tnodeValue:" + quote(signature) + "," +
                        "\n\tkey:traceKey\n})\n"
                str += "\n})\n" //结束循环
                if (forstack.length) {
                    var signature = forstack[forstack.length - 1]
                    str += children + ".push({" +
                            "\n\ttype:'#comment'," +
                            "\n\tskipContent:true," +
                            "\n\tsignature:" + quote(signature) + "," +
                            "\n\tnodeValue:" + quote(signature + ":end") + "," +
                            "\n})\n"

                    forstack.pop()
                }
            } else if (nodeValue.indexOf("av-js:") === 0) {
                str += parse(nodeValue.replace("av-js:", ""), "js") + "\n"
            } else {
                str += children + ".push(" + quote(el) + ");;;;\n"
            }
            continue
        } else { //处理元素节点
            var hasIf = el.props["av-if"]
            if (hasIf) { // 优化处理av-if指令
                str += "if(!(" + parse(hasIf, 'if') + ")){\n"
                str += children + ".push({" +
                        "\n\ttype: '#comment'," +
                        "\n\tdirective: 'if'," +
                        "\n\tnodeValue: '<!--av-if:-->'," +
                        "\n\tprops: {'av-if':true} })\n"
                str += "\n}else{\n\n"

            }
            str += "var " + vnode + " = {" +
                    "\n\ttype: " + quote(el.type) + "," +
                    "\n\tprops: {}," +
                    "\n\tchildren: []," +
                    "\n\tisVoidTag: " + !!el.isVoidTag + "," +
                    "\n\ttemplate: ''}\n"
            var hasBindings = parseBindings(el.props, num, el)
            if (hasBindings) {
                str += hasBindings
            }
//av-text,av-html,会将一个元素变成组件
//   str += "if(" + vnode + ".$render ){\n"
//   str += "\t" + vnode + " = " + vnode + ".$render(__vmodel__)\n"
//   str += "}else{\n"
            if (el.children.length) {
                str += "if(!" + vnode + ".props.wid){\n"
                str += "\t" + vnode + ".children = " + wrap(toTemplate(el.children, num), num) + "\n"
                str += "}\n"
            } else {
                str += vnode + ".template= " + quote(el.template) + "\n"
            }
//  str += "}\n"
            str += children + ".push(" + vnode + ")\n"

            if (hasIf) {
                str += "}\n"
                hasIf = false
            }
        }

    }
    return str
}

module.exports = avalon.createRender = createRender