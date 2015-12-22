avalon.components["ms-html"] = {
    construct: function (self, parent) {
//替换父节点的所有孩子
        parent.children = [self]
        return parent
    }
    //init: Ifcom.init
}



avalon.directive("html", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = createVirtual(value, true)
            elem.children = updateVirtual(children, binding.vmodel)
            var change = addHooks(elem, "changeHooks")
            change.html = this.update
        }
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode
        avalon.clearHTML(parent)
        parent.appendChild(vnode.toDOM())
    }
})
