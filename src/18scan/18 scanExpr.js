function scanExpr(str) {
    var tokens = [],
            value, start = 0,
            stop
    do {
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop).trim()
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
            tokens.push({
                expr: value,
                type: "{{}}" 
            })
        }
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start).trim()
    if (value) { //}} 右边的文本
        tokens.push({
            expr: value
        })
    }
    return tokens
}

