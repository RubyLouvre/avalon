var root = avalon.root
var camelize = avalon.camelize
var cssHooks = avalon.cssHooks

var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
var cssMap = {
    'float': 'cssFloat'
}

avalon.cssNumber = avalon.oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom')

avalon.cssName = function (name, host, camelCase) {
    if (cssMap[name]) {
        return cssMap[name]
    }
    host = host || root.style
    for (var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = camelize(prefixes[i] + name)
        if (camelCase in host) {
            return (cssMap[name] = camelCase)
        }
    }
    return null
}


avalon.fn.css = function (name, value) {
    if (avalon.isPlainObject(name)) {
        for (var i in name) {
            avalon.css(this, i, name[i])
        }
    } else {
        var ret = avalon.css(this, name, value)
    }
    return ret !== void 0 ? ret : this
}

avalon.fn.position = function () {
    var offsetParent, offset,
            elem = this[0],
            parentOffset = {
                top: 0,
                left: 0
            }
    if (!elem) {
        return parentOffset
    }
    if (this.css("position") === "fixed") {
        offset = elem.getBoundingClientRect()
    } else {
        offsetParent = this.offsetParent() //得到真正的offsetParent
        offset = this.offset() // 得到正确的offsetParent
        if (offsetParent[0].tagName !== "HTML") {
            parentOffset = offsetParent.offset()
        }
        parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
        parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)

        // Subtract offsetParent scroll positions
        parentOffset.top -= offsetParent.scrollTop()
        parentOffset.left -= offsetParent.scrollLeft()
    }
    return {
        top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
        left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
    }
}
avalon.fn.offsetParent = function () {
    var offsetParent = this[0].offsetParent
    while (offsetParent && avalon.css(offsetParent, "position") === "static") {
        offsetParent = offsetParent.offsetParent;
    }
    return avalon(offsetParent || root)
}


cssHooks["@:set"] = function (node, name, value) {
    node.style[name] = value
}

cssHooks["@:get"] = function (node, name) {
    if (!node || !node.style) {
        throw new Error("getComputedStyle要求传入一个节点 " + node)
    }
    var ret, computed = getComputedStyle(node)
    if (computed) {
        ret = name === "filter" ? computed.getPropertyValue(name) : computed[name]
        if (ret === "") {
            ret = node.style[name] //其他浏览器需要我们手动取内联样式
        }
    }
    return ret
}
cssHooks["opacity:get"] = function (node) {
    var ret = cssHooks["@:get"](node, "opacity")
    return ret === "" ? "1" : ret
}

"top,left".replace(avalon.rword, function (name) {
    cssHooks[name + ":get"] = function (node) {
        var computed = cssHooks["@:get"](node, name)
        return /px$/.test(computed) ? computed :
                avalon(node).position()[name] + "px"
    }
})

var cssShow = {
    position: "absolute",
    visibility: "hidden",
    display: "block"
}
var rdisplayswap = /^(none|table(?!-c[ea]).+)/

function showHidden(node, array) {
    //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
    if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
        var styles = getComputedStyle(node, null)
        if (rdisplayswap.test(styles["display"])) {
            var obj = {
                node: node
            }
            for (var name in cssShow) {
                obj[name] = styles[name]
                node.style[name] = cssShow[name]
            }
            array.push(obj)
        }
        var parent = node.parentNode
        if (parent && parent.nodeType === 1) {
            showHidden(parent, array)
        }
    }
}

avalon.each({
    Width: "width",
    Height: "height"
}, function (name, method) {
    var clientProp = "client" + name,
            scrollProp = "scroll" + name,
            offsetProp = "offset" + name
    cssHooks[method + ":get"] = function (node, which, override) {
        var boxSizing = -4
        if (typeof override === "number") {
            boxSizing = override
        }
        which = name === "Width" ? ["Left", "Right"] : ["Top", "Bottom"]
        var ret = node[offsetProp] // border-box 0
        if (boxSizing === 2) { // margin-box 2
            return ret + avalon.css(node, "margin" + which[0], true) + avalon.css(node, "margin" + which[1], true)
        }
        if (boxSizing < 0) { // padding-box  -2
            ret = ret - avalon.css(node, "border" + which[0] + "Width", true) - avalon.css(node, "border" + which[1] + "Width", true)
        }
        if (boxSizing === -4) { // content-box -4
            ret = ret - avalon.css(node, "padding" + which[0], true) - avalon.css(node, "padding" + which[1], true)
        }
        return ret
    }
    cssHooks[method + "&get"] = function (node) {
        var hidden = [];
        showHidden(node, hidden);
        var val = cssHooks[method + ":get"](node)
        for (var i = 0, obj; obj = hidden[i++]; ) {
            node = obj.node
            for (var n in obj) {
                if (typeof obj[n] === "string") {
                    node.style[n] = obj[n]
                }
            }
        }
        return val;
    }
    avalon.fn[method] = function (value) { //会忽视其display
        var node = this[0]
        if (arguments.length === 0) {
            if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                return node["inner" + name]
            }
            if (node.nodeType === 9) { //取得页面尺寸
                var doc = node.documentElement
                //FF chrome    html.scrollHeight< body.scrollHeight
                //IE 标准模式 : html.scrollHeight> body.scrollHeight
                //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
            }
            return cssHooks[method + "&get"](node)
        } else {
            return this.css(method, value)
        }
    }
    avalon.fn["inner" + name] = function () {
        return cssHooks[method + ":get"](this[0], void 0, -2)
    }
    avalon.fn["outer" + name] = function (includeMargin) {
        return cssHooks[method + ":get"](this[0], void 0, includeMargin === true ? 2 : 0)
    }
})

avalon.fn.offset = function () { //取得距离页面左右角的坐标
    var node = this[0]
    try {
        var rect = node.getBoundingClientRect()
        // Make sure element is not hidden (display: none) or disconnected
        // https://github.com/jquery/jquery/pull/2043/files#r23981494
        if (rect.width || rect.height || node.getClientRects().length) {
            var doc = node.ownerDocument
            var root = doc.documentElement
            var win = doc.defaultView
            return {
                top: rect.top + win.pageYOffset - root.clientTop,
                left: rect.left + win.pageXOffset - root.clientLeft
            }
        }
    } catch (e) {
        return {
            left: 0,
            top: 0
        }
    }
}

avalon.each({
    scrollLeft: "pageXOffset",
    scrollTop: "pageYOffset"
}, function (method, prop) {
    avalon.fn[method] = function (val) {
        var node = this[0] || {},
                win = getWindow(node),
                top = method === "scrollTop"
        if (!arguments.length) {
            return win ? win[prop] : node[method]
        } else {
            if (win) {
                win.scrollTo(!top ? val : win[prop], top ? val : win[prop])
            } else {
                node[method] = val
            }
        }
    }
})

function getWindow(node) {
    return node.window || node.defaultView || false
}