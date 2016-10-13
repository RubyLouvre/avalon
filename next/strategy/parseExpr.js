//缓存求值函数，以便多次利用

import { avalon } from '../seed/core'
import { keyMap} from './jsonfy'

import { clearString, stringPool, fill, rfill, dig } from './clearString'

var pool = avalon.evaluatorPool
var brackets = /\(([^)]*)\)/
var rshortCircuit = /\|\|/g
var rpipeline = /\|(?=\?\?)/
var ruselessSp = /\s*(\.|\|)\s*/g
var rhandleName = /^__vmodel__\.[$\w\.]+$/i

var rguide = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var robjectProperty = /\.[\w\.\$]+/g
var rvar = /[$a-zA-Z_][$a-zA-Z0-9_]*/g
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g


//传入一个包含name, type, expr的对象, 将会返回一个字符串,
//并为原对象添加paths, locals属性
export function parseExpr(binding) {
        var str = binding.expr
        var category = binding.type
        var cache = pool.get(category + ':' + str)
        if (cache) {
                avalon.shadowCopy(binding, cache)
                return cache.text
        }
        /* istanbul ignore else  */
        stringPool.map = {}
        var paths = {}
        var locals = {}
        var input = str.replace(rregexp, dig)//移除所有正则
        input = clearString(input)      //移除所有字符串
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
        var body = filters.shift()
        //    var body = _body.replace(rfill, fill)
        if (category === 'js') {
                //<!--ms-js:xxx-->指令不存在过滤器,并且只需要替换@与##
                return cacheData(binding, body.replace(rfill, fill), paths, locals)
        }
        //将filters数组转换成字符串
        if (filters.length) {
                filters = filters.map(function (filter) {
                        // var bracketArgs = '(__value__'
                        var bracketArgs = ''
                        filter = filter.replace(brackets, function (a, b) {
                                if (/\S/.test(b)) {
                                        bracketArgs += ',' + b//还原字符串,正则,短路运算符
                                }
                                return ''
                        }).replace(rfill, fill)
                        var arg = '[' + avalon.quote(filter.trim()) + bracketArgs + ']'
                        return arg

                })
                filters = '__value__ = avalon.composeFilters(' + filters + ')(__value__)'
        } else {
                filters = ''
        }

        var ret = []
        switch (category) {

                case 'duplex':

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
                                filters,
                                'return __value__',
                                '}catch(e){',
                                quoteError(str, category).replace('parse', 'get'),
                                '}',
                                '}']
                        return cacheData(binding, getterBody, locals, paths)
                case 'on':
                        if (rhandleName.test(body)) {
                                body = body + '($event)'
                        }
                        if (filters) {
                                filters = filters.replace(/__value__/g, '$event')
                                filters += 'if($event.$return){\n\treturn;\n}'
                        }
                        /* istanbul ignore if  */
                        if (!avalon.modern) {
                                body = body.replace(/__vmodel__\.([^(]+)\(([^)]*)\)/, function (a, b, c) {
                                        return '__vmodel__.' + b + ".call(__vmodel__" + (/\S/.test(c) ? ',' + c : "") + ")"
                                })
                        }
                        //事件的过滤器位置主逻辑的前面
                        ret = ['function ($event, __local__){',
                                'try{',
                                extLocal(locals).join('\n'),
                                '\tvar __vmodel__ = this;' + filters,
                                '\t' + body,
                                '}catch(e){avalon.log(e)}',
                                '}']
                        break
                case 'nodeValue':
                        ret = [
                                '(function (){',
                                'try{',
                                'var __value__ = ' + body,
                                '__value__ =  avalon.parsers.string(__value__)',
                                filters,
                                'return __value__',
                                '}catch(e){',
                                quoteError(str, category),
                                '\treturn ""',
                                '}',
                                '})()'
                        ]

                        break
                default:
                        ret = [
                                '(function (){',
                                'try{',
                                'var __value__ = ' + body,
                                filters,
                                'return __value__',
                                '}catch(e){',
                                quoteError(str, category),
                                '\treturn ""',
                                '}',
                                '})()'
                        ]
                        break

        }
        return cacheData(binding, ret, locals, paths)
}
avalon.composeFilters = function () {
        var args = arguments
        return function (value) {
                for (var i = 0, arr; arr = args[i++];) {
                        var name = arr[0]
                        var filter = avalon.filters[name]
                        if (typeof filter === 'function') {
                                arr[0] = value
                                try {
                                        value = filter.apply(0, arr)
                                } catch (e) {
                                }
                        }
                }
                return value
        }
}

function cacheData(binding, text, locals, paths) {
        text = text.join('\n').replace(rfill, fill)
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

function collectLocal(str, local) {
        str.replace(/__vmodel__/, ' ').
                replace(robjectProperty, ' ').
                replace(rvar, function (el) {
                        if (el !== '$event' && !keyMap[el]) {
                                local[el] = 1
                        }
                })
}

export function extLocal(ret) {
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