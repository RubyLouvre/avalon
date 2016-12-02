//这里放置存在异议的方法
import './lang.fix'
import { avalon, ohasOwn, inspect, window } from './core'
export { avalon }

export var compaceQuote = (function() {
    //https://github.com/bestiejs/json3/blob/master/lib/json3.js
    var Escapes = {
        92: "\\\\",
        34: '\\"',
        8: "\\b",
        12: "\\f",
        10: "\\n",
        13: "\\r",
        9: "\\t"
    }

    var leadingZeroes = '000000'
    var toPaddedString = function(width, value) {
        return (leadingZeroes + (value || 0)).slice(-width)
    };
    var unicodePrefix = '\\u00'
    var escapeChar = function(character) {
        var charCode = character.charCodeAt(0),
            escaped = Escapes[charCode]
        if (escaped) {
            return escaped
        }
        return unicodePrefix + toPaddedString(2, charCode.toString(16))
    };
    var reEscape = /[\x00-\x1f\x22\x5c]/g
    return function(value) {
        /* istanbul ignore next */
        reEscape.lastIndex = 0
            /* istanbul ignore next */
        return '"' + (reEscape.test(value) ? String(value).replace(reEscape, escapeChar) : value) + '"'
    }
})()
try {
    avalon._quote = JSON.stringify
} catch (e) {
    /* istanbul ignore next  */
    avalon._quote = compaceQuote
}

var class2type = {}
'Boolean Number String Function Array Date RegExp Object Error'.replace(avalon.rword, function(name) {
    class2type['[object ' + name + ']'] = name.toLowerCase()
})

avalon.type = function(obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === 'object' || typeof obj === 'function' ?
        class2type[inspect.call(obj)] || 'object' :
        typeof obj
}


var rfunction = /^\s*\bfunction\b/

avalon.isFunction = /* istanbul ignore if */ typeof alert === 'object' ? function(fn) {
    /* istanbul ignore next */
    try {
        /* istanbul ignore next */
        return rfunction.test(fn + '')
    } catch (e) {
        /* istanbul ignore next */
        return false
    }
} : function(fn) {
    return inspect.call(fn) === '[object Function]'
}


// 利用IE678 window == document为true,document == window竟然为false的神奇特性
// 标准浏览器及IE9，IE10等使用 正则检测
/* istanbul ignore next */
function isWindowCompact(obj) {
    if (!obj) {
        return false
    }
    return obj == obj.document && obj.document != obj //jshint ignore:line
}

var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/

function isWindowModern(obj) {
    return rwindow.test(inspect.call(obj))
}

avalon.isWindow = isWindowModern(avalon.window) ?
    isWindowModern : isWindowCompact

var enu, enumerateBUG
for (enu in avalon({})) {
    break
}

enumerateBUG = enu !== '0' //IE6下为true, 其他为false

/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
/* istanbul ignore next */
export function isPlainObjectCompact(obj, key) {
    if (!obj || avalon.type(obj) !== 'object' || obj.nodeType || avalon.isWindow(obj)) {
        return false
    }
    try { //IE内置对象没有constructor
        if (obj.constructor &&
            !ohasOwn.call(obj, 'constructor') &&
            !ohasOwn.call(obj.constructor.prototype, 'isPrototypeOf')) {
            return false
        }
        var isVBscript = obj.$vbthis
    } catch (e) { //IE8 9会在这里抛错
        return false
    }
    /* istanbul ignore if */
    if (enumerateBUG) {
        for (key in obj) {
            return ohasOwn.call(obj, key)
        }
    }
    for (key in obj) {}
    return key === undefined || ohasOwn.call(obj, key)
}

/* istanbul ignore next */
function isPlainObjectModern(obj) {
    // 简单的 typeof obj === 'object'检测，会致使用isPlainObject(window)在opera下通不过
    return inspect.call(obj) === '[object Object]' &&
        Object.getPrototypeOf(obj) === Object.prototype
}
/* istanbul ignore next */
avalon.isPlainObject = /\[native code\]/.test(Object.getPrototypeOf) ?
    isPlainObjectModern : isPlainObjectCompact

