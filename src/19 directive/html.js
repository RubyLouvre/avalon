
avalon.directive("html", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = createVirtual(value, true)
            pushArray(elem.children, updateVirtual(children, binding.vmodel))
            addHooks(this, binding)
        }
        return false
    },
    update: function (elem, vnode) {
        var child = vnode.children[0]
        if (vnode.disposed || !child)
            return
        avalon.clearHTML(elem)
        elem.appendChild(child.toDOM())
        updateEntity(elem.childNodes, vnode.children, elem)
    }
})
