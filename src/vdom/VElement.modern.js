import { avalon, document } from '../seed/core'

export function VElement(type, props, children, isVoidTag) {
    this.nodeName = type
    this.props = props
    this.children = children
    this.isVoidTag = isVoidTag
}
VElement.prototype = {
    constructor: VElement,
    toDOM() {
        if (this.dom)
            return this.dom
        var dom, tagName = this.nodeName
        if (avalon.modern && svgTags[tagName]) {
            dom = createSVG(tagName)
        } else {
            dom = document.createElement(tagName)
        }
        var props = this.props || {}

        for (var i in props) {
            var val = props[i]
            if (skipFalseAndFunction(val)) {
                dom.setAttribute(i, val + '')
            }
        }
        var c = this.children || []
        var template = c[0] ? c[0].nodeValue : ''
        switch (this.nodeName) {
            case 'xmp':
            case 'style':
            case 'script':
            case 'noscript':
                dom.innerHTML = template
                break
            case 'template':
                if (supportTemplate) {
                    dom.innerHTML = template
                } else {
                    /* istanbul ignore next*/
                    dom.textContent = template
                }
                break
            default:
                if (!this.isVoidTag && this.children) {
                    this.children.forEach(el =>
                        el && dom.appendChild(avalon.vdom(el, 'toDOM'))
                    )
                }
                break
        }
        return this.dom = dom
    },
    toHTML() {
        var arr = []
        var props = this.props || {}
        for (var i in props) {
            var val = props[i]
            if (skipFalseAndFunction(val)) {
                arr.push(i + '=' + avalon.quote(props[i] + ''))
            }
        }
        arr = arr.length ? ' ' + arr.join(' ') : ''
        var str = '<' + this.nodeName + arr
        if (this.isVoidTag) {
            return str + '/>'
        }
        str += '>'
        if (this.children) {
            str += this.children.map(el =>
                (el ? avalon.vdom(el, 'toHTML') : '')
            ).join('')
        }
        return str + '</' + this.nodeName + '>'
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

if (avalon.inBrowser) {
    var supportTemplate = 'content' in document.createElement('template')
}