

//缓存求值函数，以便多次利用
var evaluatorPool = require('./evaluatorPool')

var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rfill = /\?\?\d+/g
var brackets = /\(([^)]*)\)/
var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g
var rhandleName = /^\@[$\w]+$/
var rshortCircuit = /\|\|/g
var rpipeline = /\|(?=\w)/
var ruselessSp =/\s*(\.|\|)\s*/g
function parseExpr(str, category) {
    var binding = {}
    category = category || 'other'
    if (typeof str === 'object') {
        category = str.type
        binding = str
        str = binding.expr
    }

    var input = str.trim()

    var cacheStr = evaluatorPool.get(category + ':' + input)

    if (cacheStr) {
        return cacheStr
    }

    var number = 1
//相同的表达式生成相同的函数
    var maps = {}
    function dig(a) {
        var key = '??' + number++
        maps[key] = a
        return key
    }

    function fill(a) {
        return maps[a]
    }

    input = input.replace(rregexp, dig).//移除所有正则
            replace(rstring, dig).//移除所有字符串
            replace(rshortCircuit, dig).//移除所有短路或
            replace(ruselessSp, '$1').//移除. |两端空白
            split(rpipeline) //使用管道符分离所有过滤器及表达式的正体

//还原body
    var body = input.shift().replace(rfill, fill).trim()
    if (category === 'on' && rhandleName.test(body)) {
        body = body + '($event)'
    }

    body = body.replace(rAt, '$1__vmodel__.')
    if (category === 'js') {
        return evaluatorPool.put(category + ':' + input, body)
    }

//处理表达式的过滤器部分
    var filters = input.map(function (str) {

        str = str.replace(rfill, fill).replace(rAt, '$1__vmodel__.') //还原
        var hasBracket = false
        str = str.replace(brackets, function (a, b) {
            hasBracket = true
            return /\S/.test(b) ?
                    '(__value__,' + b + ');' :
                    '(__value__);'
        })
        if (!hasBracket) {
            str += '(__value__);'
        }
        str = str.replace(/(\w+)/, 'avalon.__read__("$1")')
        return '__value__ = ' + str
    })
    var ret = []
    if (category === 'on') {
        filters = filters.map(function (el) {
            return el.replace(/__value__/g, '$event')
        })
        if (filters.length) {
            filters.push('if($event.$return){\n\treturn;\n}')
        }
        ret = ['function self($event){',
            'try{',
            '\tvar __vmodel__ = this;',
            '\t' + body,
            '}catch(e){',
            '\tavalon.log(e, ' + quoteError(str, category) + ')',
            '}',
            '}']
        filters.unshift(2, 0)
    } else if (category === 'duplex') {
        var setterFilters = filters.map(function (str) {
            str = str.replace(/__read__/g, '__write__')
            return str.replace(');', ',__elem__);')
        })
        //setter
        var setterBody = [
            'function (__vmodel__, __value__, __elem__){',
            'if(!__elem__ || __elem__.nodeType !== 1) ',
            '\treturn',
            'try{',
            '\t' + body + ' = __value__',
            '}catch(e){',
            '\tavalon.log(e, ' + quoteError(str, category) + ')',
            '}',
            '}']

        setterBody.splice(3, 0, setterFilters.join('\n'))
        var fn = Function('return ' + setterBody.join('\n'))()
        evaluatorPool.put('duplex:' + str.trim() + ':setter', fn)
        var getterFilters = filters.map(function (str) {
            return str.replace(');', ',__elem__);')
        })
        var getterBody = [
            'function (__vmodel__, __value__, __elem__){',
            'try{',
            'if(arguments.length === 1)',
            '\treturn ' + body,
            'if(!__elem__ || __elem__.nodeType !== 1) return ',
            'return __value__',
            '}catch(e){',
            '\tavalon.log(e, ' + quoteError(str, category) + ')',
            '}',
            '}']
        getterBody.splice(5, 0, getterFilters.join('\n'))
        fn = Function('return ' + getterBody.join('\n'))()
        evaluatorPool.put('duplex:' + str.trim(), fn)
        return
    } else {
        ret = [
            '(function(){',
            'try{',
            'var __value__ = ' + body,
            'return __value__',
            '}catch(e){',
            '\tavalon.log(e, ' + quoteError(str, category) + ')',
            '\treturn ""',
            '}',
            '})()'
        ]
        filters.unshift(3, 0)
    }

    ret.splice.apply(ret, filters)
    cacheStr = ret.join('\n')
    evaluatorPool.put(category + ':' + input, cacheStr)
    return cacheStr

}

function quoteError(str, type) {
    return avalon.quote('parse ' + type + ' binding【 ' + str + ' 】fail')
}

module.exports = avalon.parseExpr = parseExpr

