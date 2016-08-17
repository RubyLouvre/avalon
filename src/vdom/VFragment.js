function VFragment(a) {
    this.nodeName = '#document-fragment'
    this.children = a
}

VFragment.prototype = {
    constructor: VFragment,
    toDOM: function () {
        if (this.dom)
            return this.dom
        var f = document.createDocumentFragment()
        for (var i = 0, el; el = this.children[i++]; ) {
            f.appendChild(avalon.vdomAdaptor(el, 'toDOM'))
        }
        this.split = f.lastChild
        return  this.dom = f
    },
    toHTML: function () {
        return this.children.map(function (a) {
            return avalon.vdomAdaptor(a, 'toHTML')
        }).join('')
    }
}

module.exports = VFragment