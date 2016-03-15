var rneedQuote = /[W-]/
var quote = avalon.quote
var directives = avalon.directives
var rbinding = /^(?:ms|av)-(\w+)-?(.*)/
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function parseBindings(props, num, elem) {
    var bindings = []
    var skip = 'ms-skip' in props || 'av-skip' in props
    var ret = ''
    //var attrBinding = ''
    for (var i in props) {
        var value = props[i], match

        if (!skip && value && (match = i.match(rbinding))) {

            var type = match[1]
            var param = match[2] || ''
            var name = i

            if (eventMap[type]) {
                param = type
                type = 'on'
            }
            name = 'av-' + type + (param ? '-' + param : '')
            if (i !== name) {
                delete props[i]
                props[name] = value
            }
            if (directives[type]) {
                var binding = {
                    type: type,
                    param: param,
                    name: name,
                    expr: value,
                    priority: directives[type].priority ||
                            type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, '')) || 0)
                }
//                if (type === 'attr') {
//                    attrBindings += 'attrs[' + quote(param) + '] = ' + avalon.parseExpr(binding) + '\n'
//                } else {
                    bindings.push(binding)
//                }

            }
        } else {
            if (rneedQuote.test(i)) {//收集非绑定属性
                ret += 'vnode' + num + '.props[' + quote(i) + '] = ' + quote(value) + '\n'
            } else {
                ret += 'vnode' + num + '.props.' + i + ' = ' + quote(value) + '\n'
            }
        }
    }
// 考虑是不是外面分散定义ms-attr,然后在内部集中处理
//    if (attrBindings) {
//        bindings.push({
//            type: 'attr',
//            priority: 11600,
//            expr: attrBindings
//        })
//    }

    if (!bindings.length) {
        ret += 'vnode' + num + '.skipAttrs = true\n'
    } else {
        avalon.parseExpr(binding)

        bindings.sort(bindingSorter).forEach(function (binding) {
            ret += directives[binding.type].parse(binding, num, elem)
        })
    }
    return ret

}

function bindingSorter(a, b) {
    return a.priority - b.priority
}

module.exports = parseBindings