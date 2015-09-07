function scanAttr(elem, vmodels, match) {
    var scanNode = true
    if (vmodels.length) {
        var attributes = elem.attributes
        var bindings = []
        var fixAttrs = []
        var uniq = {}
        var msData = createMap()
        for (var i = 0, attr; attr = attributes[i++]; ) {
            if (attr.specified) {
                if (match = attr.name.match(rmsAttr)) {
                    //如果是以指定前缀命名的
                    var type = match[1]
                    var param = match[2] || ""
                    var value = attr.value
                    var name = attr.name
                    if (uniq[name]) {//IE8下ms-repeat,ms-with BUG
                        continue
                    }
                    uniq[name] = 1
                    if (events[type]) {
                        param = type
                        type = "on"
                    } else if (obsoleteAttrs[type]) {
                        if (type === "enabled") {//吃掉ms-enabled绑定,用ms-disabled代替
                            log("warning!ms-enabled或ms-attr-enabled已经被废弃")
                            type = "disabled"
                            value = "!(" + value + ")"
                        }
                        param = type
                        type = "attr"
                        name = "ms-" + type + "-" + param
                        fixAttrs.push([attr.name, name, value])
                    }
                    msData[name] = value
                    if (typeof bindingHandlers[type] === "function") {
                        var newValue = value.replace(roneTime, "")
                        var oneTime = value !== newValue
                        var binding = {
                            type: type,
                            param: param,
                            element: elem,
                            name: name,
                            value: newValue,
                            oneTime: oneTime,
                            priority: (priorityMap[type] || type.charCodeAt(0) * 10) + (Number(param.replace(/\D/g, "")) || 0)
                        }
                        if (type === "html" || type === "text") {
                            var token = getToken(value)
                            avalon.mix(binding, token)
                            binding.filters = binding.filters.replace(rhasHtml, function () {
                                binding.type = "html"
                                binding.group = 1
                                return ""
                            })// jshint ignore:line
                        } else if (type === "duplex") {
                            var hasDuplex = name
                        } else if (name === "ms-if-loop") {
                            binding.priority += 100
                        }
                        bindings.push(binding)
                        if (type === "widget") {
                            elem.msData = elem.msData || msData
                        }
                    }
                }
            }
        }
        if (bindings.length) {
            bindings.sort(bindingSorter)
            fixAttrs.forEach(function (arr) {
                log("warning!请改用" + arr[1] + "代替" + arr[0] + "!")
                elem.removeAttribute(arr[0])
                elem.setAttribute(arr[1], arr[2])
            })
            var control = elem.type
            if (control && hasDuplex) {
                if (msData["ms-attr-value"] && elem.type === "text") {
                    log("warning!" + control + "控件不能同时定义ms-attr-value与" + hasDuplex)
                }
            }

            for (i = 0; binding = bindings[i]; i++) {
                type = binding.type
                if (rnoscanAttrBinding.test(type)) {
                    return executeBindings(bindings.slice(0, i + 1), vmodels)
                } else if (scanNode) {
                    scanNode = !rnoscanNodeBinding.test(type)
                }
            }
            executeBindings(bindings, vmodels)
        }
    }
    if (scanNode && !stopScan[elem.tagName] && rbind.test(elem.innerHTML + elem.textContent)) {
        mergeTextNodes && mergeTextNodes(elem)
        scanNodeList(elem, vmodels) //扫描子孙元素
    }
}

var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^each|with|html|include$/