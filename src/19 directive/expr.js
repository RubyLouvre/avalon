directives["{{}}"] = {
    init: noop,
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")

        if (nodeValue !== vnode.nodeValue) {
            vnode.nodeValue = nodeValue
            addHooks(this, binding)
        }
    },
    update: function (node, vnode, parent) {
        if (node.nodeType !== 3) {
            parent.replaceChild(vnode.toDOM(), node)
        } else {
            node.nodeValue = vnode.nodeValue
        }
    }
}