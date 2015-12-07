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

avalon.directive("visible", {
    init: function (binding) {
        effectBinding(binding.element, binding)
    },
    update: function (val) {
        var binding = this, elem = this.element, stamp
        var noEffect = !this.effectName
        if (!this.stamp) {
            stamp = this.stamp = +new Date()
            if (val) {
                elem.style.display = binding.display || ""
                if (avalon(elem).css("display") === "none") {
                    elem.style.display = binding.display = parseDisplay(elem.nodeName)
                }
            } else {
                elem.style.display = "none"
            }
            return
        }
        stamp = this.stamp = +new Date()
        if (val) {
            avalon.effect.apply(elem, 1, function () {
                if (stamp !== binding.stamp)
                    return
                var driver = elem.getAttribute("data-effect-driver") || "a"

                if (noEffect) {//不用动画时走这里
                    elem.style.display = binding.display || ""
                }
                // "a", "t"
                if (driver === "a" || driver === "t") {
                    if (avalon(elem).css("display") === "none") {
                        elem.style.display = binding.display || parseDisplay(elem.nodeName)
                    }
                }
            })
        } else {
            avalon.effect.apply(elem, 0, function () {
                if (stamp !== binding.stamp)
                    return
                elem.style.display = "none"
            })
        }
    }
})
