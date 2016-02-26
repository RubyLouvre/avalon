
var createVirtual = require("../strategy/createVirtual")
var parse = require("../parser/parser")
var VElement = require("../vdom/VElement")

avalon.createRenderProxy = function (str) {
    var vnode = avalon.createVirtual(str, true)
    return avalon.caches["render:" + str] = avalon.createRender(vnode)
}

avalon.directive("html", {
    parse: function (binding, num) {
        return "var dynamicHTML" + num + " = vnode" + num + ".props['av-html'] = " + parse(binding.expr) +
                ";\nvnode" + num + ".$render = avalon.caches['render:'+dynamicHTML" + num + "] || " +
                "avalon.createRenderProxy(dynamicHTML" + num + ")\n"
    },
    diff: function (cur, pre) {
        var curValue = cur.props["av-html"]
        var preValue = pre.props["av-html"]
        if (curValue !== preValue) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        } else {
            cur.children = pre.children.concat()
        }

    },
    update: function (node, vnode) {

        if (node.querySelectorAll) {
            var nodes = node.querySelectorAll("[avalon-events]")
            avalon.each(nodes, function (el) {
                avalon.unbind(el)
            })
        } else {
            var nodes = node.getElementsByTagName("")
            avalon.each(nodes, function (el) {
                if (el.getAttribute("avalon-events")){
                    avalon.unbind(el)
                }
            })
        }

        if (window.Range) {
            node.innerHTML = vnode.children.map(function (el) {
                if (el.type === '#text')
                    return el.nodeValue
                if (el.type === '#comment')
                    return "<!--" + el.nodeValue + "-->"
                return (new VElement(el)).toHTML()
            }).join("")
        } else {
            avalon.clearHTML(node)
            for (var i = 0, el; el = vnode.children[i++]; ) {
                if (el.type === '#text') {
                    node.appendChild(document.createTextNode(el.nodeValue))
                } else if (el.type === '#comment') {
                    node.appendChild(document.createComment(el.nodeValue))
                } else {
                    node.appendChild((new VElement(el)).toDOM())
                }
            }
        }
        //这里就不用劳烦用created, disposed
    }
})
