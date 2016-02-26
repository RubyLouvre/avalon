var oneObject = require("../base/builtin").oneObject

var directives = avalon.directives


var eventMap = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")

var rmsAttr = /^(?:ms|av)-(\w+)-?(.*)/
function parseBindings(props, num) {
    var bindings = []
    for (var i in props) {
        var value = props[i], match
        if (i === "av-skip") {
            return  "vnode" + num + ".skipAttrs = true\n"
        }
        if (value && (match = i.match(rmsAttr))) {
            var type = match[1]
            var param = match[2] || ""
            var name = i
            if (eventMap[type]) {
                param = type
                type = "on"
                delete props[name]
                name = "av-on-"+param
                props[name] = value
            }
            
            if (directives[type]) {

                var binding = {
                    type: type,
                    param: param,
                    name: name,
                    expr: value,
                    priority: directives[type].priority ||
                            type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, "")) || 0)
                }

                bindings.push(binding)
            }
        }
    }

    if (!bindings.length) {
        return "vnode" + num + ".skipAttrs = true\n"
    }
    var ret = ""
    bindings.sort(bindingSorter).forEach(function (binding) {
        ret += directives[binding.type].parse(binding, num)
    })
    return ret

}
function bindingSorter(a, b) {
    return a.priority - b.priority
}

module.exports = parseBindings