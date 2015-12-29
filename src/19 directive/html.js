
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
    },
    update: function (elem, vnode) {
        var child = vnode.children[0]
        if (vnode.disposed || !child)
            return
        //这里就不用劳烦用created, disposed
        avalon.clearHTML(elem)
        elem.appendChild(child.toDOM())
    }
})
