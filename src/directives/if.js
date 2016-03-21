var patch = require('../strategy/patch')

avalon.directive('if', {
    priority: 5,
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-if"] = ' + avalon.quote(binding.expr) + ';\n'
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
                avalon.caches[vnode.nodeValue] = dom
                parent.replaceChild(avalon.vdomAdaptor(vnode).toDOM(), dom)
            } else {
                var s = dom.signature || dom.nodeValue
                var keep = avalon.caches[s]
                if (keep) {
                    parent.replaceChild(keep, dom)
                    patch([keep], [vnode])
                } else {
                    var el = avalon.vdomAdaptor(vnode).toDOM()
                    parent.replaceChild(el, dom)
                    avalon.caches[s] = el
                }
            }
        }
    }
})
