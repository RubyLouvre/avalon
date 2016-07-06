
function VElement(type, props, children) {
    if (typeof type === 'object') {
        for (var i in type) {
            this[i] = type[i]
        }
    } else {
        this.nodeType = 1
        this.type = type
        this.props = props
        this.children = children
    }
}
function skipFalseAndFunction(a) {
    return a !== false && (Object(a) !== a)
}
var specal = {
    "class": function (dom, val) {
        dom.className = val
    },
    style: function (dom, val) {
        dom.style.cssText = val
    },
    'for': function (dom, val) {
        dom.htmlFor = val
    }
}

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
    return  document.createElement('<' + ns + ':' + tag + ' class="rvml">');
}

function createSVG(type) {
    return document.createElementNS('http://www.w3.org/2000/svg', type)
}
var svgTags = avalon.oneObject('circle,defs,ellipse,image,line,' +
        'path,polygon,polyline,rect,symbol,text,use,g,svg')
var VMLTags = avalon.oneObject('shape,line,polyline,rect,roundrect,oval,arc,' +
        'curve,background,image,shapetype,group,fill,' +
        'stroke,shadow, extrusion, textbox, imagedata, textpath')

var rvml = /^\w+\:\w+/

VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        var dom, tagName = this.type
        if (avalon.modern && svgTags[tagName]) {
            dom = createSVG(tagName)
        } else if (!avalon.modern && (VMLTags[tagName] || rvml.test(tagName))) {
            dom = createVML(tagName)
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
                if(oldVdom.children){
                    this.children = oldVdom.children
                }
                return element
            }
        }
        for (var i in this.props) {
            var val = this.props[i]
            if (skipFalseAndFunction(val)) {
                if (specal[i] && avalon.msie < 8) {
                    specal[i](dom, val)
                } else {
                    dom.setAttribute(i, val + '')
                }
            }
        }
        var c = this.children || []
        var template = c[0] ? c[0].nodeValue : ''
        switch (this.type) {
            case 'script':
                dom.text = template
                break
            case 'style':
                if ('styleSheet' in dom) {
                    dom.setAttribute('type', 'text/css')
                    dom.styleSheet.cssText = template
                } else {
                    dom.innerHTML = template
                }
                break
            case 'template':
                dom.innerHTML = template
                break
            case 'noscript':
                dom.textContent = template
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
        var str = '<' + this.type + arr
        if (this.isVoidTag) {
            return str + '/>'
        }
        str += '>'
        if (this.children.length) {
            str += this.children.map(function (c) {
                return c ? avalon.vdomAdaptor(c, 'toHTML') : ''
            }).join('')
        } 
        return str + '</' + this.type + '>'
    }
}

module.exports = VElement