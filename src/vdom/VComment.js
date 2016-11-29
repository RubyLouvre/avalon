import { document } from '../seed/core'

export function VComment(text) {
    this.nodeName = '#comment'
    this.nodeValue = text
}
VComment.prototype = {
    constructor: VComment,
    toDOM: function() {
        if (this.dom)
            return this.dom
        return this.dom = document.createComment(this.nodeValue)
    },
    toHTML: function() {
        return '<!--' + this.nodeValue + '-->'
    }
}