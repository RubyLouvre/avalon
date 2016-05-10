//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
if (!avalon.document.contains) {
    Node.prototype.contains = function (arg) {
        return !!(this.compareDocumentPosition(arg) & 16)
    }
}
avalon.contains = function (root, el) {
    try {
        while ((el = el.parentNode))
            if (el === root)
                return true
        return false
    } catch (e) {
        return false
    }
}
function outerHTML() {
    return new XMLSerializer().serializeToString(this)
}


var svgns = 'http://www.w3.org/2000/svg'
var svg = avalon.document.createElementNS(svgns, 'svg')

svg.innerHTML = '<circle fill="red" />'
//IE9-11,firefox,ios7,8的chrome不支持SVG元素的innerHTML,outerHTML属性
if (!/^\[object SVG\w*Element\]$/.test(svg.firstChild)) {
    function createSVG(node, parent) {
        /* jshint ignore:start */
        if (node && node.childNodes) {
            var nodes = node.childNodes
            for (var i = 0, el; el = nodes[i++]; ) {
                if (el.nodeType === 1) {
                    var svg = document.createElementNS(svgns, el.nodeName.toLowerCase())
                    avalon.each(el.attributes, function (a, attr) {
                        svg.setAttribute(attr.name, attr.value)
                    })
                    createSVG(el, svg)
                    parent.appendChild(svg)
                } else {
                    parent.appendChild(el.cloneNode(true))
                }
            }
        }
        /* jshint ignore:end */
    }
    Object.defineProperties(SVGElement.prototype, {
        outerHTML: {
            configurable: true,
            get: outerHTML,
            set: function (html) {
                var tagName = this.tagName.toLowerCase()
                var parent = this.parent
                var parsed = avalon.parseHTML(html)
                if (tagName === 'svg') {
                    parent.insertBefore(parsed, this)
                } else {
                    var empty = document.createDocumentFragment()
                    createSVG(parsed, empty)
                    parent.insertBefore(empty, this)
                }
                parent.removeChild(this)
            }
        },
        innerHTML: {
            configurable: true,
            get: function () {
                var s = this.outerHTML
                var ropen = new RegExp('<' + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', 'i')
                var rclose = new RegExp('<\/' + this.nodeName + '>$', 'i')
                return s.replace(ropen, '').replace(rclose, '')
            },
            set: function (html) {
                if (avalon.clearHTML) {
                    avalon.clearHTML(this)
                    var frag = avalon.parseHTML(html)
                    createSVG(frag, this)
                }
            }
        }
    })
}



