import { document } from '../seed/core'

export class VComment {
    constructor(text) {
        this.nodeName = '#comment'
        this.nodeValue = text
    }
    toDOM() {
        return this.dom || (this.dom = document.createComment(this.nodeValue))
    }
    toHTML() {
        return '<!--' + this.nodeValue + '-->'
    }
}