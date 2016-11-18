import { win, document, msie, inBrowser, root, modern } from './browser'
import { Cache } from './cache'
import { directive, directives, delayCompileNodes } from './directive'

export var window = win
export function avalon(el) {
        return new avalon.init(el)
}

avalon.init = function (el) {
        this[0] = this.element = el
}

avalon.fn = avalon.prototype = avalon.init.prototype

export function shadowCopy(destination, source) {
        for (var property in source) {
                destination[property] = source[property]
        }
        return destination
}
export var rword = /[^, ]+/g
export var rnowhite = /\S+/g //存在非空字符
export var platform = {} //用于放置平台差异的方法与属性
export var isArray = function (target) {
        return avalon.type(target) === 'array'
}

export function oneObject(array, val) {
        if (typeof array === 'string') {
                array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
                result[array[i]] = value
        }
        return result
}

var op = Object.prototype
export function quote(str) {
        return avalon._quote(str)
}
export var inspect = op.toString
export var ohasOwn = op.hasOwnProperty
export var ap = Array.prototype

var hasConsole = typeof console === 'object'
avalon.config = { debug: true }
export function log() {
        if (hasConsole && avalon.config.debug) {
                Function.apply.call(console.log, console, arguments)
        }
}
export {
        Cache, directive, directives, delayCompileNodes,
        document, root, msie, modern, inBrowser

}
export function warn() {
        if (hasConsole && avalon.config.debug) {
                var method = console.warn || console.log
                // http://qiang106.iteye.com/blog/1721425
                Function.apply.call(method, console, arguments)
        }
}
export function error(e, str) {
        throw (e || Error)(str)
}
export function noop() { }
export function isObject(a) {
        return a !== null && typeof a === 'object'
}

export function range(start, end, step) { // 用于生成整数数组
        step || (step = 1)
        if (end == null) {
                end = start || 0
                start = 0
        }
        var index = - 1,
                length = Math.max(0, Math.ceil((end - start) / step)),
                result = new Array(length)
        while (++index < length) {
                result[index] = start
                start += step
        }
        return result
}

var rhyphen = /([a-z\d])([A-Z]+)/g
export function hyphen(target) {
        //转换为连字符线风格
        return target.replace(rhyphen, '$1-$2').toLowerCase()
}

var rcamelize = /[-_][^-_]/g
export function camelize(target) {
        //提前判断，提高getStyle等的效率
        if (!target || target.indexOf('-') < 0 && target.indexOf('_') < 0) {
                return target
        }
        //转换为驼峰风格
        return target.replace(rcamelize, function (match) {
                return match.charAt(1).toUpperCase()
        })
}

export var _slice = ap.slice
export function slice(nodes, start, end) {
        return _slice.call(nodes, start, end)
}

var rhashcode = /\d\.\d{4}/
//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
export function makeHashCode(prefix) {
        /* istanbul ignore next*/
        prefix = prefix || 'avalon'
        /* istanbul ignore next*/
        return String(Math.random() + Math.random()).replace(rhashcode, prefix)
}
//生成事件回调的UUID(用户通过ms-on指令)
export function getLongID(fn) {
        /* istanbul ignore next */
        return fn.uuid || (fn.uuid = makeHashCode('e'))
}
var UUID = 1
//生成事件回调的UUID(用户通过avalon.bind)
export function getShortID(fn) {
        /* istanbul ignore next */
        return fn.uuid || (fn.uuid = '_' + (++UUID))
}



var rescape = /[-.*+?^${}()|[\]\/\\]/g
export function escapeRegExp(target) {
        //http://stevenlevithan.com/regex/xregexp/
        //将字符串安全格式化为正则表达式的源码
        return (target + '').replace(rescape, '\\$&')
}

export var eventHooks = {}
export var eventListeners = {}
export var validators = {}
export var cssHooks = {}


window.avalon = avalon

export function createFragment() {
        /* istanbul ignore next  */
        return document.createDocumentFragment()
}

var rentities = /&[a-z0-9#]{2,10};/
var temp = document.createElement('div')
shadowCopy(avalon, {
        Array: {
                merge: function (target, other) {
                        //合并两个数组 avalon2新增
                        target.push.apply(target, other)
                },
                ensure: function (target, item) {
                        //只有当前数组不存在此元素时只添加它
                        if (target.indexOf(item) === - 1) {
                                return target.push(item)
                        }
                },
                removeAt: function (target, index) {
                        //移除数组中指定位置的元素，返回布尔表示成功与否
                        return !!target.splice(index, 1).length
                },
                remove: function (target, item) {
                        //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否
                        var index = target.indexOf(item)
                        if (~index)
                                return avalon.Array.removeAt(target, index)
                        return false
                }
        },
        evaluatorPool: new Cache(888),
        parsers: {
                number: function (a) {
                        return a === '' ? '' : parseFloat(a) || 0
                },
                string: function (a) {
                        return a === null || a === void 0 ? '' : a + ''
                },
                boolean: function (a) {
                        if (a === '')
                                return a
                        return a === 'true' || a === '1'
                }
        },
        _decode: function _decode(str) {
                if (rentities.test(str)) {
                        temp.innerHTML = str
                        return temp.innerText || temp.textContent
                }
                return str
        }
})



//============== config ============
export function config(settings) {
        for (var p in settings) {
                var val = settings[p]
                if (typeof config.plugins[p] === 'function') {
                        config.plugins[p](val)
                } else {
                        config[p] = val
                }
        }
        return this
}


var plugins = {
        interpolate: function (array) {
                var openTag = array[0]
                var closeTag = array[1]
                if (openTag === closeTag) {
                        throw new SyntaxError('interpolate openTag cannot equal to closeTag')
                }
                var str = openTag + 'test' + closeTag

                if (/[<>]/.test(str)) {
                        throw new SyntaxError('interpolate cannot contains "<" or ">"')
                }

                config.openTag = openTag
                config.closeTag = closeTag
                var o = escapeRegExp(openTag)
                var c = escapeRegExp(closeTag)

                config.rtext = new RegExp(o + '(.+?)' + c, 'g')
                config.rexpr = new RegExp(o + '([\\s\\S]*)' + c)
        }
}
export function createAnchor(nodeValue){
    return document.createComment(nodeValue)
}
config.plugins = plugins
config({
        interpolate: ['{{', '}}'],
        debug: true
})
//============  config ============

shadowCopy(avalon, {
        shadowCopy,

        oneObject,
        inspect,
        ohasOwn,
        rword,
        version: 1,
        vmodels: {},
        
        directives,
        directive,

        eventHooks,
        eventListeners,
        validators,
        cssHooks,

        log,
        noop,
        warn,
        error,
        config,

        modern,
        msie,
        root,
        document,
        window,
        inBrowser,


        isObject,
        range,
        slice,
        hyphen,
        camelize,
        escapeRegExp,
        quote,

        makeHashCode,


})