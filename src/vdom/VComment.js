
function VComment(text) {
    this.nodeName = '#comment'
    this.nodeValue = text
}
VComment.prototype = {
    constructor: VComment,
    toDOM: function () {
        return this.dom = document.createComment(this.nodeValue)
    },
    toHTML: function () {
        return '<!--' + this.nodeValue + '-->' + (this.template || "")
    }
}

module.exports = VComment

