// bindingHandlers.html 定义在if.js
bindingExecutors.html = function(val, elem, data) {
    val = val == null ? "" : val
    var isHtmlFilter = "group" in data
    var parent = isHtmlFilter ? elem.parentNode : elem
    if (!parent)
        return
    if (typeof val === "string") {
        var fragment = avalon.parseHTML(val)
    } else if (val.nodeType === 11) { //将val转换为文档碎片
        fragment = val
    } else if (val.nodeType === 1 || val.item) {
        var nodes = val.nodeType === 1 ? val.childNodes : val.item
        fragment = hyperspace.cloneNode(true)
        while (nodes[0]) {
            fragment.appendChild(nodes[0])
        }
    }
    if (!fragment.firstChild) {
        fragment.appendChild(DOC.createComment("ms-html"))
    }
    nodes = avalon.slice(fragment.childNodes)
    //插入占位符, 如果是过滤器,需要有节制地移除指定的数量,如果是html指令,直接清空
    if (isHtmlFilter) {
        var n = data.group,
            i = 1

            data.group = nodes.length
            data.element = nodes[0]

        while (i < n) {
            var node = elem.nextSibling
            if (node) {
                parent.removeChild(node)
                i++
            }
        }
        parent.replaceChild(fragment, elem)
    } else {
        avalon.clearHTML(parent).appendChild(fragment)
    }
    scanNodeArray(nodes, data.vmodels)
}