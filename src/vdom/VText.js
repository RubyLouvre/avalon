var rexpr = avalon.config.rexpr
var decode = require('../strategy/parser/decode')
function VText(text) {
    this.nodeName = '#text'
    this.nodeValue = text
    this.skipContent = !rexpr.test(text)
}

VText.prototype = {
    constructor: VText,
    toDOM: function () {
        if(this.dom)
            return this.dom
        var v = decode(this.nodeValue)
        return this.dom = document.createTextNode(v)
    },
    toHTML: function () {
        return this.nodeValue
    }
}

module.exports = VText