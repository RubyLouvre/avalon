function VComponent(type, props) {
    this.type = "#component"
    this.props = props
    this.__type__ = type
    this.children = []
}
VComponent.prototype = {
    update: function (vm) {
        var a = avalon.components[this.__type__]
        if (a && a.update) {
            a.update(this, vm)
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

avalon.components["repeat"] = {
    update: function (that, vm) {
        var template = that.props.template
        var arr = that.props.expr.match(/([^:]+)\:?(\w*)/)
        var repeatValue = parseExpr(arr[1], vm), repeatItem = arr[2] || "el"
        var children = [new VComment("ms-repeat")]
        updateVLoop(repeatValue, repeatItem, function (proxy) {
            var clone = buildVTree(template)

            var vnode = updateVTree(clone, proxy)

            children.push.apply(children, vnode)
        }, vm)

        that.children = children.concat(new VComment("ms-repeat-end"))
    }
}
avalon.components["each"] = avalon.components["repeat"]

avalon.components["if"] = {
    update: function (that, vm) {
        var render = parseExpr(that.props.expr, vm)
        if (render) {
            that.children = updateVTree(that.props._children, vm)
        } else {
            that.children = [new VComment("ms-if")]
        }
    }
}

avalon.components["html"] = {
    update: function (that, vm) {
        var html = parseExpr(that.props.expr, vm)
        var arr = buildVTree(html)
        updateVTree(arr, vm)
        that.children = [new VComment("ms-html")]
                .concat(arr)
                .concat(new VComment("ms-html-end"))
    }
}
avalon.components["text"] = {
    update: function (that, vm) {
        var text = parseExpr(that.props.expr, vm)
        that.children = [new VText(text)]
    }
}