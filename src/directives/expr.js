var hooks = require("../vdom/hooks")

var addHooks = hooks.addHooks

avalon.directive("expr", {
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
    diff: function (curNode, preNode) {//curNode, preNode
        if (curNode.nodeValue !== preNode.nodeValue) {
           // addHooks(this, binding)
           curNode.change = curNode.change || []
           avalon.Array.ensure(curNode.change, this.update)
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