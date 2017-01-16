import { avalon, msie, Cache, config } from '../seed/core'
import { clearString, stringPool, fill, rfill, dig } from '../vtree/clearString'

export var keyMap = avalon.oneObject("break,case,catch,continue,debugger,default,delete,do,else,false," +
    "finally,for,function,if,in,instanceof,new,null,return,switch,this," +
    "throw,true,try,typeof,var,void,while,with," + /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends," +
    "final,float,goto,implements,import,int,interface,long,native," +
    "package,private,protected,public,short,static,super,synchronized," +
    "throws,transient,volatile")

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
            return "$$l." + el
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
        body = body + '($event,$$l)'
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
export function createExpr(expr, type) {
    var arr = addScope(expr, type),
        body
    if (!arr[1]) {
        body = arr[0]
    } else {
        body = arr[1].replace(/__value__\)$/, arr[0] + ')')
    }
    if (avalon.modern)
        return body
    return `(function(){ try{return ${body} }catch(e){} })()`

}

/**
 * 生成表达式设值函数
 * @param  {String}  expr
 */
export function createSetter(expr, type) {
    var arr = addScope(expr, type)
    var body = 'try{ ' + arr[0] + ' = __value__}catch(e){}'
    try {
        return new Function('__vmodel__', '__value__', body + ';')
            /* istanbul ignore next */
    } catch (e) {
        avalon.log('parse setter: ', expr, ' error')
        return avalon.noop
    }
}


export var eventMap = avalon.oneObject('animationend,blur,change,input,' +
    'click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,' +
    'mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit', 'on')
export function parseAttributes(dirs, node) {
    var uniq = {},
        bindings = [],
        props = node.props,
        hasIf = false
    for (var name in dirs) {
        var value = dirs[name]
        var arr = name.split('-')
            // ms-click
        if (name in props) {
            var attrName = name
        } else {
            attrName = ':' + name.slice(3)
        }
        if (eventMap[arr[1]]) {
            arr.splice(1, 0, 'on')
        }
        //ms-on-click
        if (arr[1] === 'on') {
            arr[3] = parseFloat(arr[3]) || 0
        }

        var type = arr[1]

        if (directives[type]) {
            delete props[attrName]
            var binding = {
                type: type,
                param: arr[2],
                name: attrName,

                expr: value,
                priority: directives[type].priority || type.charCodeAt(0) * 100
            }

            avalon.mix(binding, directives[type])

            if (type === 'on') {
                binding.priority += arr[3]
            }
            if (!uniq[binding.name]) {
                uniq[binding.name] = value
                bindings.push(binding)
                if (type === 'for') {
                    return [avalon.mix(binding, tuple[3])]
                }
            }

        }
    }
    bindings.sort(byPriority)
    return bindings
}
export function byPriority(a, b) {
    return a.priority - b.priority
}


var rimprovePriority = /[+-\?]/
var rinnerValue = /__value__\)$/
export function parseInterpolate(expr) {
    var rlineSp = /\n\r?/g
    var str = String(expr).trim().replace(rlineSp, '')
    var tokens = []
    do { //aaa{{@bbb}}ccc
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
            if (/\|\s*\w/.test(expr)) { //如果存在过滤器，优化干掉
                var arr = addScope(expr, 'expr')
                if (arr[1]) {
                    expr = arr[1].replace(rinnerValue, arr[0] + ')')
                }
            }
            if (rimprovePriority) {
                expr = 'avalon.text(' + expr + ')'
            }
            tokens.push(expr)

            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return tokens.join('+')
}
avalon.text = function(a){
    return a == null ? '': a+''
}