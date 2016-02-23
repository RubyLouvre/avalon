var hooks = require("../vdom/hooks")

var addHooks = hooks.addHooks

avalon.directive("{{}}", {
   
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return

        binding.array[binding.index] = value == null ? "" : value
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
})