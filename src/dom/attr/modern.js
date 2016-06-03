var propMap = require('./propMap')
var rsvg = /^\[object SVG\w*Element\]$/

function attrUpdate(node, vnode) {
    var attrs = vnode.changeAttr
    if (attrs) {
        for (var attrName in attrs) {
            var val = attrs[attrName]
            // switch
            if (attrName === 'src' && window.chrome && node.tagName === 'EMBED') {
                node[attrName] = val
                var parent = node.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                var comment = document.createComment('ms-src')
                parent.replaceChild(comment, node)
                parent.replaceChild(node, comment)
            } else if (attrName.indexOf('data-') == 0) {
                node.setAttribute(attrName, val)
            } else {
                var propName = propMap[attrName] || attrName
                if (typeof node[propName] === 'boolean') {
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                    node[propName] = !!val
                }
                if (val === false) {
                    node.removeAttribute(attrName)
                    continue
                }

                //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
                //HTML的固有属性必须node.xxx = yyy
                var isInnate = rsvg.test(node) ? false : attrName in node.cloneNode(false)
                if (isInnate) {
                    node[propName] = val + ''
                } else {
                    node.setAttribute(attrName, val)
                }
            }
        }
    }
    vnode.changeAttr = null
}

avalon.parseJSON = JSON.parse

avalon.fn.attr = function (name, value) {
    if (arguments.length === 2) {
        this[0].setAttribute(name, value)
        return this
    } else {
        return this[0].getAttribute(name)
    }
}


module.exports = attrUpdate