var rcanMix = /object|function/

//与jQuery.extend方法，可用于浅拷贝，深拷贝
/* istanbul ignore next */
avalon.mix = avalon.fn.mix = function() {
    var n = arguments.length,
        isDeep = false,
        i = 0,
        array = []
    if (arguments[0] === true) {
        isDeep = true
        i = 1
    }
    //将所有非空对象变成空对象
    for (; i < n; i++) {
        var el = arguments[i]
        el = el && rcanMix.test(typeof el) ? el : {}
        array.push(el)
    }
    if (array.length === 1) {
        array.unshift(this)
    }
    return innerExtend(isDeep, array)
}
var undefined

function innerExtend(isDeep, array) {
    var target = array[0],
        copyIsArray, clone, name
    for (var i = 1, length = array.length; i < length; i++) {
        //只处理非空参数
        var options = array[i]
        var noCloneArrayMethod = Array.isArray(options)
        for (name in options) {
            if (noCloneArrayMethod && !options.hasOwnProperty(name)) {
                continue
            }
            try {
                var src = target[name]
                var copy = options[name] //当options为VBS对象时报错
            } catch (e) {
                continue
            }

            // 防止环引用
            if (target === copy) {
                continue
            }
            if (isDeep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

                if (copyIsArray) {
                    copyIsArray = false
                    clone = src && Array.isArray(src) ? src : []

                } else {
                    clone = src && avalon.isPlainObject(src) ? src : {}
                }

                target[name] = innerExtend(isDeep, [clone, copy])
            } else if (copy !== undefined) {
                target[name] = copy
            }
        }
    }
    return target
}

var rarraylike = /(Array|List|Collection|Map|Arguments)\]$/
    /*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
    /* istanbul ignore next */
export function isArrayLike(obj) {
    if (!obj)
        return false
    var n = obj.length
    if (n === (n >>> 0)) { //检测length属性是否为非负整数
        var type = inspect.call(obj)
        if (rarraylike.test(type))
            return true
        if(type !== '[object Object]')
            return false
        try {
            if ({}.propertyIsEnumerable.call(obj, 'length') === false) { //如果是原生对象
                return rfunction.test(obj.item || obj.callee)
            }
            return true
        } catch (e) { //IE的NodeList直接抛错
            return !obj.window //IE6-8 window
        }
    }
    return false
}


avalon.each = function(obj, fn) {
    if (obj) { //排除null, undefined
        var i = 0
        if (isArrayLike(obj)) {
            for (var n = obj.length; i < n; i++) {
                if (fn(i, obj[i]) === false)
                    break
            }
        } else {
            for (i in obj) {
                if (obj.hasOwnProperty(i) && fn(i, obj[i]) === false) {
                    break
                }
            }
        }
    }
}

;
(function() {
    var welcomeIntro = ["%cavalon.js %c" + avalon.version + " %cin debug mode, %cmore...", "color: rgb(114, 157, 52); font-weight: normal;", "color: rgb(85, 85, 85); font-weight: normal;", "color: rgb(85, 85, 85); font-weight: normal;", "color: rgb(82, 140, 224); font-weight: normal; text-decoration: underline;"];
    var welcomeMessage = "You're running avalon in debug mode - messages will be printed to the console to help you fix problems and optimise your application.\n\n" +
        'To disable debug mode, add this line at the start of your app:\n\n  avalon.config({debug: false});\n\n' +
        'Debug mode also automatically shut down amicably when your app is minified.\n\n' +
        "Get help and support:\n  https://segmentfault.com/t/avalon\n  http://avalonjs.coding.me/\n  http://www.baidu-x.com/?q=avalonjs\n  http://www.avalon.org.cn/\n\nFound a bug? Raise an issue:\n  https://github.com/RubyLouvre/avalon/issues\n\n";
    if (typeof console === 'object') {
        var con = console
        var method = con.groupCollapsed || con.log
        Function.apply.call(method, con, welcomeIntro)
        con.log(welcomeMessage)
        if (method !== console.log) {
            con.groupEnd(welcomeIntro);
        }
    }
})()