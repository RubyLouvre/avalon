
var roneTime = /^\s*::/
var rmsAttr = /ms-(\w+)-?(.*)/
var priorityMap = {
    "if": 10,
    "repeat": 90,
    "data": 100,
    "widget": 110,
    "each": 1400,
    "with": 1500,
    "duplex": 2000,
    "on": 3000
}

var events = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
var obsoleteAttrs = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")
function bindingSorter(a, b) {
    return a.priority - b.priority
}

function scanAttrs(elem, vmodel) {
    var props = elem.props, bindings = []
    for (var i in props) {
        var value = props[i], match
        if (value && (match = i.match(rmsAttr))) {
            var type = match[1]
            var param = match[2] || ""
            var name = i
            if (events[type]) {
                param = type
                type = "on"
            } else if (obsoleteAttrs[type]) {
                param = type
                type = "attr"
                name = "ms-" + type + "-" + param
                log("warning!请改用" + name + "代替" + i + "!")
            }
            if (directives[type]) {
                var newValue = value.replace(roneTime, "")
                var oneTime = value !== newValue
                var binding = {
                    type: type,
                    param: param,
                    element: elem,
                    name: name,
                    expr: newValue,
                    oneTime: oneTime,
                    priority: (directives[type].priority || type.charCodeAt(0) * 10) + (Number(param.replace(/\D/g, "")) || 0)
                }
                bindings.push(binding)
            }
        }
    }
    if (bindings.length) {
        bindings.sort(bindingSorter)
        executeBindings(bindings, vmodel)
    }
    updateVirtual(elem.children, vmodel)

}
