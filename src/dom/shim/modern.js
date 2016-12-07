//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
import { avalon, document, window, root } from '../../seed/core'
import { fixContains } from './fixContains'
export { avalon }

avalon.contains = fixContains

avalon.cloneNode = function(a) {
    return a.cloneNode(true)
}


if (avalon.modern) {
    if (!document.contains) {
        Node.prototype.contains = function(child) { //IE6-8没有Node对象
            return fixContains(this, child)
        }
    }
    function fixFF(prop, cb) {//firefox12 http://caniuse.com/#search=outerHTML
        if (!(prop in root)) {
            HTMLElement.prototype.__defineGetter__(prop, cb)
        }
    }
    fixFF('outerHTML', function() {//https://developer.mozilla.org/en-US/docs/Web/API/ParentNode/children
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
    fixFF('innerText', function() {
        return this.textContent
    })
}