

function parseDisplay(nodeName, val) {
    //用于取得此类标签的默认display值
    var key = "_" + nodeName
    if (!parseDisplay[key]) {
        var node = document.createElement(nodeName)
        avalon.root.appendChild(node)
        if (avalon.modern) {
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

avalon.directive("visible", {
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-visible'] = " + avalon.parseExpr(binding) + ";\n"
    },
    diff: function (cur, pre) {
        var curValue = !!cur.props['av-visible']
        if (curValue !== Boolean(pre.props['av-visible'])) {
            cur.isShow = curValue
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node, vnode) {
        if (vnode.isShow) {
            var cur = avalon(node).css("display")
            if (!vnode.displayValue && cur !== "none") {
                vnode.displayValue = cur
            }
            if (cur === "none") {
                if (!vnode.displayValue) {
                    vnode.displayValue = parseDisplay(node.nodeName)
                }
                node.style.display = vnode.displayValue
            } else {
                node.style.display = vnode.displayValue
            }
        } else {
            node.style.display = "none"
        }
    }
})