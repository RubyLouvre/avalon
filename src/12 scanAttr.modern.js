function scanAttr(elem, vmodels) {
    //防止setAttribute, removeAttribute时 attributes自动被同步,导致for循环出错
    var attributes = elem.attributes
    var bindings = [],
            msData = createMap(),
            match
    var fixAttrs = []
    for (var i = 0, attr; attr = attributes[i++]; ) {
        if (attr.specified) {
            if (match = attr.name.match(rmsAttr)) {
                //如果是以指定前缀命名的
                var type = match[1]
                var param = match[2] || ""
                var value = attr.value
                var name = attr.name
                if (events[type]) {
                    param = type
                    type = "on"
                } else if (obsoleteAttrs[type]) {
                    log("warning!请改用ms-attr-" + type + "代替ms-" + type + "！")
                    if (type === "enabled") {//吃掉ms-enabled绑定,用ms-disabled代替
                        log("warning!ms-enabled或ms-attr-enabled已经被废弃")
                        type = "disabled"
                        value = "!(" + value + ")"
                    }
                    param = type
                    type = "attr"
                    name = "ms-" + type + param
                    fixAttrs.push([attr.name, name, value])
                }
                msData[name] = value
                if (typeof bindingHandlers[type] === "function") {
                    var binding = {
                        type: type,
                        param: param,
                        element: elem,
                        name: name,
                        value: value,
                        priority: type in priorityMap ? priorityMap[type] : type.charCodeAt(0) * 10 + (Number(param) || 0)
                    }
                    if (type === "html" || type === "text") {
                        var token = getToken(value)
                        avalon.mix(binding, token)
                        binding.filters = binding.filters.replace(rhasHtml, function () {
                            binding.type = "html"
                            binding.group = 1
                            return ""
                        })// jshint ignore:line
                    }
                    if (name === "ms-if-loop") {
                        binding.priority += 100
                    }
                    if (vmodels.length) {
                        bindings.push(binding)
                        if (type === "widget") {
                            elem.msData = elem.msData || msData
                        }
                    }
                }
            }
        }
    }
    if (bindings.length) {
        bindings.sort(bindingSorter)
        fixAttrs.forEach(function (arr) {
            elem.removeAttribute(arr[0])
            elem.setAttribute(arr[1], arr[2])
        })
        var control = elem.type
        if (control && msData["ms-duplex"]) {
            if (msData["ms-attr-checked"] && /radio|checkbox/.test(control)) {
                log("warning!" + control + "控件不能同时定义ms-attr-checked与ms-duplex")
            }
            if (msData["ms-attr-value"] && /text|password/.test(control)) {
                log("warning!" + control + "控件不能同时定义ms-attr-value与ms-duplex")
            }
        }
        var scanNode = true
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
    if (scanNode && !stopScan[elem.tagName] && rbind.test(elem.innerHTML + elem.textContent)) {
        mergeTextNodes && mergeTextNodes(elem)
        scanNodeList(elem, vmodels) //扫描子孙元素
    }
}

var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^each|with|html|include$/