import { avalon, config, quote, cache } from '../seed/lang.share'
var rlineSp = /\n\r?/g
var textCache = new cache(400)
export function parseText(nodeValue) {
    var text = nodeValue.trim().replace(rlineSp, '')
    var hit = textCache.get(text)
    var key = text
    if(hit){
        return avalon.mix({}, hit)
    }
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
    return textCache.put(key,{
        expr: tokens.join('+'),
        name: 'nodeValue',
        type: 'nodeValue'
    })
}


avalon.parseText = parseText
