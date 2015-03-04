/************************************************************************
 *              HTML处理(parseHTML, innerHTML, clearHTML)                 *
 **************************************************************************/
//parseHTML的辅助变量
var tagHooks = new function() {
    avalon.mix(this, {
        option: DOC.createElement("select"),
        thead: DOC.createElement("table"),
        td: DOC.createElement("tr"),
        area: DOC.createElement("map"),
        tr: DOC.createElement("tbody"),
        col: DOC.createElement("colgroup"),
        legend: DOC.createElement("fieldset"),
        _default: DOC.createElement("div"),
        "g": DOC.createElementNS("http://www.w3.org/2000/svg", "svg")
    })
    this.optgroup = this.option
    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
    this.th = this.td
}

String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function(tag) {
    tagHooks[tag] = tagHooks.g //处理SVG
})
var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
var script = DOC.createElement("script")

avalon.parseHTML = function(html) {
    if (typeof html !== "string" ) {
        return DOC.createDocumentFragment()
    }
    html = html.replace(rxhtml, "<$1></$2>").trim()
    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
            //取得其标签名
            wrapper = tagHooks[tag] || tagHooks._default,
            fragment = hyperspace.cloneNode(false),
            firstChild
    wrapper.innerHTML = html
    var els = wrapper.getElementsByTagName("script")
    if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
        for (var i = 0, el; el = els[i++]; ) {
            if (scriptTypes[el.type]) {
                var neo = script.cloneNode(false) //FF不能省略参数
                ap.forEach.call(el.attributes, function(attr) {
                    neo.setAttribute(attr.name, attr.value)
                })
                neo.text = el.text
                el.parentNode.replaceChild(neo, el)
            }
        }
    }

    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    return fragment
}

avalon.innerHTML = function(node, html) {
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}

avalon.clearHTML = function(node) {
    node.textContent = ""
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
    return node
}
