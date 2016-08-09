
function VElement(type, props, children) {
    if (typeof type === 'object') {
        for (var i in type) {
            this[i] = type[i]
        }
    } else {
        this.nodeType = 1
        this.nodeName = type
        this.props = props
        this.children = children
    }
}
function skipFalseAndFunction(a) {
    return a !== false && (Object(a) !== a)
}


function createSVG(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
}
var svgTags = avalon.oneObject('circle,defs,ellipse,image,line,' +
        'path,polygon,polyline,rect,symbol,text,use,g,svg')


var rvml = /^\w+\:\w+/
var supportTemplate = 'content' in document.createElement('template')
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        var dom, tagName = this.nodeName
        if (avalon.modern && svgTags[tagName]) {
            dom = createSVG(tagName)
        } else {
            dom = document.createElement(tagName)
        }
        var wid = this.props['ms-important'] ||
                this.props['ms-controller'] || this.wid
        if (wid) {
            var scope = avalon.scopes[wid]
            var element = scope && scope.vmodel && scope.vmodel.$element
            if (element) {
                var oldVdom = element.vtree[0]
                if (oldVdom.children) {
                    this.children = oldVdom.children
                }
                return element
            }
        }
        for (var i in this.props) {
            var val = this.props[i]
            if (skipFalseAndFunction(val)) {
                dom.setAttribute(i, val + '')
            }
        }
        var c = this.children || []
        var template = c[0] ? c[0].nodeValue : ''
        switch (this.nodeName) {
            case 'xmp':
            case 'script':
            case 'style':
            case 'noscript':
                dom.innerHTML = template
                break
            case 'template':
                if (supportTemplate) {
                    dom.innerHTML = template
                } else {
                    dom.textContent = template
                }
                break
            default:
                if (!this.isVoidTag) {
                    this.children.forEach(function (c) {
                        c && dom.appendChild(avalon.vdomAdaptor(c, 'toDOM'))
                    })
                }
                break
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
        var str = '<' + this.nodeName + arr
        if (this.isVoidTag) {
            return str + '/>'
        }
        str += '>'
        if (this.children.length) {
            str += this.children.map(function (c) {
                return c ? avalon.vdomAdaptor(c, 'toHTML') : ''
            }).join('')
        }
        return str + '</' + this.nodeName + '>'
    }
}

module.exports = VElement