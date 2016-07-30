var directives = avalon.directives
var rbinding = /^(\:|ms\-)\w+/
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function extractBindings(cur, props) {
    var bindings = []
    var cprops = cur.props
    var skip = 'ms-skip' in props

    for (var i in props) {
        var value = props[i], match

        if ((match = i.match(rbinding))) {
            if (skip)
                continue

            var arr = i.replace(match[1], '').split('-')
            
            if (eventMap[arr[0]]) {
                arr.unshift('on')
            }
            if (arr[0] === 'on') {
                arr[2] = parseFloat(arr[2]) || 0
            }
            arr.unshift('ms')
            var type = arr[1]
            if (directives[type]) {
                var binding = {
                    type: type,
                    param: arr[2],
                    name: arr.join('-'),
                    expr: value,
                    priority: directives[type].priority || type.charCodeAt(0) * 100
                }
                if (type === 'on') {
                    binding.priority += arr[3]
                }
                if (!cprops[binding.name]) {
                    cprops[binding.name] = 1
                    bindings.push(binding)
                }
            }
            
        } else {
            cprops[i] = props[i]
        }
    }
    bindings.sort(byPriority)

    return bindings
}

function byPriority(a, b) {
    return a.priority - b.priority
}

module.exports = extractBindings
