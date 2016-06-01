var rline = /\r?\n/g
var r = require('../../seed/regexp')
var config = avalon.config

function parseDelimiter(str) {
    var tokens = [],
            value, start = 0,
            stop
    do {
        stop = str.indexOf(config.openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (start === 0) {
            value = value.replace(r.leftSp, '')
        }
        if (value) { // {{ 左边的文本
            tokens.push({
                expr: value
            })
        }
        start = stop + config.openTag.length
        stop = str.indexOf(config.closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.push({
                expr: value.replace(rline, ''),
                type: '{{}}'
            })
        }
        start = stop + avalon.config.closeTag.length
    } while (1)
    value = str.slice(start)

    var lastText = value.replace(r.rightSp, '')
    if (lastText) { //}} 右边的文本
        tokens.push({
            expr: lastText.replace(/^\s+$/,' ')
        })
    }
    return tokens
}

module.exports = parseDelimiter
