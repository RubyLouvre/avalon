import { avalon, oneObject, cssHooks, window } from '../../seed/core'

var cssMap = oneObject('float','cssFloat')
export {
    cssMap,
    cssHooks
}
avalon.cssNumber = oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom')
var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
 /* istanbul ignore next */
avalon.cssName = function (name, host, camelCase) {
    if (cssMap[name]) {
        return cssMap[name]
    }
    host = host || avalon.root.style || {}
    for (var i = 0, n = prefixes.length; i < n; i++) {
        camelCase = avalon.camelize(prefixes[i] + name)
        if (camelCase in host) {
            return (cssMap[name] = camelCase)
        }
    }
    return null
}
 /* istanbul ignore next */
avalon.css = function (node, name, value, fn) {
    //读写删除元素节点的样式
    if (node instanceof avalon) {
        node = node[0]
    }
    if (node.nodeType !== 1) {
        return
    }
    var prop = avalon.camelize(name)
    name = avalon.cssName(prop) || /* istanbul ignore next*/ prop
    if (value === void 0 || typeof value === 'boolean') { //获取样式
        fn = cssHooks[prop + ':get'] || cssHooks['@:get']
        if (name === 'background') {
            name = 'backgroundColor'
        }
        var val = fn(node, name)
        return value === true ? parseFloat(val) || 0 : val
    } else if (value === '') { //请除样式
        node.style[name] = ''
    } else { //设置样式
        if (value == null || value !== value) {
            return
        }
        if (isFinite(value) && !avalon.cssNumber[prop]) {
            value += 'px'
        }
        fn = cssHooks[prop + ':set'] || cssHooks['@:set']
        fn(node, name, value)
    }
}
 /* istanbul ignore next */
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
 /* istanbul ignore next */
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
 /* istanbul ignore next */
avalon.fn.offsetParent = function () {
    var offsetParent = this[0].offsetParent
    while (offsetParent && avalon.css(offsetParent, 'position') === 'static') {
        offsetParent = offsetParent.offsetParent
    }
    return avalon(offsetParent || avalon.root)
}

 /* istanbul ignore next */
cssHooks['@:set'] = function (node, name, value) {
    try {
        //node.style.width = NaN;node.style.width = 'xxxxxxx';
        //node.style.width = undefine 在旧式IE下会抛异常
        node.style[name] = value
    } catch (e) {
    }
}
 /* istanbul ignore next */
cssHooks['@:get'] = function (node, name) {
    if (!node || !node.style) {
        throw new Error('getComputedStyle要求传入一个节点 ' + node)
    }
    var ret, styles = window.getComputedStyle(node, null)
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
 /* istanbul ignore next */
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
/* istanbul ignore next*/
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
        var hidden = []
        showHidden(node, hidden)
        var val = cssHooks[method + ':get'](node)
        for (var i = 0, obj; obj = hidden[i++];) {
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


export function getWindow(node) {
    return node.window || node.defaultView || node.parentWindow || false
}
