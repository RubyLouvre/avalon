function getValType(elem) {
    var ret = elem.tagName.toLowerCase()
    return ret === 'input' && /checkbox|radio/.test(elem.type) ? 'checked' : ret
}
var valHooks = {
    'select:get': function self(node, ret, index, singleton) {
        var nodes = node.children, value,
                getter = valHooks['option:get']
        index = ret ? index : node.selectedIndex
        singleton = ret ? singleton : node.type === 'select-one' || index < 0
        ret = ret || []
        for (var i = 0, el; el = nodes[i++]; ) {
            if (!el.disabled) {
                switch (el.nodeName.toLowerCase()) {
                    case 'option':
                        if ((el.selected || el.index === index)) {
                            value = el.value
                            if (singleton) {
                                return value
                            } else {
                                ret.push(value)
                            }
                        }
                        break
                    case 'optgroup':
                        value = self(el, ret, index, singleton)
                        if (typeof value === 'string') {
                            return value
                        }
                        break
                }
            }
        }
        return singleton ? null : ret
    },
    'select:set': function (node, values, optionSet) {
        values = [].concat(values) //强制转换为数组
        for (var i = 0, el; el = node.options[i++]; ) {
            if ((el.selected = values.indexOf(el.value) > -1)) {
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