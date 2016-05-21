var root = avalon.root
var window = avalon.window
var camelize = avalon.camelize
var cssHooks = avalon.cssHooks

var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
var cssMap = {
    'float': window.Range ? 'cssFloat' : 'styleFloat'
}
avalon.cssNumber = avalon.oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom')

avalon.cssName = function (name, host, camelCase) {
    if (cssMap[name]) {
        return cssMap[name]
    }
    host = host || root.style || {}
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
    if (this.css('position') === 'fixed') {
        offset = elem.getBoundingClientRect()
    } else {
        offsetParent = this.offsetParent() //得到真正的offsetParent
        offset = this.offset() // 得到正确的offsetParent
        if (offsetParent[0].tagName !== 'HTML') {
            parentOffset = offsetParent.offset()
        }
        parentOffset.top += avalon.css(offsetParent[0], 'borderTopWidth', true)
        parentOffset.left += avalon.css(offsetParent[0], 'borderLeftWidth', true)

        // Subtract offsetParent scroll positions
        parentOffset.top -= offsetParent.scrollTop()
        parentOffset.left -= offsetParent.scrollLeft()
    }
    return {
        top: offset.top - parentOffset.top - avalon.css(elem, 'marginTop', true),
        left: offset.left - parentOffset.left - avalon.css(elem, 'marginLeft', true)
    }
}
avalon.fn.offsetParent = function () {
    var offsetParent = this[0].offsetParent
    while (offsetParent && avalon.css(offsetParent, 'position') === 'static') {
        offsetParent = offsetParent.offsetParent;
    }
    return avalon(offsetParent || root)
}

cssHooks['@:set'] = function (node, name, value) {
    try {
        //node.style.width = NaN;node.style.width = 'xxxxxxx';
        //node.style.width = undefine 在旧式IE下会抛异常
        node.style[name] = value
    } catch (e) {
    }
}

if (window.getComputedStyle) {
    cssHooks['@:get'] = function (node, name) {
        if (!node || !node.style) {
            throw new Error('getComputedStyle要求传入一个节点 ' + node)
        }
        var ret, styles = getComputedStyle(node, null)
        if (styles) {
            ret = name === 'filter' ? styles.getPropertyValue(name) : styles[name]
            if (ret === '') {
                ret = node.style[name] //其他浏览器需要我们手动取内联样式
            }
        }
        return ret
    }
    cssHooks['opacity:get'] = function (node) {
        var ret = cssHooks['@:get'](node, 'opacity')
        return ret === '' ? '1' : ret
    }
} else {
    var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
    var rposition = /^(top|right|bottom|left)$/
    var ralpha = /alpha\([^)]*\)/i
    var ie8 = !!window.XDomainRequest
    var salpha = 'DXImageTransform.Microsoft.Alpha'
    var border = {
        thin: ie8 ? '1px' : '2px',
        medium: ie8 ? '3px' : '4px',
        thick: ie8 ? '5px' : '6px'
    }
    cssHooks['@:get'] = function (node, name) {
        //取得精确值，不过它有可能是带em,pc,mm,pt,%等单位
        var currentStyle = node.currentStyle
        var ret = currentStyle[name]
        if ((rnumnonpx.test(ret) && !rposition.test(ret))) {
            //①，保存原有的style.left, runtimeStyle.left,
            var style = node.style,
                    left = style.left,
                    rsLeft = node.runtimeStyle.left
            //②由于③处的style.left = xxx会影响到currentStyle.left，
            //因此把它currentStyle.left放到runtimeStyle.left，
            //runtimeStyle.left拥有最高优先级，不会style.left影响
            node.runtimeStyle.left = currentStyle.left
            //③将精确值赋给到style.left，然后通过IE的另一个私有属性 style.pixelLeft
            //得到单位为px的结果；fontSize的分支见http://bugs.jquery.com/ticket/760
            style.left = name === 'fontSize' ? '1em' : (ret || 0)
            ret = style.pixelLeft + 'px'
            //④还原 style.left，runtimeStyle.left
            style.left = left
            node.runtimeStyle.left = rsLeft
        }
        if (ret === 'medium') {
            name = name.replace('Width', 'Style')
            //border width 默认值为medium，即使其为0'
            if (currentStyle[name] === 'none') {
                ret = '0px'
            }
        }
        return ret === '' ? 'auto' : border[ret] || ret
    }
    cssHooks['opacity:set'] = function (node, name, value) {
        var style = node.style
        var opacity = isFinite(value) && value <= 1 ? 'alpha(opacity=' + value * 100 + ')' : ''
        var filter = style.filter || '';
        style.zoom = 1
        //不能使用以下方式设置透明度
        //node.filters.alpha.opacity = value * 100
        style.filter = (ralpha.test(filter) ?
                filter.replace(ralpha, opacity) :
                filter + ' ' + opacity).trim()
        if (!style.filter) {
            style.removeAttribute('filter')
        }
    }
    cssHooks['opacity:get'] = function (node) {
        //这是最快的获取IE透明值的方式，不需要动用正则了！
        var alpha = node.filters.alpha || node.filters[salpha],
                op = alpha && alpha.enabled ? alpha.opacity : 100
        return (op / 100) + '' //确保返回的是字符串
    }
}

