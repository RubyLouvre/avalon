function VComponent(type, props) {
    this.type = "#component"
    this.props = props
    this.__type__ = type
    this.children = []
}
VComponent.prototype = {
    construct: function (parent) {
        var a = avalon.components[this.__type__]
        if (a && a.construct) {
            return a && a.construct(this, parent)
        } else {
            return this
        }
    },
    init: function (vm) {
        var a = avalon.components[this.__type__]
        if (a && a.init) {
            a.init(this, vm)
        }
    },
    toDOM: function () {
        var fragment = document.createDocumentFragment()
        for (var i = 0; i < this.children.length; i++) {
            fragment.appendChild(this.children[i].toDOM())
        }
        return fragment
    },
    toHTML: function () {
        var ret = ""
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}

avalon.components = {}

avalon.components["ms-repeat"] = {
    update: function (self, vm) {
        var template = that.props.template
        var arr = that.props.expr.match(/([^:]+)\:?(\w*)/)
        var repeatValue = parseExpr(arr[1], vm), repeatItem = arr[2] || "el"
        var children = [new VComment("ms-repeat")]
        updateVLoop(repeatValue, repeatItem, function (proxy) {
            var clone = createVirtual(template)

            var vnode = updateEntity(clone, proxy)

            children.push.apply(children, vnode)
        }, vm)

        self.children = children.concat(new VComment("ms-repeat-end"))
    }
}
avalon.components["ms-each"] = avalon.components["ms-repeat"]

var Ifcom = avalon.components["ms-if"] = {
    construct: function (self, parent) {
        parent.children = createVirtual(parent.innerHTML, true)
        self._children = [parent] //将父节点作为它的子节点
        return self
    },
    init: function (that, vm) {
        var binding = {
            type: that.__type__.replace(/^ms-/, ""),
            expr: that.props.expr,
            vmodel: vm,
            element: that
        }
        avalon.injectBinding(binding)
    }
}

avalon.directive("if", {
    is: function (a, b) {
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
    construct: function (self, parent) {
        //替换父节点的所有孩子
        parent.children = [self]
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
