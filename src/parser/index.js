import { avalon, msie, Cache } from '../seed/core'
import { clearString, stringPool, fill, rfill, dig } from '../vtree/clearString'

var keyMap = avalon.oneObject("break,case,catch,continue,debugger,default,delete,do,else,false," +
    "finally,for,function,if,in,instanceof,new,null,return,switch,this," +
    "throw,true,try,typeof,var,void,while,with," + /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends," +
    "final,float,goto,implements,import,int,interface,long,native," +
    "package,private,protected,public,short,static,super,synchronized," +
    "throws,transient,volatile,arguments")

export var skipMap = avalon.mix({
    Math: 1,
    Date: 1,
    $event: 1,
    window: 1,
    __vmodel__: 1,
    avalon: 1
}, keyMap)

var rvmKey = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var ruselessSp = /\s*(\.|\|)\s*/g
var rshortCircuit = /\|\|/g
var brackets = /\(([^)]*)\)/
var rpipeline = /\|(?=\?\?)/
var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
var robjectProp = /\.[\w\.\$]+/g //对象的属性 el.xxx 中的xxx
var robjectKey = /(\{|\,)\s*([\$\w]+)\s*:/g //对象的键名与冒号 {xxx:1,yyy: 2}中的xxx, yyy
var rfilterName = /\|(\w+)/g
var rlocalVar = /[$a-zA-Z_][$a-zA-Z0-9_]*/g

var exprCache = new Cache(300)

function addScopeForLocal(str) {
    return str.replace(robjectProp, dig).
    replace(rlocalVar, function(el) {
        if (!skipMap[el]) {
            return "__vmodel__." + el
        }
        return el
    })
}

export function addScope(expr, type) {
    var cacheKey = expr + ':' + type
    var cache = exprCache.get(cacheKey)
    if (cache) {
        return cache.slice(0)
    }

    stringPool.map = {}
        //https://github.com/RubyLouvre/avalon/issues/1849
    var input = expr.replace(rregexp, function(a, b) {
            return b + dig(a.slice(b.length))
        }) //移除所有正则
    input = clearString(input) //移除所有字符串
    input = input.replace(rshortCircuit, dig). //移除所有短路运算符
    replace(ruselessSp, '$1'). //移除.|两端空白

    replace(robjectKey, function(_, a, b) { //移除所有键名
        return a + dig(b) + ':' //比如 ms-widget="[{is:'ms-address-wrap', $id:'address'}]"这样极端的情况 
    }).
    replace(rvmKey, '$1__vmodel__.'). //转换@与##为__vmodel__
    replace(rfilterName, function(a, b) { //移除所有过滤器的名字
        return '|' + dig(b)
    })
    input = addScopeForLocal(input) //在本地变量前添加__vmodel__

    var filters = input.split(rpipeline) //根据管道符切割表达式
    var body = filters.shift().replace(rfill, fill).trim()
    if (/\?\?\d/.test(body)) {
        body = body.replace(rfill, fill)
    }
    if (filters.length) {
        filters = filters.map(function(filter) {
            var bracketArgs = ''
            filter = filter.replace(brackets, function(a, b) {
                if (/\S/.test(b)) {
                    bracketArgs += ',' + b //还原字符串,正则,短路运算符
                }
                return ''
            })
            var arg = '[' + avalon.quote(filter.trim()) + bracketArgs + ']'
            return arg

        })
        filters = 'avalon.composeFilters(' + filters + ')(__value__)'
        filters = filters.replace(rfill, fill)
    } else {
        filters = ''
    }
    return exprCache.put(cacheKey, [body, filters])
}
var rhandleName = /^__vmodel__\.[$\w\.]+$/
var rfixIE678 = /__vmodel__\.([^(]+)\(([^)]*)\)/
export function makeHandle(body) {
    if (rhandleName.test(body)) {
        body = body + '($event)'
    }
    /* istanbul ignore if */
    if (msie < 9) {
        body = body.replace(rfixIE678, function(a, b, c) {
            return '__vmodel__.' + b + '.call(__vmodel__' + (/\S/.test(c) ? ',' + c : '') + ')'
        })
    }
    return body
}
export function createGetter(expr, type) {
    var arr = addScope(expr, type),
        body
    if (!arr[1]) {
        body = arr[0]
    } else {
        body = arr[1].replace(/__value__\)$/, arr[0] + ')')
    }
    try {
        return new Function('__vmodel__', 'return ' + body + ';')
            /* istanbul ignore next */
    } catch (e) {
        avalon.log('parse getter: [', expr, body, ']error')
        return avalon.noop
    }
}

/**
 * 生成表达式设值函数
 * @param  {String}  expr
 */
export function createSetter(expr, type) {
    var arr = addScope(expr, type)
    var body = 'try{ ' + arr[0] + ' = __value__}catch(e){avalon.log(e, "in on dir")}'
    try {
        return new Function('__vmodel__', '__value__', body + ';')
            /* istanbul ignore next */
    } catch (e) {
        avalon.log('parse setter: ', expr, ' error')
        return avalon.noop
    }
}
