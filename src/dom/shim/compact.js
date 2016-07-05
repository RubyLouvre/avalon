function fixContains(root, el) {
    try { //IE6-8,游离于DOM树外的文本节点，访问parentNode有时会抛错
        while ((el = el.parentNode))
            if (el === root)
                return true
        return false
    } catch (e) {
        return false
    }
}

avalon.contains = fixContains
//IE6-11的文档对象没有contains
if (!avalon.document.contains) {
    avalon.document.contains = function (b) {
        return fixContains(document, b)
    }
}

if (window.Node && !document.createTextNode('x').contains) {
    Node.prototype.contains = function (arg) {//IE6-8没有Node对象
        return !!(this.compareDocumentPosition(arg) & 16)
    }
}

//firefox 到11时才有outerHTML
if (window.HTMLElement && !avalon.root.outerHTML) {
    HTMLElement.prototype.__defineGetter__('outerHTML', function () {
        var div = document.createElement('div')
        div.appendChild(this)
        return div.innerHTML
    })
}


