var directives = avalon.directives
var rbinding = /^(\:|ms\-)\w+/
var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

function extractBindings(cur, props) {
    var bindings = []
    var attrs = {}
    var skip = 'ms-skip' in props//old
    var uniq = {}
    for (var i in props) {
        var value = props[i], match
        attrs[i] = props[i]
        if ((match = i.match(rbinding))) {
            /* istanbul ignore if  */
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
                if (!uniq[binding.name]) {
                    uniq[binding.name] = value
                    bindings.push(binding)
                }
            }
        } 
    }

    cur.props = attrs

    bindings.sort(byPriority)

    return bindings
}

function byPriority(a, b) {
    return a.priority - b.priority
}

module.exports = extractBindings

/*
 * avalon有两种实现虚拟DOM的机制
 * 一是从文本转换为虚拟DOM
 * 二是从DOM转换为虚拟DOM
 * 
 * 文本转换为虚拟DOM,主要是用于后端渲染或组件渲染,好处是性能好,坏处是要自己处理option,tbody等特殊情况 
 * DOM转换为虚拟DOM,主要是用于前端的首次渲染,可以有效避开浏览器兼容性
 * 
 * 
 * 
 */
