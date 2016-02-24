var builtin = require("../base/builtin")
var rmsAttr = builtin.rmsAttr
var quote = builtin.quote
var pushArray = builtin.pushArray

function VElement(type, props, children) {
    if (typeof type === "object") {
        for (var i in type) {
            this[i] = type[i]
        }
    } else {
        this.type = type
        this.props = props
        this.children = children
        this.template = ""
    }
}
VElement.prototype = {
    clone: function () {
        var clone = new VElement(this.type,
                avalon.mix({}, this.props),
                this.children.map(function (el) {
                    return el.clone()
                }))
        clone.template = this.template
        if (this.skipContent) {
            clone.skipContent = this.skipContent
        }
        if (this.isVoidTag) {
            clone.isVoidTag = this.isVoidTag
        }
        return clone
    },
    constructor: VElement,
    toDOM: function () {
        var dom = document.createElement(this.type)
        for (var i in this.props) {
            if (this.props[i] !== false) {
                dom.setAttribute(i, String(this.props[i]))
            }
        }
        if (this.skipContent) {
            switch (this.type) {
                case "script":
                    dom.text = this.template
                    break
                case "style":
                case "template":
                    dom.innerHTML = this.template
                    break
                case "noscript":
                    dom.textContent = this.template
                    break
                default:
                    var a = avalon.parseHTML(this.template)
                    dom.appendChild(a)
                    break
            }

        } else if (!this.isVoidTag) {
            if (this.children.length) {
                this.children.forEach(function (c) {
                    dom.appendChild(c.toDOM())
                })
            } else if (window.Range) {
                dom.innerHTML = this.template
            } else {
                dom.appendChild(avalon.parseHTML(this.template))
            }

        }
        return dom
    },
    toHTML: function () {
        var arr = []
        for (var i in this.props) {
            arr.push(i + "=" + quote(String(this.props[i])))
        }
        arr = arr.length ? " " + arr.join(" ") : ""
        var str = "<" + this.type + arr
        if (this.isVoidTag) {
            return str + "/>"
        }
        str += ">"
        if (this.children.length) {
            str += this.children.map(function (el) {
                return el.toHTML()
            }).join("")
        } else {
            str += this.template
        }
        return str + "</" + this.type + ">"
    }
}

module.exports = VElement