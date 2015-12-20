function VComponent(type, props, children) {
    this.type = "#component"
    this.props = props
    this.__type__ = type
    this.children = children || []
}
VComponent.prototype = {
    construct: function () {
        var me = avalon.components[this.__type__]
        if (me && me.construct) {
            return me.construct.apply(this, arguments)
        } else {
            return this
        }
    },
    init: function (vm) {
        var me = avalon.components[this.__type__]
        if (me && me.init) {
            me.init(this, vm)
        }
    },
    toDOM: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toDOM) {
            return me.toDOM(this)
        }
        var fragment = document.createDocumentFragment()
        for (var i = 0; i < this.children.length; i++) {
            fragment.appendChild(this.children[i].toDOM())
        }
        return fragment
    },
    toHTML: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toHTML) {
            return me.toHTML(this)
        }
        var ret = ""
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}

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

avalon.components["ms-html"] = {
    construct: function (self, parent) {
//替换父节点的所有孩子
        parent.children = [self]
        return parent
    },
    init: Ifcom.init
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
