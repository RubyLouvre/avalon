function getValType(elem) {
    var ret = elem.tagName.toLowerCase()
    return ret === 'input' && /checkbox|radio/.test(elem.type) ? 'checked' : ret
}
var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
var valHooks = {
    'option:get': avalon.msie ? function (node) {
        //在IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
        //specified并不可靠，因此通过分析outerHTML判定用户有没有显示定义value
        return roption.test(node.outerHTML) ? node.value : node.text.trim()
    } : function (node) {
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
        for (var i = 0, el; el = node.options[i++]; ) {
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
        var fn = valHooks[getValType(node) + access]
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