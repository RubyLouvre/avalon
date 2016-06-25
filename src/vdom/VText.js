var rexpr = avalon.config.rexpr

function VText(text) {
    if (typeof text === 'string') {
        this.type = '#text'
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
       var a =  VText.decoder = VText.decoder || document.createElement('p')
       a.innerHTML = this.nodeValue
       return a.removeChild(a.firstChild) 
    },
    toHTML: function () {
        return this.nodeValue
    }
}

module.exports = VText