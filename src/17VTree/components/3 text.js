
avalon.components["ms-text"] = {
    construct: function (parent) {
//替换父节点的所有孩子
        parent.children = [this]
        return parent
    },
    init: Ifcom.init
}


avalon.directive("text", {
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            value = typeof value === "string" ? value : String(value)
            disposeVirtual(elem.children)
            var children = [new VText(value)]
            elem.children = updateVirtual(children, binding.vmodel)
            var change = addHooks(elem, "changeHooks")
            change.text = this.update
        }
    },
    update: function (elem, vnode) {
        var parent = elem.parentNode
        if (!parent)
            return
        if ("textContent" in parent) {
            elem.textContent = vnode.toHTML()
        } else {
            elem.innerText = vnode.toHTML()
        }
    }
})
