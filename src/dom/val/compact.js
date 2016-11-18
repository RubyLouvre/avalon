import { avalon, msie } from '../../seed/core'
import { getDuplexType } from './getDuplexType'
import { getOption } from './option.compact'
export { getOption, getDuplexType }

var valHooks = {
    'option:get': msie ? getOption : function (node) {
        return node.value
    },
    'select:get': function (node, value) {
        var option, options = node.options,
            index = node.selectedIndex,
            getter = valHooks['option:get'],
            one = node.type === 'select-one' || index < 0,
            values = one ? null : [],
            max = one ? index + 1 : options.length,
            i = index < 0 ? max : one ? index : 0
        for (; i < max; i++) {
            option = options[i]
            //IE6-9在reset后不会改变selected，需要改用i === index判定
            //我们过滤所有disabled的option元素，但在safari5下，
            //如果设置optgroup为disable，那么其所有孩子都disable
            //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
            if ((option.selected || i === index) && !option.disabled &&
                (!option.parentNode.disabled || option.parentNode.tagName !== 'OPTGROUP')
            ) {
                value = getter(option)
                if (one) {
                    return value
                }
                //收集所有selected值组成数组返回
                values.push(value)
            }
        }
        return values
    },
    'select:set': function (node, values, optionSet) {
        values = [].concat(values) //强制转换为数组
        var getter = valHooks['option:get']
        for (var i = 0, el; el = node.options[i++];) {
            if ((el.selected = values.indexOf(getter(el)) > -1)) {
                optionSet = true
            }
        }
        if (!optionSet) {
            node.selectedIndex = -1
        }
    }
}

avalon.fn.val = function (value) {
    var node = this[0]
    if (node && node.nodeType === 1) {
        var get = arguments.length === 0
        var access = get ? ':get' : ':set'
        var fn = valHooks[getDuplexType(node) + access]
        if (fn) {
            var val = fn(node, value)
        } else if (get) {
            return (node.value || '').replace(/\r/g, '')
        } else {
            node.value = value
        }
    }
    return get ? val : this
}