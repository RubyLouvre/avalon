var patch = require("../strategy/patch")
var VElement = require("../vdom/VElement")

avalon.directive("if", {
    priority: 5,
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-if'] = " + avalon.quote(binding.expr) + ";\n"
    },
    diff: function (cur, pre) {
        if (cur.type !== pre.type) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (dom, vnode, parent) {
        var dtype = dom.nodeName.toLowerCase()
        var vtype = vnode.type
        if (dtype !== vtype) {
            var s = vnode.signature
            if (dom.nodeType === 1) {
                avalon.caches[s] = dom
                parent.replaceChild(avalon.vdomAdaptor(vnode).toDOM(), dom)
            } else {
                s = dom.nodeValue || s
                var keep = avalon.caches[s]
                if (keep) {
                    parent.replaceChild(keep, dom)
                    patch([keep], vnode.children)
                    delete avalon.caches[s]
                } else {
                    var el = avalon.vdomAdaptor(vnode).toDOM()
                    parent.replaceChild(el, dom)
                }
            }
        }
    }
})
