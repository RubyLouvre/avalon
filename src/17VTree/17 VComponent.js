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
            var clone = buildVTree(template)

            var vnode = updateVTree(clone, proxy)

            children.push.apply(children, vnode)
        }, vm)

        self.children = children.concat(new VComment("ms-repeat-end"))
    }
}
avalon.components["ms-each"] = avalon.components["ms-repeat"]

avalon.components["ms-if"] = {
    construct: function (self, parent) {
        parent.children = buildVTree(parent.innerHTML, true)
        self._children = [parent] //将父节点作为它的子节点
        return self
    },
    init: function (that, vm) {
        var binding = {
            type: "if",
            expr: that.props.expr,
            vmodel: vm,
            element: that
        }
        avalon.injectBinding(binding)
    }
}

avalon.directive("if", {
    is: function(a, b){
        return Boolean(a) === Boolean(b)
    },
    change: function (value, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeHooks")
            change["if"] = this.update
            elem.state = !!value
            if (value) {
                elem.children = scanTree(elem._children, binding.vmodel)
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
    update: function (that, vm) {
        var html = parseExpr(that.props.expr, vm)
        var arr = buildVTree(html)
        updateVTree(arr, vm)
        that.children = [new VComment("ms-html")]
                .concat(arr)
                .concat(new VComment("ms-html-end"))
    }
}
avalon.components["ms-text"] = {
    construct: function (self, parent) {
        //替换父节点的所有孩子
        parent.children = [self]
        return parent
    },
    update: function (that, vm) {
        var text = parseExpr(that.props.expr, vm)
        that.children = [new VText(text)]
    }
}
