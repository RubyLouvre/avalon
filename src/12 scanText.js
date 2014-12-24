var rhasHtml = /\|\s*html\s*/,
        r11a = /\|\|/g,
        r11b = /\u1122\u3344/g,
        rlt = /&lt;/g,
        rgt = /&gt;/g

function getToken(value) {
    if (value.indexOf("|") > 0) {
        value = value.replace(r11a, "\u1122\u3344") //干掉所有短路或
        var index = value.indexOf("|")
        if (index > -1) {
            return {
                filters: value.slice(index).replace(r11b, "||"),
                value: value.slice(0, index).replace(r11b, "||"),
                expr: true
            }
        }
        value = value.replace(r11b, "||")
    }
    return {
        value: value,
        filters: "",
        expr: true
    }
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
            tokens.push(getToken(value))
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
        var token = getToken(textNode.nodeValue)
        var tokens = [token]
    } else {
        tokens = scanExpr(textNode.data)
    }
    if (tokens.length) {
        for (var i = 0, token; token = tokens[i++]; ) {
            var node = DOC.createTextNode(token.value) //将文本转换为文本节点，并替换原来的文本节点
            if (token.expr) {
                var filters = token.filters || ""
                var binding = {
                    type: "text",
                    element: node,
                    value: token.value
                }
                if (rhasHtml.test(filters)) {
                    filters = filters.replace(rhasHtml, "")
                    binding.type = "html"
                    binding.group = 1
                }
                binding.filters = filters
                bindings.push(binding) //收集带有插值表达式的文本
            }
            hyperspace.appendChild(node)
        }
        textNode.parentNode.replaceChild(hyperspace, textNode)
        if (bindings.length)
            executeBindings(bindings, vmodels)
    }
}
