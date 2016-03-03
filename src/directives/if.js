var makeHashCode = require("../base/builtin").makeHashCode
var quote = require("../base/builtin").quote

avalon.directive("if", {
    priority: 5,
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-if'] = " + quote(binding) + ";\n"
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
            if (dom.nodeType === 1) {
                var a = makeHashCode("if")
                avalon.caches[a] = dom
                parent.replaceChild(document.createComment(a), dom)
            } else {
                a = dom.nodeValue
                var keep = avalon.caches[a]
                if (keep) {
                    parent.replaceChild(keep, dom)
                    delete avalon.caches[a]
                } else {
                    var el = new VElement(vnode)
                    parent.replaceChild(el.toDOM(), dom)
                }
            }
        }
    }
})
