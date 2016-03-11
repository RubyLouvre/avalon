var Cache = require('../../seed/cache')
var fixScript = require('./fixScript')
var tagHooks = new function () {// jshint ignore:line
    avalon.mix(this, {
        option: document.createElement('select'),
        thead: document.createElement('table'),
        td: document.createElement('tr'),
        area: document.createElement('map'),
        tr: document.createElement('tbody'),
        col: document.createElement('colgroup'),
        legend: document.createElement('fieldset'),
        _default: document.createElement('div'),
        'g': document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    })
    this.optgroup = this.option
    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
    this.th = this.td
}// jshint ignore:line

var svgHooks = {
    g: tagHooks.g
}
String('circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use').replace(avalon.rword, function (tag) {
    svgHooks[tag] = tagHooks.g //处理SVG
})

var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig

var rhtml = /<|&#?\w+;/
var htmlCache = new Cache(128)
var tempateTag = avalon.document.createElement('template')
var htmlHook

if (/HTMLTemplateElement/.test(tempateTag)) {
    htmlHook = tempateTag
} else {
    avalon.mix(tagHooks, svgHooks)
}

avalon.parseHTML = function (html) {
    var fragment = avalon.avalonFragment.cloneNode(false), firstChild
    if (typeof html !== 'string') {
        return fragment
    }
    if (!rhtml.test(html)) {
        fragment.appendChild(document.createTextNode(html))
        return fragment
    }
    html = html.replace(rxhtml, '<$1></$2>').trim()
    var hasCache = htmlCache.get(html)
    if (hasCache) {
        return hasCache.cloneNode(true)
    }
    var tag = (rtagName.exec(html) || ['', ''])[1].toLowerCase()

    var wrapper = svgHooks[tag], firstChild
    if (wrapper) {
        wrapper.innerHTML = html
        //使用innerHTML生成的script节点不会发出请求与执行text属性
        replaceScript(wrapper)
    } else if (htmlHook) {
        htmlHook.innerHTML = html
        wrapper = htmlHook.content
    } else {
        wrapper = tagHooks[tag] || tagHooks._default
        wrapper.innerHTML = html
        replaceScript(wrapper)
    }
    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    hasCache.put(html, fragment.cloneNode(true))
    return fragment
}

avalon.innerHTML = function (node, html) {
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}

avalon.clearHTML = function (node) {
    avalon.each( node.getElementsByTagName('*'), function(i, el){
        avalon.unbind(el)
    })
    node.textContent = ''
    while (node.lastChild) {
        node.removeChild(node.lastChild)
    }
    return node
}