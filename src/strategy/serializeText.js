var jsonfy = require('./jsonfy')
var config = avalon.config
var rlineSp = /\n\r?\s*/g
module.exports = serializeText
function serializeText(vdom, skip) {
    if (!skip && config.rexpr.test(vdom.nodeValue)) {
        return avalon.parseText(vdom.nodeValue)
    } else {
        return jsonify(vdom)
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
    var array = extractExpr(nodeValue)//返回一个数组
    var alwaysHasDynamic = false
    var paths = {}
    var locals = {}
    var bracket = array.length > 1 ? '()' : ''
    var token = array.map(function (el) {
        if (el.type) {
            var expr = el.expr
            if (rident.test(expr)) {
                alwaysHasDynamic = true
                return expr
            } else {
                var binding = parseExpr(expr, 'text')
                binding.paths.replace(avalon.rword, function (a) {
                    paths[a] = 1
                })
                binding.locals.replace(avalon.rword, function (a) {
                    paths[a] = 1
                })
                return binding.text + bracket
            }
        } else {
            return avalon.quote(el.expr)
        }
    })
    if (token.length > 1) {
        nodeValue = 'function(){return ' + token.join('+') + "}"
    } else {
        nodeValue = token.join('')
    }
    alwaysHasDynamic = alwaysHasDynamic || Object.keys(locals).length
    var copy = {
        nodeName: "#text"
    }
    if (alwaysHasDynamic) {
        copy.dynamic = true
    }
    var dirs = [Object.keys(paths).join(','), '"nodeValue"', nodeValue]
    return  jsonfy(copy, dirs)
}

avalon.parseText = parseText

