var rneedQuote = /[W-]/
var quote = avalon.quote
var directives = avalon.directives
var rbinding = require('../../seed/regexp').binding
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function parseBindings(props, num, elem) {
    var bindings = []
    var skip = 'ms-skip' in props 
    var ret = ''
    for (var i in props) {
        var value = props[i], match

        if (!skip && value && (match = i.match(rbinding))) {
            var type = match[1]
            var param = match[2] || ''
            var name = i

            if (eventMap[type]) {
                var order = parseFloat(param) || 0
                param = type
                type = 'on'
            }
            name = 'ms-' + type + (param ? '-' + param : '')
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
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }
                if (type === 'on') {
                    binding.name += '-' + order
                    binding.priority += param.charCodeAt(0) * 100 + order
                }

                bindings.push(binding)

            }
        } else {
            if (rneedQuote.test(i)) {//收集非绑定属性
                ret += 'vnode' + num + '.props[' + quote(i) + '] = ' + quote(value) + '\n'
            } else {
                ret += 'vnode' + num + '.props.' + i + ' = ' + quote(value) + '\n'
            }
        }
    }

    if (!bindings.length) {
        ret += '\tvnode' + num + '.skipAttrs = true\n'
    } else {
        avalon.parseExpr(binding)

        bindings.sort(byPriority).forEach(function (binding) {
            ret += directives[binding.type].parse(binding, num, elem)
        })
    }
    return ret

}

function byPriority(a, b) {
    return a.priority - b.priority
}

module.exports = parseBindings