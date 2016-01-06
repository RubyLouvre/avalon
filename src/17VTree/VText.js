function VText(text) {
    this.type = "#text"
    this.nodeValue = text
    this.skipContent = !rexpr.test(text)
}

VText.prototype = {
    constructor: VText,
    clone: function(){
        return new VText(this.nodeValue)
    },
    toDOM: function () {
        return document.createTextNode(this.nodeValue)
    },
    toHTML: function () {
        return this.nodeValue
    }
}