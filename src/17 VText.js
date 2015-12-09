function VText(text) {
    this.type = "#text"
    this.nodeValue = text
    this.skip = !rexpr.test(text)
}
function fixGtLt(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
VText.prototype = {
    constructor: VText,
    toDOM: function () {
        return document.createTextNode(this.nodeValue)
    },
    toHTML: function () {
        return fixGtLt(this.nodeValue)
    }
}