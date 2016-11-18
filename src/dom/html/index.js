import {avalon, Cache, document, createFragment} from '../../seed/core'
import {fromString} from '../../vtree/fromString'
export {avalon}

var rhtml = /<|&#?\w+;/
var htmlCache = new Cache(128)
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig

avalon.parseHTML = function (html) {
    var fragment = createFragment()
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
        return avalon.cloneNode(hasCache)
    }
    var vnodes = fromString(html)
    for (var i = 0, el; el = vnodes[i++]; ) {
        var child = avalon.vdom(el, 'toDOM')
        fragment.appendChild(child)
    }
    if (html.length < 1024) {
        htmlCache.put(html, fragment)
    }
    return fragment
}

avalon.innerHTML = function (node, html) {
    var parsed = avalon.parseHTML(html)
    this.clearHTML(node)
    node.appendChild(parsed)
}

//https://github.com/karloespiritu/escapehtmlent/blob/master/index.js
avalon.unescapeHTML = function (html) {
    return String(html)
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, '\'')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&')
}



avalon.clearHTML = function (node) {
    /* istanbul ignore next */
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}

       