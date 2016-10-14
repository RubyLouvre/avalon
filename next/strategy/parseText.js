import { avalon, config, quote } from '../seed/lang.share'
var rlineSp = /\n\r?/g

export function parseText(nodeValue) {
    var text = nodeValue.trim().replace(rlineSp, '')
    var pieces = text.split(config.rtext)
    var tokens = []
    pieces.forEach(function (piece) {
        var segment = config.openTag + piece + config.closeTag
        if (text.indexOf(segment) > -1) {
            tokens.push('(' + piece + ')')
            text = text.replace(segment,'')
        } else if (piece) {
            tokens.push(quote(piece))
            text = text.replace(piece,'')
        }
    })
    return {
        expr: tokens.join('+'),
        name: 'nodeValue',
        type: 'nodeValue'
    }
}


avalon.parseText = parseText
