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
    var vnodes = avalon.lexer(html)
    for (var i = 0, el; el = vnodes[i++]; ) {
        fragment.appendChild(avalon.vdomAdaptor(el, 'toDOM'))
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

var reunescapeHTML = /&(?:amp|lt|gt|quot|#39|#96);/g
var htmlUnescapes = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&#96;': '`'
}
avalon.unescapeHTML = function (string) {
    var str = '' + string
    return str.replace(reunescapeHTML, function (c) {
        return htmlUnescapes[c]
    })
}

var rescapeHTML = /["'&<>]/
//https://github.com/nthtran/vdom-to-html
//将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
avalon.escapeHTML = function (string) {
    var str = '' + string
    var match = rescapeHTML.exec(str)

    if (!match) {
        return str
    }

    var escape
    var html = ''
    var index = 0
    var lastIndex = 0

    for (index = match.index; index < str.length; index++) {
        switch (str.charCodeAt(index)) {
            case 34: // "
                escape = '&quot;'
                break
            case 38: // &
                escape = '&amp;'
                break
            case 39: // '
                escape = '&#39;'
                break
            case 60: // <
                escape = '&lt;'
                break
            case 62: // >
                escape = '&gt;'
                break
            default:
                continue
        }

        if (lastIndex !== index) {
            html += str.substring(lastIndex, index)
        }

        lastIndex = index + 1
        html += escape
    }

    return lastIndex !== index
            ? html + str.substring(lastIndex, index)
            : html
}

avalon.clearHTML = function (node) {
    node.textContent = ''
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}
