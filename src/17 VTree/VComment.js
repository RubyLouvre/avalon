function VComment(text) {
    this.type = "#comment"
    this.nodeValue = text
    this.skipContent = true
}
VComment.prototype = {
    constructor: VComment,
    clone: function () {
        return new VComment(this.nodeValue)
    },
    toDOM: function () {
        return document.createComment(this.nodeValue)
    },
    toHTML: function () {
        return "<!--" + this.nodeValue + "-->"
    }
}