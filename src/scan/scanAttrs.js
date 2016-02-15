
var rmsAttr = require("../base/builtin").rmsAttr

var oneObject = require("../base/builtin").oneObject
//var scanNodes = require("./scanNodes")

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
//ms-repeat,ms-if会创建一个组件,作为原元素的父节点,没有孩子,
//将原元素的outerHTML作为其props.template
//ms-html,ms-text会创建一个组件,作为原元素的唯一子节点
//优化级ms-if  >  ms-repeat  >  ms-html  >  ms-text
var eventMap = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")
var attrMap = oneObject("value,title,alt,checked,selected,disabled,readonly,enabled")
function bindingSorter(a, b) {
    return a.priority - b.priority
}

function scanAttrs(elem, vmodel, siblings) {
    var props = elem.props, bindings = []
    for (var i in props) {
        var value = props[i], match
        
        if (value && (match = i.match(rmsAttr))) {
            var type = match[1]
            var param = match[2] || ""
            var name = i
            if (eventMap[type]) {
                param = type
                type = "on"
            } else if (attrMap[type]) {
                param = type
                type = "attr"
                name = "av-" + type + "-" + param
                log("warning!请改用" + name + "代替" + i + "!")
            }
            if (directives[type]) {
                var newValue = value.replace(/^\s*::/, "")
                var oneTime = value !== newValue
                var binding = {
                    type: type,
                    param: param,
                    element: elem,
                    name: name,
                    expr: newValue,
                    oneTime: oneTime,
                    priority: priorityMap[type] || directives[type].priority || 
                    type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, "")) || 0)
                }
                if (/each|repeat|if|text|html/.test(type)) {
                    binding.siblings = siblings
                }
                bindings.push(binding)
            }
        }
    }
    
    if (bindings.length && vmodel) {
        bindings.sort(bindingSorter)
        executeBindings(bindings, vmodel)
    }
  
}

function executeBindings(bindings, vmodel) {
    for (var i = 0, binding; binding = bindings[i++]; ) {
        binding.vmodel = vmodel
        var isBreak = directives[binding.type].init(binding)
        avalon.injectBinding(binding)
        if (isBreak === false)
            break
    }
    bindings.length = 0
}
module.exports = scanAttrs