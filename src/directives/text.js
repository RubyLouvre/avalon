
var parse = require("../parser/parser")

//var scanNodes = require("../scan/scanNodes")
//var addHooks = require("../vdom/hooks").addHooks
function wrapText(text, num) {
    return "(function(){\nvar dynamic" + num + " = " + text + ";\n" +
            "vnode" + num + ".$render = function(a, vm){\n" +
            "\tthis.children = [{type:'#text',nodeValue:String(a) }]"+
            "}\n" +
            "return dynamic" + num + "\n" +
            "})()"
}
avalon.directive("text", {
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-text'] = " +
                "vnode" + num + ".dynamicText = " +
                wrapText(parse(binding.expr), num) + ";\n"
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
