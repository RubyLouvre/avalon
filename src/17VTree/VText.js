function VText(text) {
    this.type = "#text"
    this.nodeValue = text
    this.skip = !rexpr.test(text)
}

VText.prototype = {
    constructor: VText,
    toDOM: function () {
        return document.createTextNode(this.nodeValue)
    },
    toHTML: function () {
        return this.nodeValue
    }
}