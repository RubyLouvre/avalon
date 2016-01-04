avalon.directive("data", {
    priority: 100,
    init: noop,
    change: function (val, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        var change = addData(vnode, "changeData")
        val = (val && typeof val === "object") ? val : String(val)
        change["data-" + binding.param] = val
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        var change = vnode.changeData
        for (var key in change) {
            var val = change[key]
            if (typeof val === "string") {
                node.setAttribute(key, val)
            } else {
                node[key] = val
            }
        }
        delete vnode.changeData
    }
})
