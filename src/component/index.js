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
        var signature = makeHashCode(type)
        this.signature = signature

        this.template = template + "<!--" + signature + "-->"

        this._children = createVirtual(this.template)
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

