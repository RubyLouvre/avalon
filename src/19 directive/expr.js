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
    update: function (node, vnode, parent) {
        if (node.nodeType !== 3) {
            parent.replaceChild(vnode.toDOM(), node)
        } else {
            node.nodeValue = vnode.nodeValue
        }
    }
}