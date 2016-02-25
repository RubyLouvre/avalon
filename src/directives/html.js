
var createVirtual = require("../strategy/createVirtual")
var parse = require("../parser/parser")
var VElement = require("../vdom/VElement")

avalon.createRender2 = function (str, vm) {
    if (this.$render === avalon.createRender2) {
        var vnode = avalon.createVirtual(str, true)
        this.$render = avalon.createRender(vnode)
    }
    var fn = this.$render
    return fn(vm)
}
function wrapHTML(text, num) {
    return "(function(){\nvar dynamic" + num + " = " + text + ";\n" +
            "vnode" + num + ".$render = avalon.createRender2\n" +
            "return dynamic" + num + "\n" +
            "})()"
}
avalon.directive("html", {
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-html'] = " +
                "vnode" + num + ".dynamicText = " + wrapHTML(parse(binding.expr), num) + ";\n"
    },
    diff: function (cur, pre) {
        var curValue = cur.props["av-html"]
        var preValue = pre.props["av-html"]
        if (curValue !== preValue) {
            cur.$render = pre.$render
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        } else {
            cur.$render = pre.$render
            cur.children = pre.children.concat()
        }

    },
    update: function (node, vnode) {
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
