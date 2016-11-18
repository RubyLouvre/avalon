import { avalon, document } from '../seed/core'

export function VText(text) {
    this.nodeName = '#text'
    this.nodeValue = text
}

VText.prototype = {
    constructor: VText,
    toDOM: function () {
        /* istanbul ignore if*/
        if (this.dom)
            return this.dom
        var v = avalon._decode(this.nodeValue)
        return this.dom = document.createTextNode(v)
    },
    toHTML: function () {
        return this.nodeValue
    }
}