
var getAttributes = require('./getAttributes.fix')
var scanNodes = require('./scanNodes')
function scanAttr(elem, vmodel, match) {
    if (vmodel) {
        var attributes = avalon.modern ? avalon.slice(elem.attributes): getAttributes(elem)
        var bindings = []
        var forBinding = false
        for (var i = 0, attr; attr = attributes[i++]; ) {

            if (attr.specified) {
                var name = attr.name
                if (match = name.match(rmsAttr)) {
                    //如果是以指定前缀命名的
                    var type = match[1]
                    var param = match[2] || ""
                    var value = attr.value
                    if (events[type]) {
                        param = type
                        type = "on"
                    } else if (obsoleteAttrs[type]) {
                        param = type
                        type = "attr"
                        name = "ms-" + type + "-" + param
                        log("warning!请改用" + name + "代替" + attr.name + "!")
                    }
                    var binding = {
                        value: value,
                        type: type,
                        param: param,
                        element: elem,
                        vmodel: vmodel
                    }
                    elem.removeAttribute(attr.name)
                    if (eachBinding[type]) {
                        forBinding = binding
                    }
                    bindings.push(binding)
                }
            }
        }
        if (forBinding) {
            bindings = [forBinding]
            vmodel.$watchers.push(forBinding)
        } else {
            avalon.Array.merge(vmodel.$watchers, bindings)
            if (stopScan[elem.tagName]) {
                scanNodes(elem, vmodel) //扫描子孙元素
            }
        }
    }
}
var eachBinding = {
    repeat: 1,
    each: 1,
    "with": 1
}
