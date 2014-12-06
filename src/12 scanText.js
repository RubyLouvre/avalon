var rfilters = /\|\s*(\w+)\s*(\([^)]*\))?/g,
        r11a = /\|\|/g,
        r11b = /U2hvcnRDaXJjdWl0/g,
        rlt = /&lt;/g,
        rgt = /&gt;/g

function trimFilter(value, leach) {
    if (value.indexOf("|") > 0) { // 抽取过滤器 先替换掉所有短路与
        value = value.replace(r11a, "U2hvcnRDaXJjdWl0") //btoa("ShortCircuit")
        value = value.replace(rfilters, function(c, d, e) {
            leach.push(d + (e || ""))
            return ""
        })
        value = value.replace(r11b, "||") //还原短路与
    }
    return value
}

function scanExpr(str) {
    var tokens = [],
            value, start = 0,
            stop
    do {
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { // {{ 左边的文本
            tokens.push({
                value: value,
                expr: false
            })
        }
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            var leach = []
            value = trimFilter(value, leach)
            tokens.push({
                value: value,
                expr: true,
                filters: leach.length ? leach : void 0
            })
        }
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start)
    if (value) { //}} 右边的文本
        tokens.push({
            value: value,
            expr: false
        })
    }

    return tokens
}

function scanText(textNode, vmodels) {
    var bindings = []
    if (textNode.nodeType === 8) {
        var leach = []
        var value = trimFilter(textNode.nodeValue, leach)
        var token = {
            expr: true,
            value: value
        }
        if (leach.length) {
            token.filters = leach
        }
        var tokens = [token]
    } else {
        tokens = scanExpr(textNode.data)
    }
    if (tokens.length) {
        for (var i = 0, token; token = tokens[i++]; ) {
            var node = DOC.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
            if (token.expr) {
                var filters = token.filters
                var binding = {
                    type: "text",
                    element: node,
                    value: token.value,
                    filters: filters
                }
                if (filters && filters.indexOf("html") !== -1) {
                    avalon.Array.remove(filters, "html")
                    binding.type = "html"
                    binding.group = 1
                    if (!filters.length) {
                        delete bindings.filters
                    }
                }
                bindings.push(binding) //收集带有插值表达式的文本
            }
            hyperspace.appendChild(node)
        }
        textNode.parentNode.replaceChild(hyperspace, textNode)
        if (bindings.length)
            executeBindings(bindings, vmodels)
    }
}
