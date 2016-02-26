
var parse = require("../parser/parser")

//var scanNodes = require("../scan/scanNodes")
//var addHooks = require("../vdom/hooks").addHooks
avalon.caches["text:all"] = function () {
    var a = this.props["av-text"]
    a = a == null ? '' : a + ""
    return [{type: '#text', nodeValue: String(a)}]
}

avalon.directive("text", {
    parse: function (binding, num) {
        return "vnode" + num + ".$render = avalon.caches['text:all'];\n" +
                "vnode" + num + ".props['av-text'] =" + parse(binding.expr) + ";\n"
    },
    diff: function (cur, pre) {
        var curValue = cur.props["av-text"]
        var preValue = pre.props["av-text"]
        if (curValue !== preValue) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node, vnode) {
        var child = vnode.children[0]
        if (!child) {
            return
        }
        if ("textContent" in node) {
            node.textContent = child.nodeValue + ""
        } else {
            node.innerText = child.nodeValue + ""
        }
    }
})
