
avalon.directive("text", {
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        value = typeof value === "string" ? value : String(value)
        disposeVirtual(vnode.children)
        var children = [new VText(value)]
        pushArray(vnode.children, updateVirtual(children, binding.vmodel))
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        var child = vnode.children[0]
        if (!child) {
            return
        }
        if ("textContent" in node) {
            node.textContent = child.toHTML()
        } else {
            node.innerText = child.toHTML()
        }
    }
})
