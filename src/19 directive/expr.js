directives["{{}}"] = {
    init: noop,
    change: function (value, binding) {
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")
        var node = binding.element
        if (nodeValue !== node.nodeValue) {
            node.nodeValue = nodeValue
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