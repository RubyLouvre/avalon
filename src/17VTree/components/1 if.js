avalon.components = {}

var Ifcom = avalon.components["ms-if"] = {
    construct: function (parent) {
        parent.children = createVirtual(parent.innerHTML, true)
        this._children = [parent] //将父节点作为它的子节点
        return this
    },
    init: function (me, vm) {
        var binding = {
            type: me.__type__.replace(/^ms-/, ""),
            expr: me.props.expr,
            vmodel: vm,
            element: me
        }
        if (binding.expr.indexOf("★") > 0) {
            var arr = binding.expr.split("★")
            binding.expr = arr[0]
            binding.itemName = arr[1]
        }

        avalon.injectBinding(binding)
    }
}



avalon.directive("if", {
    is: function (a, b) {
        if (b === void 0)
            return false
        return Boolean(a) === Boolean(b)
    },
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeHooks")
            change["if"] = this.update
            elem.state = !!value
            disposeVirtual(elem.children)
            if (value) {
                elem.children = updateVirtual(elem._children, binding.vmodel)
            } else {
                elem.children = [new VComment("ms-if")]
            }
        }
    },
    update: function (elem, vnode) {
        var replace = false
        if (vnode.state) {
            replace = elem.nodeType === 8
        } else {
            replace = elem.nodeType === 1
        }
        if (replace) {
            var dom = vnode.toDOM()
            elem.parentNode.replaceChild(dom, elem)
        }
    }
})