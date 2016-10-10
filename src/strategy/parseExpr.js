//缓存求值函数，以便多次利用
var pool = avalon.evaluatorPool
var clearString = require('./clearString')
var stringPool = {}

var rfill = /\?\?\d+/g
var brackets = /\(([^)]*)\)/

var rshortCircuit = /\|\|/g
var rpipeline = /\|(?=\?\?)/
var ruselessSp = /\s*(\.|\|)\s*/g
var rhandleName = /^__vmodel__\.[$\w\.]+$/i

var rguide = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var robjectProperty = /\.[\w\.\$]+/g
var rvar = /[$a-zA-Z_][$a-zA-Z0-9_]*/g
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g

module.exports = parseExpr

//传入一个包含name, type, expr的对象, 将会返回一个字符串,
//并为原对象添加paths, locals属性
function parseExpr(binding) {
    var str = binding.expr
    var category = binding.type
    var cache = pool.get(category + ':' + str)
    if (cache) {
        avalon.shadowCopy(binding, cache)
        return cache.text
    }
    /* istanbul ignore else  */
    stringPool = {}
    var paths = {}
    var locals = {}
    var input = str.replace(rregexp, dig)//移除所有正则
    input = clearString(input, dig)      //移除所有字符串
    input = input.replace(rshortCircuit, dig).//移除所有短路运算符
            replace(ruselessSp, '$1').//移除.|两端空白
            replace(rguide, '$1__vmodel__.').//转换@与##
            replace(/(\b[\$\w]+\s*):/g, dig).
            replace(/\|(\w+)/g, function (a, b) {//移除所有过滤器的名字
                return '|' + dig(b)
            }).
            replace(/__vmodel__\.([\$\w\.]+)/g, function (_, b) {
                paths[b] = 1      //收集路径
                return _
            })
    //收集本地变量
    collectLocal(input, locals)
    //处理过滤器
    var filters = input.split(rpipeline)
    var _body = filters.shift()
    var body = _body.replace(rfill, fill)
           //这里必须fix 两次
    if (category === 'js') {
        //<!--ms-js:xxx-->指令不存在过滤器,并且只需要替换@与##
        return cacheData(binding, body, paths, locals)
    }
    if (filters.length) {
        filters = filters.map(function (filter) {
            var bracketArgs = '(__value__'
            filter = filter.replace(brackets, function (a, b) {
                if (/\S/.test(b)) {
                    bracketArgs += ',' + b//还原字符串,正则,短路运算符
                }
                return ''
            }).replace(rfill, fill)
            return (filter.replace(/^(\w+)/, '__value__ =  avalon.__format__("$1")') +
                    bracketArgs + ')')
        })
    }

    var ret = []
    if (category === 'on') {
        if (rhandleName.test(body)) {
            body = body + '($event)'
        }
        filters = filters.map(function (el) {
            return el.replace(/__value__/g, '$event')
        })
        if (filters.length) {
            filters.push('if($event.$return){\n\treturn;\n}')
        }
        /* istanbul ignore if  */
        if (!avalon.modern) {
            body = body.replace(/__vmodel__\.([^(]+)\(([^)]*)\)/, function (a, b, c) {
                return '__vmodel__.' + b + ".call(__vmodel__" + (/\S/.test(c) ? ',' + c : "") + ")"
            })
        }
        ret = ['function ($event, __local__){',
            'try{',
            extLocal(locals).join('\n'),
            '\tvar __vmodel__ = this;',
            '\t' + body,
            '}catch(e){',
            quoteError(str, category),
            '}',
            '}']
        filters.unshift(2, 0)
    } else if (category === 'duplex') {
        //给vm同步某个属性
        var setterBody = [
            'function (__vmodel__,__value__){',
            'try{',
            '\t' + body + ' = __value__',
            '}catch(e){',
            quoteError(str, category).replace('parse', 'set'),
            '}',
            '}']
        pool.put('duplex:set:' + binding.expr, setterBody.join('\n').replace(rfill, fill))
        //对某个值进行格式化
        var getterBody = [
            'function (__vmodel__){',
            'try{',
            'var __value__ = ' + body,
            filters.join('\n'),
            'return __value__',
            '}catch(e){',
            quoteError(str, category).replace('parse', 'get'),
            '}',
            '}'].join('\n')
        return cacheData(binding, getterBody.replace(rfill, fill), locals, paths)

    } else {
        ret = [
            '(function (){',
            'try{',
            'var __value__ = ' + body,
            (category === 'text' ?
                    'return avalon.parsers.string(__value__)' :
                    'return __value__'),
            '}catch(e){',
            quoteError(str, category),
            '\treturn ""',
            '}',
            '})()'
        ]
        filters.unshift(3, 0)
    }
    ret.splice.apply(ret, filters)
    return  cacheData(binding, ret.join('\n') .replace(rfill, fill), locals, paths)
}

function cacheData(binding, text, locals, paths) {
    var obj = {
        text: text,
        locals: Object.keys(locals).join(','),
        paths: Object.keys(paths).join(',')
    }
    var key = binding.type + ":" + binding.expr
    binding.locals = obj.locals
    binding.paths = obj.paths
    pool.put(key, obj)
    return text
}
var number = 1
//https://github.com/RubyLouvre/avalon/issues/1765
//https://github.com/RubyLouvre/avalon/issues/1768
function dig(a) {
    var key = '??' + number++
    stringPool[key] = a
    return key+' '
}

function fill(a) {
    return stringPool[a]
}
function collectLocal(str, local) {
    str.replace(/__vmodel__/, ' ').
            replace(robjectProperty, ' ').
            replace(rvar, function (el) {
                if (el !== '$event' && !avalon.keyMap[el]) {
                    local[el] = 1
                }
            })
}

function extLocal(ret) {
    var arr = []
    for (var i in ret) {
        arr.push('var ' + i + ' = __local__[' + avalon.quote(i) + ']')
    }
    return arr
}

function quoteError(str, type) {
    return '\tavalon.warn(e, ' +
            avalon.quote('parse ' + type + ' binding【 ' + str + ' 】fail')
            + ')'
}