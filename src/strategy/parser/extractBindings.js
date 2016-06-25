var directives = avalon.directives
var rbinding = require('../../seed/regexp').binding
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function extractBindings(cur, props) {
    var bindings = []
    var skip = 'ms-skip' in props
    var uniq = {}
    for (var i in props) {
        var value = props[i], match

        if (!skip && (match = i.match(rbinding))) {
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
                    order = order || 0
                    binding.name += '-' + order
                    binding.priority += param.charCodeAt(0) * 100 + order
                }
                if (!uniq[binding.name]) {
                    uniq[binding.name] = 1
                    bindings.push(binding)
                }
            }
        } else {
            cur.props[i] = props[i]
        }
    }
    bindings.sort(byPriority)

    return bindings
}

function byPriority(a, b) {
    return a.priority - b.priority
}

module.exports = extractBindings
