//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
var avalon = require('../../seed/core')
if (typeof Node === 'function') {
    if (!document.contains) {
        Node.prototype.contains = function (arg) {
            return !!(this.compareDocumentPosition(arg) & 16)
        }
    }
}
avalon.cloneNode = function(a){
    return a.cloneNode(true)
}
avalon.contains = function (root, el) {
    try {
        while ((el = el.parentNode))
            if (el === root)
                return true
        return false
    } catch (e) {
        return false
    }
}