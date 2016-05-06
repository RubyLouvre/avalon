var Cache = require('../../seed/cache')
var fixScript = require('./fixScript')
var fixTbodyVML = require('./fixTbodyVML')
var fixCloneNode = require('./fixCloneNode')

var tagHooks = {
    area: [1, '<map>', '</map>'],
    param: [1, '<object>', '</object>'],
    col: [2, '<table><colgroup>', '</colgroup></table>'],
    legend: [1, '<fieldset>', '</fieldset>'],
    option: [1, '<select multiple="multiple">', '</select>'],
    thead: [1, '<table>', '</table>'],
    tr: [2, '<table>', '</table>'],
    td: [3, '<table><tr>', '</tr></table>'],
    g: [1, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">', '</svg>'],
    //IE6-8在用innerHTML生成节点时，不能直接创建no-scope元素与HTML5的新标签
    _default: avalon.modern ? [0, '', ''] : [1, 'X<div>', '</div>'] //div可以不用闭合
}
tagHooks.th = tagHooks.td
tagHooks.optgroup = tagHooks.option
tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
String('circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use').replace(avalon.rword, function (tag) {
    tagHooks[tag] = tagHooks.g //处理SVG
})

var rtagName = /<([\w:]+)/ //取得其tagName
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var rcreate = avalon.modern ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig
var rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/ //需要处理套嵌关系的标签
var rhtml = /<|&#?\w+;/
var htmlCache = new Cache(128)
avalon.parseHTML = function (html) {
    var fragment = avalon.avalonFragment.cloneNode(false), firstChild
    //处理非字符串
    if (typeof html !== 'string') {
        return fragment
    }
    //处理非HTML字符串
    if (!rhtml.test(html)) {
        fragment.appendChild(document.createTextNode(html))
        return fragment
    }

    html = html.replace(rxhtml, '<$1></$2>').trim()
    var hasCache = htmlCache.get(html)
    if (hasCache) {
        return fixCloneNode(hasCache)
    }

    var tag = (rtagName.exec(html) || ['', ''])[1].toLowerCase()
    var wrap = tagHooks[tag] || tagHooks._default
    var wrapper = avalon.avalonDiv

    wrapper.innerHTML = wrap[1] + html + wrap[2]

    //使用innerHTML生成的script节点不会发出请求与执行text属性
    fixScript(wrapper)

    if (!avalon.modern) { //fix IE
        fixTbodyVML(wrapper, wrap, tag)
    }

    //移除我们为了符合套嵌关系而添加的标签
    for (var i = wrap[0]; i--; wrapper = wrapper.lastChild) {
    }
    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
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
    avalon.$$unbind(node)
    node.textContent = ''
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}