'top,left'.replace(avalon.rword, function (name) {
    cssHooks[name + ':get'] = function (node) {
        var computed = cssHooks['@:get'](node, name)
        return /px$/.test(computed) ? computed :
                avalon(node).position()[name] + 'px'
    }
})

var cssShow = {
    position: 'absolute',
    visibility: 'hidden',
    display: 'block'
}

var rdisplayswap = /^(none|table(?!-c[ea]).+)/

function showHidden(node, array) {
    //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
    if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
        if (rdisplayswap.test(cssHooks['@:get'](node, 'display'))) {
            var obj = {
                node: node
            }
            for (var name in cssShow) {
                obj[name] = node.style[name]
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
    Width: 'width',
    Height: 'height'
}, function (name, method) {
    var clientProp = 'client' + name,
            scrollProp = 'scroll' + name,
            offsetProp = 'offset' + name
    cssHooks[method + ':get'] = function (node, which, override) {
        var boxSizing = -4
        if (typeof override === 'number') {
            boxSizing = override
        }
        which = name === 'Width' ? ['Left', 'Right'] : ['Top', 'Bottom']
        var ret = node[offsetProp] // border-box 0
        if (boxSizing === 2) { // margin-box 2
            return ret + avalon.css(node, 'margin' + which[0], true) + avalon.css(node, 'margin' + which[1], true)
        }
        if (boxSizing < 0) { // padding-box  -2
            ret = ret - avalon.css(node, 'border' + which[0] + 'Width', true) - avalon.css(node, 'border' + which[1] + 'Width', true)
        }
        if (boxSizing === -4) { // content-box -4
            ret = ret - avalon.css(node, 'padding' + which[0], true) - avalon.css(node, 'padding' + which[1], true)
        }
        return ret
    }
    cssHooks[method + '&get'] = function (node) {
        var hidden = [];
        showHidden(node, hidden);
        var val = cssHooks[method + ':get'](node)
        for (var i = 0, obj; obj = hidden[i++]; ) {
            node = obj.node
            for (var n in obj) {
                if (typeof obj[n] === 'string') {
                    node.style[n] = obj[n]
                }
            }
        }
        return val
    }
    avalon.fn[method] = function (value) { //会忽视其display
        var node = this[0]
        if (arguments.length === 0) {
            if (node.setTimeout) { //取得窗口尺寸
                return node['inner' + name] ||
                        node.document.documentElement[clientProp] ||
                        node.document.body[clientProp] //IE6下前两个分别为undefined,0
            }
            if (node.nodeType === 9) { //取得页面尺寸
                var doc = node.documentElement
                //FF chrome    html.scrollHeight< body.scrollHeight
                //IE 标准模式 : html.scrollHeight> body.scrollHeight
                //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
            }
            return cssHooks[method + '&get'](node)
        } else {
            return this.css(method, value)
        }
    }
    avalon.fn['inner' + name] = function () {
        return cssHooks[method + ':get'](this[0], void 0, -2)
    }
    avalon.fn['outer' + name] = function (includeMargin) {
        return cssHooks[method + ':get'](this[0], void 0, includeMargin === true ? 2 : 0)
    }
})

avalon.fn.offset = function () { //取得距离页面左右角的坐标
    var node = this[0],
            box = {
                left: 0,
                top: 0
            }
    if (!node || !node.tagName || !node.ownerDocument) {
        return box
    }
    var doc = node.ownerDocument,
            body = doc.body,
            root = doc.documentElement,
            win = doc.defaultView || doc.parentWindow
    if (!avalon.contains(root, node)) {
        return box
    }
    //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
    //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
    //http://msdn.microsoft.com/en-us/library/ms536433.aspx
    if (node.getBoundingClientRect) {
        box = node.getBoundingClientRect() // BlackBerry 5, iOS 3 (original iPhone)
    }
    //chrome/IE6: body.scrollTop, firefox/other: root.scrollTop
    var clientTop = root.clientTop || body.clientTop,
            clientLeft = root.clientLeft || body.clientLeft,
            scrollTop = Math.max(win.pageYOffset || 0, root.scrollTop, body.scrollTop),
            scrollLeft = Math.max(win.pageXOffset || 0, root.scrollLeft, body.scrollLeft)
    // 把滚动距离加到left,top中去。
    // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
    // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
    return {
        top: box.top + scrollTop - clientTop,
        left: box.left + scrollLeft - clientLeft
    }
}

//生成avalon.fn.scrollLeft, avalon.fn.scrollTop方法
avalon.each({
    scrollLeft: 'pageXOffset',
    scrollTop: 'pageYOffset'
}, function (method, prop) {
    avalon.fn[method] = function (val) {
        var node = this[0] || {},
                win = getWindow(node),
                top = method === 'scrollTop'
        if (!arguments.length) {
            return win ? (prop in win) ? win[prop] : root[method] : node[method]
        } else {
            if (win) {
                win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
            } else {
                node[method] = val
            }
        }
    }
})

function getWindow(node) {
    return node.window || node.defaultView || node.parentWindow || false
}