import { avalon, cssHooks } from '../../seed/core'
import { cssMap } from './share'


/* istanbul ignore if */
if (avalon.msie < 9) {
    cssMap['float'] = 'styleFloat'
    var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
    var rposition = /^(top|right|bottom|left)$/
    var ralpha = /alpha\([^)]*\)/i
    var ie8 = avalon.msie === 8
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
        var filter = style.filter || ''
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


avalon.fn.offset = function () { //取得距离页面左右角的坐标
    var node = this[0],
        box = {
            left: 0,
            top: 0
        }
    if (!node || !node.tagName || !node.ownerDocument) {
        return box
    }
    var doc = node.ownerDocument
    var body = doc.body
    var root = doc.documentElement
    var win = doc.defaultView || doc.parentWindow
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
        var node = this[0] || {}
        var win = getWindow(node)
        var root = avalon.root
        var top = method === 'scrollTop'
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

