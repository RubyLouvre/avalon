var Cache = require('../../seed/cache')

var fixCloneNode = require('./fixCloneNode')

var rhtml = /<|&#?\w+;/
var htmlCache = new Cache(128)
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig

avalon.parseHTML = function (html) {
    var fragment = avalon.avalonFragment.cloneNode(false)
    //处理非字符串
    if (typeof html !== 'string') {
        return fragment
    }
    //处理非HTML字符串
    if (!rhtml.test(html)) {
        return document.createTextNode(html)
    }

    html = html.replace(rxhtml, '<$1></$2>').trim()
    var hasCache = htmlCache.get(html)
    if (hasCache) {
        return fixCloneNode(hasCache)
    }
    var vnodes = avalon.lexer(html, false, 1000)
    for(var i = 0, el; el = vnodes[i++];){
        fragment.appendChild(avalon.vdomAdaptor(el,'toDOM'))
    }
    if (html.length < 1024) {
        htmlCache.put(html, fixCloneNode(fragment))
    }
    return fragment
}

avalon.innerHTML = function (node, html) {
    if (!avalon.modern && (!rcreate.test(html) && !rnest.test(html))) {
        try {
            node.innerHTML = html
            return
        } catch (e) {
        }
    }
    var parsed = this.parseHTML(html)
    this.clearHTML(node).appendChild(parsed)
}

avalon.clearHTML = function (node) {
    node.textContent = ''
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}

