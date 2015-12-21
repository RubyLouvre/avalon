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





