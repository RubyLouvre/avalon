
avalon.directive("html", {
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        value = typeof value === "string" ? value : String(value)
        disposeVirtual(vnode.children)
        var children = createVirtual(value, true)
        pushArray(vnode.children, updateVirtual(children, binding.vmodel))
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        var child = vnode.children[0]
        if (!child)
            return
        //这里就不用劳烦用created, disposed
        avalon.clearHTML(node)
        node.appendChild(child.toDOM())
    }
})
