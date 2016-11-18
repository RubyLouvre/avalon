import { avalon, window, document } from '../../seed/core'
import { propMap } from './propMap'

var rsvg = /^\[object SVG\w*Element\]$/
export function updateAttrs(node, attrs) {
    for (var attrName in attrs) {
        var val = attrs[attrName]
        /* istanbul ignore if*/
        if (attrName.indexOf('data-') === 0 || rsvg.test(node)) {
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
            var isInnate = attrName in node.cloneNode(false)
            if (isInnate) {
                node[propName] = val + ''
            } else {
                node.setAttribute(attrName, val)
            }
        }
    }
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

