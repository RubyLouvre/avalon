/************************************************************************
 *              HTML处理(parseHTML, innerHTML, clearHTML)                *
 *************************************************************************/
 
//parseHTML的辅助变量
var svgHooks = {
    g: DOC.createElementNS("http://www.w3.org/2000/svg", "svg")
}
var htmlHook = DOC.createElement("template")
String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function (tag) {
    svgHooks[tag] = svgHooks.g //处理SVG
})
var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
var script = DOC.createElement("script")
var rhtml = /<|&#?\w+;/

avalon.parseHTML = function (html) {
    var fragment = avalonFragment.cloneNode(false)
    if (typeof html !== "string" ) {
        return fragment
    }
    if (!rhtml.test(html)) {
        fragment.appendChild(DOC.createTextNode(html))
        return fragment
    }
    html = html.replace(rxhtml, "<$1></$2>").trim()
    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase()
    var wrapper = svgHooks[tag], firstChild
    if (wrapper) {
        wrapper.innerHTML = html
        var els = wrapper.getElementsByTagName("script")
        if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
            for (var i = 0, el; el = els[i++]; ) {
                if (scriptTypes[el.type]) {
                    var neo = script.cloneNode(false) //FF不能省略参数
                    ap.forEach.call(el.attributes, function (attr) {
                        neo.setAttribute(attr.name, attr.value)
                    })// jshint ignore:line
                    neo.text = el.text
                    el.parentNode.replaceChild(neo, el)
                }
            }
        }
    } else {
        htmlHook.innerHTML = html
        wrapper = htmlHook.content
    }
    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    return fragment
}

avalon.innerHTML = function (node, html) {
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}

avalon.clearHTML = function (node) {
    node.textContent = ""
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
    return node
}
