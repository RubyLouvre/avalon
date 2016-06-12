
var propMap = require('./propMap')
var isVML = require('./isVML')
var rsvg =/^\[object SVG\w*Element\]$/
var ramp = /&amp;/g

function attrUpdate(node, vnode) {
    var attrs = vnode.changeAttr
    if (!node || node.nodeType !== 1 ) {
        return
    }
    if (attrs) {
        for (var attrName in attrs) {
            var val = attrs[attrName]
            // 处理路径属性
            if (attrName === 'href' || attrName === 'src') {
                if (!node.hasAttribute) {
                    val = String(val).replace(ramp, '&') //处理IE67自动转义的问题
                }
                node[attrName] = val
                if (window.chrome && node.tagName === 'EMBED') {
                    var parent = node.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                    var comment = document.createComment('ms-src')
                    parent.replaceChild(comment, node)
                    parent.replaceChild(node, comment)
                }
                //处理HTML5 data-*属性
            } else if (attrName.indexOf('data-') === 0) {
                node.setAttribute(attrName, val)

            } else {
                var propName = propMap[attrName] || attrName
                if (typeof node[propName] === 'boolean') {
                    node[propName] = !!val
                  
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                }

                if (val === false ) {//移除属性
                    node.removeAttribute(propName)
                    continue
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
                //HTML的固有属性必须node.xxx = yyy
             
                var isInnate = rsvg.test(node) ? false :
                        (!avalon.modern && isVML(node)) ? true :
                        attrName in node.cloneNode(false)
                if (isInnate) {
                    node[propName] = val + ''
                } else {
                    node.setAttribute(attrName, val)
                }

            }

        }
        vnode.changeAttr = null
    }
}

var rvalidchars = /^[\],:{}\s]*$/,
    rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
    rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
    rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g

avalon.parseJSON = avalon.window.JSON ? JSON.parse : function (data) {
    if (typeof data === 'string') {
        data = data.trim();
        if (data) {
            if (rvalidchars.test(data.replace(rvalidescape, '@')
                    .replace(rvalidtokens, ']')
                    .replace(rvalidbraces, ''))) {
                return (new Function('return ' + data))() // jshint ignore:line
            }
        }
        avalon.error('Invalid JSON: ' + data)
    }
    return data
}


avalon.fn.attr = function (name, value) {
    if (arguments.length === 2) {
        this[0].setAttribute(name, value)
        return this
    } else {
        return this[0].getAttribute(name)
    }
}

module.exports = attrUpdate