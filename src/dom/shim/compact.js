import { avalon, document, window, inBrowser, msie, root } from '../../seed/core'
import { fixClone } from './fixClone'
import { fixContains } from './fixContains'
export { avalon }
avalon.contains = fixContains

avalon.cloneNode = function(a) {
    return a.cloneNode(true)
}

//IE6-11的文档对象没有contains
/* istanbul ignore next */
function shimHack() {
    if (msie < 10) {
        avalon.cloneNode = fixClone
    }
    if (!document.contains) {
        document.contains = function(b) {
            return fixContains(document, b)
        }
    }
    if (avalon.modern) {
        if (!document.createTextNode('x').contains) {
            Node.prototype.contains = function(child) { //IE6-8没有Node对象
                return fixContains(this, child)
            }
        }
    }
    //firefox 到11时才有outerHTML
    function fixFF(prop, cb) {
        if (!(prop in root) && HTMLElement.prototype.__defineGetter__) {
            HTMLElement.prototype.__defineGetter__(prop, cb)
        }
    }
    fixFF('outerHTML', function() {
        var div = document.createElement('div')
        div.appendChild(this)
        return div.innerHTML
    })
    fixFF('children', function() {
        var children = []
        for (var i = 0, el; el = this.childNodes[i++];) {
            if (el.nodeType === 1) {
                children.push(el)
            }
        }
        return children
    })
    fixFF('innerText', function() { //firefox45+, chrome4+ http://caniuse.com/#feat=innertext
        return this.textContent
    })

}

if (inBrowser) {
    shimHack()
}