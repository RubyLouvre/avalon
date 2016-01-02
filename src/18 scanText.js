var rhasHtml = /\|\s*html(?:\b|$)/,
    r11a = /\|\|/g,
    rlt = /&lt;/g,
    rgt = /&gt;/g,
    rstringLiteral = /(['"])(\\\1|.)+?\1/g,
    rline = /\r?\n/g
function getToken(value) {
    if (value.indexOf("|") > 0) {
        var scapegoat = value.replace(rstringLiteral, function (_) {
            return Array(_.length + 1).join("1") // jshint ignore:line
        })
        var index = scapegoat.replace(r11a, "\u1122\u3344").indexOf("|") //干掉所有短路或
        if (index > -1) {
            return {
                type: "text",
                filters: value.slice(index).trim(),
                expr: value.slice(0, index)
            }
        }
    }
    return {
        type: "text",
        expr: value,
        filters: ""
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
                expr: value
            })
        }
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.push(getToken(value.replace(rline,"")))
        }
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start)
    if (value) { //}} 右边的文本
        tokens.push({
            expr: value
        })
    }
    return tokens
}

function scanText(textNode, vmodels, index) {
    var bindings = [],
    tokens = scanExpr(textNode.data)
    if (tokens.length) {
        for (var i = 0, token; token = tokens[i++];) {
            var node = DOC.createTextNode(token.expr) //将文本转换为文本节点，并替换原来的文本节点
            if (token.type) {
                token.expr = token.expr.replace(roneTime, function () {
                        token.oneTime = true
                        return ""
                    }) // jshint ignore:line
                token.element = node
                token.filters = token.filters.replace(rhasHtml, function () {
                        token.type = "html"
                        return ""
                    }) // jshint ignore:line
                token.pos = index * 1000 + i
                bindings.push(token) //收集带有插值表达式的文本
            }
            avalonFragment.appendChild(node)
        }
        textNode.parentNode.replaceChild(avalonFragment, textNode)
        if (bindings.length)
            executeBindings(bindings, vmodels)
    }
}
