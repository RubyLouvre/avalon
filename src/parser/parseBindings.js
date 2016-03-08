var vars = require("../base/builtin")

var quote = vars.quote
var oneObject = vars.oneObject

var directives = avalon.directives

var priorityMap = {
    "if": 10,
    "repeat": 90,
    "data": 100,
    "each": 1400,
    "with": 1500,
    "duplex": 20000,
    "on": 30000
}
var eventMap = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
var rnovar = /W/
var rmsAttr = /^(?:ms|av)-(\w+)-?(.*)/
function parseBindings(props, num, elem) {
    var bindings = []
    var skip = "ms-skip" in props || "av-skip" in props
    var ret = ""
    for (var i in props) {
        var value = props[i], match

        if (!skip && value && (match = i.match(rmsAttr))) {

            var type = match[1]
            var param = match[2] || ""
            var name = i

            if (eventMap[type]) {
                param = type
                type = "on"
            }
            name = "av-" + type + (param ? "-" + param : "")
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
                            type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, "")) || 0)
                }
                bindings.push(binding)
            }
        } else {
            if (rnovar.test(i)) {//收集非绑定属性
                ret += "vnode" + num + ".props[" + quote(i) + "] = " + quote(value) + "\n"
            } else {
                ret += "vnode" + num + ".props." + i + " = " + quote(value) + "\n"
            }
        }
    }

    if (!bindings.length) {
        ret += "vnode" + num + ".skipAttrs = true\n"
    } else {
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