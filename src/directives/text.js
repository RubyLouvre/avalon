var parse = require("../parser/parse")
var Cache = require("../core/cache")

var textCache = new Cache(512)
var rexpr = avalon.config.rexpr



avalon.directive("text", {
    parse: function (binding, num) {
        return "vnode" + num + ".textVm = __vmodel__\n" +
                "vnode" + num + ".props.wid = 1;\n" +
                "vnode" + num + ".props['av-text'] =" + parse(binding.expr) + ";\n"
    },
    diff: function (cur, pre) {
        var curValue = cur.props["av-text"]
        var preValue = pre.props["av-text"]
        if (curValue !== preValue) {
            var hasExpr = rexpr.test(curValue)
            var children = [{type: "#text", nodeValue: curValue}]
            if (hasExpr) {
                var nodes = textCache.get(curValue)
                if (!Array.isArray(nodes)) {
                    var fn = avalon.createRender(children)
                    nodes = fn(cur.textVm)
                    textCache.put(curValue, nodes)
                }
                cur.children = nodes
                cur.props['av-text'] = nodes[0].nodeValue
            } else {
                cur.children = children
            }
            if (cur.props['av-text'] !== preValue) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }

        }
    },
    update: function (node, vnode) {
        var child = vnode.props['av-text']
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