function VComment(text) {
    this.type = "#comment"
    this.nodeValue = text
    this.skip = true
}
VComment.prototype = {
    constructor: VComment,
    toDOM: function () {
        return document.createComment(this.nodeValue)
    },
    toHTML: function () {
        return "<!--" + this.nodeValue + "-->"
    }
}