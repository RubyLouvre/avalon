function VElement(type, innerHTML, outerHTML) {
    this.type = type
    this.props = {}
    this.innerHTML = innerHTML
    this.outerHTML = outerHTML
    this.children = []
}
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        if (this.skip) {
            return avalon.parseHTML(this.outerHTML)
        }
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
            if(!this.children.length){
                dom.innerHTML = this.innerHTML
            }
        }
        return dom
    },
    toHTML: function () {
        if (this.skip) {
            return this.outerHTML
        }
        if (this.closeSelf) {
            return "<" + this.type + "/>"
        }
        var p = ""
        for (var i in this.props) {
            p += (i + "=" + quote(String(this.props[i]))) + " "
        }
        p = p ? " " + p : p
        var str = "<" + this.type + p + ">"
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



