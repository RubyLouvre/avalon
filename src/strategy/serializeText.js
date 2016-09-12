var jsonfy = require('./jsonfy')
var config = avalon.config
var rlineSp = /\n\r?\s*/g
module.exports = serializeText

function serializeText(vdom, skip) {
    if (!skip && config.rexpr.test(vdom.nodeValue)) {
        vdom.dynamic = {}
        return avalon.parseText(vdom.nodeValue)
    } else {
        return jsonfy(vdom)
    }
}

function extractExpr(str) {
    var ret = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            ret.push({expr: avalon._decode(value)})
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            ret.push({
                expr: avalon.unescapeHTML(value.replace(rlineSp, '')),
                type: 'text'
            })
            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return ret
}
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
function parseText(nodeValue) {
    var array = typeof nodeValue === 'string' ?
            extractExpr(nodeValue) : [nodeValue]

    var paths = {}
    var untraceable = ''
    var isOne = array.length === 1
    var alwaysHasDynamic = false
    var bracket = isOne ? '' : '()'
    var token = array.map(function (binding) {
        if (binding.type) {
            var expr = binding.expr
            if (rident.test(expr)) {
                alwaysHasDynamic = true
                return expr
            } else {
                var text = avalon.parseExpr(binding)
                binding.paths.replace(avalon.rword, function (a) {
                    paths[a] = 1
                })
                untraceable += (binding.locals || '')
                return text + bracket
            }
        } else {
            return avalon.quote(binding.expr)
        }
    })
    if (isOne) {
        if (alwaysHasDynamic) { //such as {{el}}
            return '{nodeName:"#text",dynamic:{},nodeValue:' + token + '}'
        }
        nodeValue = token[0] //such as {{@aaa}}
    } else {//such as {{@aaa}}111
        nodeValue = 'function(){return ' + token.join('+') + '}'
    }
    var copy = {
        nodeName: "#text"
    }
    var paths = untraceable ? '' : Object.keys(paths).join(',')
    var dirs = [avalon.quote(paths), '"nodeValue"', nodeValue]
    return  jsonfy(copy, dirs)
}

avalon.parseText = parseText

