import { avalon, document, msie } from '../seed/core'

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
                /* istanbul ignore next*/
        } else if (!avalon.modern && (VMLTags[tagName] || rvml.test(tagName))) {
            dom = createVML(tagName)
        } else {
            dom = document.createElement(tagName)
        }

        var props = this.props || {}

        for (var i in props) {
            var val = props[i]
            if (skipFalseAndFunction(val)) {
                /* istanbul ignore if*/
                if (specalAttrs[i] && avalon.msie < 8) {
                    specalAttrs[i](dom, val)
                } else {
                    dom.setAttribute(i, val + '')
                }
            }
        }
        var c = this.children || []
        var template = c[0] ? c[0].nodeValue : ''
        switch (this.nodeName) {
            case 'script':
                dom.type = 'noexec'
                 dom.text = template
                 try{
                     dom.innerHTML = template
                 }catch(e){}
                dom.type = props.type || ''
                break
            case 'noscript':
                dom.textContent = template
            case 'style':
            case 'xmp':
            case 'template':
                try {
                    dom.innerHTML = template
                } catch (e) {
                    /* istanbul ignore next*/
                    this.hackIE(dom, this.nodeName, template)
                }
                break
            case 'option':
                //IE6-8,为option添加文本子节点,不会同步到text属性中
                /* istanbul ignore next */
                if (msie < 9)
                    dom.text = template
            default:
                /* istanbul ignore next */
                if (!this.isVoidTag && this.children) {
                    this.children.forEach(el =>
                        c && dom.appendChild(avalon.vdom(c, 'toDOM'))
                    )
                }
                break
        }
        return this.dom = dom
    },
    /* istanbul ignore next */
    hackIE(dom, nodeName, template) {
        switch (nodeName) {
            case 'style':
                dom.setAttribute('type', 'text/css')
                dom.styleSheet.cssText = template
                break
            case 'xmp': //IE6-8,XMP元素里面只能有文本节点,不能使用innerHTML
            case 'noscript':
                dom.textContent = template
                break
        }
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
            str += this.children.map(
                el => (el ? avalon.vdom(el, 'toHTML') : '')
            ).join('')
        }
        return str + '</' + this.nodeName + '>'
    }
}

function skipFalseAndFunction(a) {
    return a !== false && (Object(a) !== a)
}
/* istanbul ignore next */
var specalAttrs = {
    "class": function(dom, val) {
        dom.className = val
    },
    style: function(dom, val) {
        dom.style.cssText = val
    },
    type: function(dom, val) {
        try { //textarea,button 元素在IE6,7设置 type 属性会抛错
            dom.type = val
        } catch (e) {}
    },
    'for': function(dom, val) {
        dom.setAttribute('for', val)
        dom.htmlFor = val
    }
}

function createSVG(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
}
var svgTags = avalon.oneObject('circle,defs,ellipse,image,line,' +
    'path,polygon,polyline,rect,symbol,text,use,g,svg')

var rvml = /^\w+\:\w+/
    /* istanbul ignore next*/
function createVML(type) {
    if (document.styleSheets.length < 31) {
        document.createStyleSheet().addRule(".rvml", "behavior:url(#default#VML)");
    } else {
        // no more room, add to the existing one
        // http://msdn.microsoft.com/en-us/library/ms531194%28VS.85%29.aspx
        document.styleSheets[0].addRule(".rvml", "behavior:url(#default#VML)");
    }
    var arr = type.split(':')
    if (arr.length === 1) {
        arr.unshift('v')
    }
    var tag = arr[1]
    var ns = arr[0]
    if (!document.namespaces[ns]) {
        document.namespaces.add(ns, "urn:schemas-microsoft-com:vml")
    }
    return document.createElement('<' + ns + ':' + tag + ' class="rvml">');
}

var VMLTags = avalon.oneObject('shape,line,polyline,rect,roundrect,oval,arc,' +
    'curve,background,image,shapetype,group,fill,' +
    'stroke,shadow, extrusion, textbox, imagedata, textpath')