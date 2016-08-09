var rexpr = avalon.config.rexpr
var decode = require('../strategy/decode')
function VText(text) {
    if (typeof text === 'string') {
        this.nodeName = '#text'
        this.nodeValue = text
        this.skipContent = !rexpr.test(text)
        this.nodeType = 3
    } else {
        for (var i in text) {
            this[i] = text[i]
        }
    }
}

VText.prototype = {
    constructor: VText,
    toDOM: function () {
       var v = decode(this.nodeValue)
       return document.createTextNode(v)
    },
    toHTML: function () {
        return this.nodeValue
    }
}

module.exports = VText