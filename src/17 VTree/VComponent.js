function VComponent(type, props, children) {
    this.type = "#component"
    this.props = {}
    this.children = []
    this.__type__ = type
    this.template = ""
    if (avalon.isObject(props)) {
        this.props = {}
    }
    if (Array.isArray(children)) {
        pushArray(this.children, children)
    }
    var me = avalon.components[type]
    if (me && me.init && arguments.length) {
        me.init.apply(this, arguments)
    }
}

VComponent.prototype = {
    clone: function () {
        var me = avalon.components[this.__type__]
        if (me && me.clone) {
            return me.clone.call(this)
        } else {
            var clone = new VComponent()
            clone.props = avalon.mix(clone.props, this.props)
            clone.children = this.children.map(function (el) {
                return el.clone()
            })
            clone.__type__ = this.__type__
            clone.template = this.template
            return this
        }
    },
    toDOM: function () {
        var me = avalon.components[this.__type__]
        if (me && me.toDOM) {
            return me.toDOM.call(this)
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
            return me.toHTML.call(this)
        }
        var ret = ""
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}


function shimTemplate(element, skip) {
    var p = []
    for (var i in element.props) {
        if (skip && skip.test(i))
            continue
        p.push(i + "=" + quote(String(element.props[i])))
    }
    p = p.length ? " " + p.join(" ") : ""

    var str = "<" + element.type + p
    if (element.selfClose) {
        return str + "/>"
    }
    str += ">"

    str += element.template

    return str + "</" + element.type + ">"
}


avalon.components["ms-if"] = {
    toDOM: function (self) {
        return self.children[0].toDOM()
    }
}

var repeatCom = avalon.components["ms-repeat"] =
        avalon.components["ms-each"] = {
    init: function (type, props, template) {
        type = props.type
        var signature = generateID(type)
        this.signature = signature

        this.template = template + "<!--" + signature + "-->"

        this._children = createVirtual(this.template, true)
    },
    clone: function () {
        var type = this.__type__
        this.__type__ = 1
        var clone = this.clone()
        clone.__type__ = type
        clone.signature = this.signature
        clone._children = this._children
        return clone
    }
}

var repeatItem = avalon.components["repeat-item"] = {
    init: function () {
        this._new = true
        this.dispose = repeatItem.dispose
        return this
    },
    dispose: function () {
        disposeVirtual([this])
        var proxy = this.vmodel
        var item = proxy[this.valueName]
        proxy && (proxy.$active = false)
        if (item && item.$id) {
            item.$active = false
        }
    }
}