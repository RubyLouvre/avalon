
var createVirtual = require("../strategy/createVirtual")
var parse = require("../parser/parse")
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
        //移除事件
        if (node.querySelectorAll) {
            var nodes = node.querySelectorAll("[avalon-events]")
            avalon.each(nodes, function (el) {
                avalon.unbind(el)
            })
        } else {
            var nodes = node.getElementsByTagName("")
            avalon.each(nodes, function (el) {
                if (el.getAttribute("avalon-events")) {
                    avalon.unbind(el)
                }
            })
        }
        //添加节点
        if (window.Range) {
            node.innerHTML = vnode.children.map(function (c) {
                return avalon.vdomAdaptor(c).toHTML()
            }).join("")
        } else {
            avalon.clearHTML(node)
            var fragment = document.createDocumentFragment()
            vnode.children.forEach(function (c) {
                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
            })

            node.appendChild(fragment)
        }
    }
})
