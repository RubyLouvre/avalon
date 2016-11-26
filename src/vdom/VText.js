import { avalon, document } from '../seed/core'

export class VText {
    constructor(text) {
        this.nodeName = '#text'
        this.nodeValue = text
    }

    toDOM() {
        /* istanbul ignore if*/
        if (this.dom)
            return this.dom
        var v = avalon._decode(this.nodeValue)
        return this.dom = document.createTextNode(v)
    }
    toHTML() {
        return this.nodeValue
    }
}