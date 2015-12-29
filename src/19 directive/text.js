
avalon.directive("text", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem && !elem.disposed) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = [new VText(value)]
            pushArray(elem.children, updateVirtual(children, binding.vmodel))
            addHooks(this, binding)
        }
    },
    update: function (elem, vnode) {
        var child = vnode.children[0]
        if (vnode.disposed || !child){
            return
        }
        if ("textContent" in elem) {
            elem.textContent = child.toHTML()
        } else {
            elem.innerText = child.toHTML()
        }
    }
})
