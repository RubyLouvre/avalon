//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
if (!avalon.document.contains) {
    Node.prototype.contains = function (arg) {
        return !!(this.compareDocumentPosition(arg) & 16)
    }
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



