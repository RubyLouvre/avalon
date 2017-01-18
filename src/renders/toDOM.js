import {createNode, createText} from '../vtree/recycler'
export function toDOM(el, b) {

    if (el.props) {
        if (el.dom) {
            return el.dom
        }
        
        var elem = el.dom = createNode(el.nodeName)

        for (var i in el.props) {
            var value = el.props[i]
            if (typeof elem[i] === 'boolean') {
                elem[i] = !!value
            } else if (specalAttrs[i]) {
                specalAttrs[i](elem, value)
            } else {
                elem.setAttribute(i, value)
            }
        }
        if (container[el.nodeName]) {
            var t = (el.children[0] || {}).nodeValue || ''
            container[el.nodeName](elem, t)
        } else if (el.children && !el.vtype && !el.dirs) {
            appendChild(elem, el.children)
        }
        return el.dom
    } else if (el.nodeName === '#comment') {
        return el.dom || (el.dom = document.createComment(el.nodeValue))
    } else if (el.nodeName === '#document-fragment') {
        var dom = document.createDocumentFragment()
        appendChild(dom, el.children)
        el.dom = dom
        return el.dom = dom
    } else if (el.nodeName === '#text') {
        if (el.dom) {
            return el.dom
        }
       return el.dom = createText(el.nodeValue)
    } 
}


function appendChild(parent, children) {
    for (var i = 0, n = children.length; i < n; i++) {
        var b = toDOM(children[i])
        if (b) {
            parent.appendChild(b)
        }
    }
}


var container = {
    script: function(dom, template) {
        try {
            dom.text = template
        } catch (e) {
            avalon.log(vdom)
        }
    },
    noscript: function(dom, template) {
        dom.textContent = template
    },
    xmp: function(dom, template) {
        //IE6-8,XMP元素里面只能有文本节点,不能使用innerHTML
        dom.textContent = template
    },
    option: function(dom, template) {
        //IE6-8,为option添加文本子节点,不会同步到text属性中
        /* istanbul ignore next */
        if (msie < 9)
            dom.text = template
    },
    style: function(dom, template) {
        try {
            dom.innerHTML = template
        } catch (e) {
            dom.setAttribute('type', 'text/css')
            dom.styleSheet.cssText = template
        }
    }
}

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