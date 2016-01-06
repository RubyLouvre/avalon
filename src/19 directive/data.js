avalon.directive("data", {
    priority: 100,
    init: noop,
    change: function (val, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        var data = addData(vnode, "changeData")
        val = avalon.isObject(val) ? val : String(val)
        data["data-" + binding.param] = val
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
