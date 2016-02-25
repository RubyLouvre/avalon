
var parse = require("../parser/parser")

avalon.directive("style", {
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-style'] = " + parse(binding.expr) + ";\n"
    },
    diff: function (cur, pre) {
        var a = cur.props["av-style"]
        var p = pre.props["av-style"]
        if (a && typeof a === "object") {
            if (Array.isArray(a)) {
                a = cur.props["av-style"] = avalon.mix.apply({}, a)
            }
            if (typeof p !== "object") {
                cur.changeStyle = a
            } else {
                var patch = {}
                var hasChange = false
                for (var i in a) {
                    if (a[i] !== p[i]) {
                        hasChange = true
                        patch = a[i]
                    }
                }
                if (hasChange) {
                    cur.changeStyle = patch
                }
            }
            if (cur.changeStyle) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        } else {
            cur.props["av-style"] = pre.props["av-style"]
        }
    },
    update: function (node, vnode) {
        var change = vnode.changeStyle
        var wrap = avalon(node)
        for (var name in change) {
            wrap.css(name, change[name])
        }
        delete vnode.changeStyle
    }
})
