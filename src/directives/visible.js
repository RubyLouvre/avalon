var builtin = require("../base/builtin")
var document = builtin.document
var W3C = builtin.W3C
var root = builtin.root
var addHooks = require("../vdom/hooks").addHooks
function parseDisplay(nodeName, val) {
    //用于取得此类标签的默认display值
    var key = "_" + nodeName
    if (!parseDisplay[key]) {
        var node = document.createElement(nodeName)
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

avalon.directive("visible", {
    is: function (a, b) {
        return Boolean(a) === Boolean(b)
    },
    change: function (val, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        vnode.isShow = val
        addHooks(this, binding)
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