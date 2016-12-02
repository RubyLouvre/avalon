import { avalon, config } from '../seed/core'
import { addScope } from './index'
var rimprovePriority = /[+-\?]/
var rinnerValue = /__value__\)$/
export function parseInterpolate(dir) {
    var rlineSp = /\n\r?/g
    var str = dir.nodeValue.trim().replace(rlineSp, '')
    var tokens = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            tokens.push(avalon.quote(avalon._decode(value)))
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            var expr = avalon.unescapeHTML(value)
            if (/\|\s*\w/.test(expr)) {//如果存在过滤器，优化干掉
                var arr = addScope(expr, 'expr')
                if (arr[1]) {
                    expr = arr[1].replace(rinnerValue, arr[0]+')')
                }
            }
            if(rimprovePriority){
                expr = '('+expr+')'
            }
            tokens.push(expr)

            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return [{
        expr: tokens.join('+'),
        name: 'expr',
        type: 'expr'
    }]
}