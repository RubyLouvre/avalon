import { avalon, config } from '../seed/lang.share'
var rlineSp = /\n\r?\s*/g


export function extractExpr(str) {
    var ret = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            ret.push({ expr: avalon._decode(value) })
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            ret.push({
                expr: avalon.unescapeHTML(value.replace(rlineSp, '')),
                type: 'nodeValue',
                name: 'nodeValue'
            })
            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return ret
}

export function parseText(nodeValue) {
    var tokens = extractExpr(nodeValue) 
    if (tokens.length > 1) {
        var v = '' //处理一个文本节点存在多个花括号的情况 
        tokens.forEach(function (el) {
            if (!el.type)
                el.expr = '+' + avalon.quote(el.expr) + '+'
            v += el.expr
        })
        tokens = [{
            expr: v,
            name: 'nodeValue',
            type: 'nodeValue'
        }]
    }
    var binding = tokens[0]
    return binding
}

avalon.parseText = parseText
