import { avalon, directives } from '../seed/core'
export var eventMap = avalon.oneObject('animationend,blur,change,input,' +
    'click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,' +
    'mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit', 'on')
export function parseAttributes(dirs, node) {
    var uniq = {},
        bindings = [],
        props = node.props,
        hasIf = false
    for (var name in dirs) {
        var value = dirs[name]
        var arr = name.split('-')
            // ms-click
        if (name in props) {
            var attrName = name
        } else {
            attrName = ':' + name.slice(3)
        }
        if (eventMap[arr[1]]) {
            arr.splice(1, 0, 'on')
        }
        //ms-on-click
        if (arr[1] === 'on') {
            arr[3] = parseFloat(arr[3]) || 0
        }

        var type = arr[1]

        if (directives[type]) {
            delete props[attrName]
            var binding = {
                type: type,
                param: arr[2],
                name: attrName,
               
                expr: value,
                priority: directives[type].priority || type.charCodeAt(0) * 100
            }
//            var uuid = arr.join('-')
//            if(uuid !== attrName){
//                binding.uuid = uuid
//            }
            avalon.mix(binding, directives[type])

            if (type === 'on') {
                binding.priority += arr[3]
            }
            if (!uniq[binding.name]) {
                uniq[binding.name] = value
                bindings.push(binding)
                if (type === 'for') {
                    return [avalon.mix(binding, tuple[3])]
                }
            }

        }
    }
    bindings.sort(byPriority)
    return bindings
}
export function byPriority(a, b) {
    return a.priority - b.priority
}