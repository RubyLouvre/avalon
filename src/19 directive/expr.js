directives["{{}}"] = {
    init: noop,
    change: function (value, binding) {
        var elem = binding.element
        if (!elem || elem.disposed)
            return
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")

        if (nodeValue !== elem.nodeValue) {
            elem.nodeValue = nodeValue
            addHooks(this, binding)
        }
    },
    update: function (elem, vnode, parent) {
        if (elem.nodeType !== 3) {
            parent.replaceChild(vnode.toDOM(), elem)
        } else {
            elem.nodeValue = vnode.nodeValue
        }
    }
}