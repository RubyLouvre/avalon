function VElement(type, props, children) {
    this.type = type
    this.props = props || {}
    this.children = children || []
    this.template = "" //这里相当于innerHTML,保存最原始的模板
}
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        var dom = document.createElement(this.type)
        for (var i in this.props) {
            if (this.props[i] === false) {
                dom.removeAttribute(i)
            } else {
                dom.setAttribute(i, String(this.props[i]))
            }
        }
        if (this.skipContent) {
            switch (this.type) {
                case "script":
                    this.text = this.__content
                    break;
                case "style":
                case "noscript":
                case "template":
                    this.innerHTML = this.__content
                    break
                default:
                    var a = avalon.parseHTML(this.__content)
                    dom.appendChild(a)
                    break
            }
        } else {
            this.children.forEach(function (c) {
                dom.appendChild(c.toDOM())
            })
            if (!this.children.length) {
                a = avalon.parseHTML(this.template)
                dom.appendChild(a)
            }
        }
        return dom
    },
    toHTML: function (skipProps) {
        if (this.skip) {
            return this.outerHTML
        }
        var arr = []
        for (var i in this.props) {
            if (skipProps && skipProps[i])
                continue
            arr.push(i + "=" + quote(String(this.props[i])))
        }
        arr = arr.length ? " " + arr.join(" ") : ""
        var str = "<" + this.type + arr
        if (this.closeSelf) {
            return str + "/>"
        }
        str += ">"
        if (this.skipContent) {
            str += this.__content
        } else {
            str += this.children.map(function (el) {
                return el.toHTML()
            }).join("")
        }
        return str + "</" + this.type + ">"
    }
}



