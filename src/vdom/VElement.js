
function VElement(type, props, children) {
    if (typeof type === 'object') {
        for (var i in type) {
            this[i] = type[i]
        }
    } else {
        this.type = type
        this.props = props
        this.children = children
        this.template = ''
    }
}
function skipFalseAndFunction(a) {
    return a !== false && (Object(a) !== a)
}
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        var dom = document.createElement(this.type)
        for (var i in this.props) {
            var val = this.props[i]
            if (skipFalseAndFunction(val)) {
                dom.setAttribute(i, val + '')
            }
        }
        if (this.skipContent) {
            switch (this.type) {
                case 'script':
                    dom.text = this.template
                    break
                case 'style':
                case 'template':
                    dom.innerHTML = this.template
                    break
                case 'noscript':
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
                    dom.appendChild(avalon.vdomAdaptor(c).toDOM())
                })
            } else {
                dom.appendChild(avalon.parseHTML(this.template))
            }

        }
        return dom
    },
    toHTML: function () {
        var arr = []
        for (var i in this.props) {
            var val = this.props[i]
            if (skipFalseAndFunction(val)) {
                arr.push(i + '=' + avalon.quote(this.props[i] + ''))
            }
        }
        arr = arr.length ? ' ' + arr.join(' ') : ''
        var str = '<' + this.type + arr
        if (this.isVoidTag) {
            return str + '/>'
        }
        str += '>'
        if (this.children.length) {
            str += this.children.map(function (c) {
                return avalon.vdomAdaptor(c).toHTML()
            }).join('')
        } else {
            str += this.template
        }
        return str + '</' + this.type + '>'
    }
}

module.exports = VElement