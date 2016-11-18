//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
import { avalon, document, window } from '../../seed/core'
import { fixContains } from './fixContains'
export { avalon }

avalon.contains = fixContains

avalon.cloneNode = function (a) {
    return a.cloneNode(true)
}

 /* istanbul ignore if */
if (window.Node && !document.contains) {
     /* istanbul ignore next */
    window.Node.prototype.contains = function (child) {
        return fixContains(this, child)
    }
}

