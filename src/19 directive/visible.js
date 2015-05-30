function parseDisplay(nodeName, val) {
    //用于取得此类标签的默认display值
    var key = "_" + nodeName
    if (!parseDisplay[key]) {
        var node = DOC.createElement(nodeName)
        root.appendChild(node)
        if (W3C) {
            val = getComputedStyle(node, null).display
        } else {
            val = node.currentStyle.display
        }
        root.removeChild(node)
        parseDisplay[key] = val
    }
    return parseDisplay[key]
}

avalon.parseDisplay = parseDisplay

bindingHandlers.visible = function(data, vmodels) {
    var elem = avalon(data.element)
    var display = elem.css("display")
    if (display === "none") {
        var style = elem[0].style
        var has = /visibility/i.test(style.cssText)
        var visible = elem.css("visibility")
        style.display = ""
        style.visibility = "hidden"
        display = elem.css("display")
        if (display === "none") {
            display = parseDisplay(elem[0].nodeName)
        }
        style.visibility = has ? visible : ""
    }
    data.display = display
    parseExprProxy(data.value, vmodels, data)
}

bindingExecutors.visible = function(val, elem, data) {
    elem.style.display = val ? data.display : "none"
}