
var parseBindings = require("./parseBindings")
var parseExpr = require("./parseExpr")
var parse = require("./parser")

var rexpr = avalon.config.rexpr
var quote = require("../base/builtin").quote

function wrap(a, num) {
    return "(function(){\n\n" + a + "\n\nreturn nodes" + num + "\n})();\n"
}
//av-for: a in @array

function createRender(arr) {
    var num = num || String(new Date - 0).slice(0, 6)
    var body = toTemplate(arr, num) + "\n\nreturn nodes" + num
    //console.log(body)
    var fn = Function("__vmodel__", body)
    console.log(fn + "")
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
                var array = parseExpr(el.nodeValue, false)
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
            if (nodeValue.indexOf("for:") === 0) {
                forstack.push(("for" + Math.random()).replace(/\d\.\d{8}/, ""))
                str += children + ".push( " + quote({
                    type: "#comment",
                    nodeValue: forstack[forstack.length - 1] + ":start",
                    skipContent: true
                }) + " )\n"
                str += avalon.directives["for"].parse(nodeValue, num)
            } else if (nodeValue.indexOf("for-end:") === 0) {
                str += "\n})\n"
                if (forstack.length) {
                    str += children + ".push(" + quote({
                        type: "#comment",
                        nodeValue: forstack[forstack.length - 1] + ":end",
                        skipContent: true
                    }) + ")\n"
                    forstack.pop()
                }
            } else if (nodeValue.indexOf("if:") === 0) {
                str += avalon.directives["if"].parse(nodeValue, num)
                hasIf = nodeValue.replace("if:", "")
            } else if (nodeValue.indexOf("js:") === 0) {
                str += parse(nodeValue.replace("js:", "")) + "\n"
            } else {
                str += children + ".push(" + quote(el) + ")\n"
            }
            continue
        } else { //处理元素节点
            str += "var " + vnode + " = {type:" + quote(el.type) + ", props:{}, children:[], template:" + quote(el.template) + "}\n"
            str += vnode + ".isVoidTag = " + !!el.isVoidTag + "\n"
            if (hasIf) {

                str += "if(!(" + parse(hasIf) + ")){\n\n"
                str += vnode + ".disposed = true\n"
                str += "\n}else{\n\n"

            }

            str += parseBindings(el.props, num)
            //av-text,av-html,会将一个元素变成组件
            str += "if(" + vnode + ".$render){\n"
            
            str += vnode + ".$render(" + vnode + ".dynamicText,__vmodel__)\n"
            str += "}else{\n"
            str += vnode + ".children = " + wrap(toTemplate(el.children, num), num) + "\n"
            str += "}\n"
            str += children + ".push(" + vnode + ")\n"

            if (hasIf) {
                str += "}\n"
                hasIf = false
            }
        }

        if (forstack.length) {
            str += "var " + vnode + " = {\n\ttype:'#comment',\n\tskipContent:true,\n\tnodeValue:" +
                    quote(forstack[forstack.length - 1]) + ",\n\tkey:traceKey\n}\n"
            str += children + ".push(" + vnode + ")\n"
        }

    }
    return str
}

module.exports = avalon.createRender = createRender