//这里放置存在异议的方法

var serialize = avalon.inspect
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var rnative = /\[native code\]/ //判定是否原生函数
var rarraylike = /(Array|List|Collection|Map|Arguments)\]$/
var ohasOwn = avalon.ohasOwn
// avalon.quote
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

// Internal: Converts `value` into a zero-padded string such that its
// length is at least equal to `width`. The `width` must be <= 6.
var leadingZeroes = "000000"
var toPaddedString = function (width, value) {
    // The `|| 0` expression is necessary to work around a bug in
    // Opera <= 7.54u2 where `0 == -0`, but `String(-0) !== "0"`.
    return (leadingZeroes + (value || 0)).slice(-width)
};
var unicodePrefix = "\\u00"
var escapeChar = function (character) {
    var charCode = character.charCodeAt(0), escaped = Escapes[charCode]
    if (escaped) {
        return escaped
    }
    return unicodePrefix + toPaddedString(2, charCode.toString(16))
};
var reEscape = /[\x00-\x1f\x22\x5c]/g
function quote(value) {
    reEscape.lastIndex = 0
    return '"' + ( reEscape.test(value)? String(value).replace(reEscape, escapeChar) : value ) + '"'
}

avalon.quote = typeof JSON !== 'undefined' ? JSON.stringify : quote

// avalon.type
var class2type = {}
'Boolean Number String Function Array Date RegExp Object Error'.replace(avalon.rword, function (name) {
    class2type['[object ' + name + ']'] = name.toLowerCase()
})

avalon.type = function (obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === 'object' || typeof obj === 'function' ?
            class2type[serialize.call(obj)] || 'object' :
            typeof obj
}

var rfunction = /^\s*\bfunction\b/

avalon.isFunction = typeof alert === 'object' ? function (fn) {
    try {
        return rfunction.test(fn + '')
    } catch (e) {
        return false
    }
} : function (fn) {
    return serialize.call(fn) === '[object Function]'
}

avalon.isWindow = function (obj) {
    if (!obj)
        return false
    // 利用IE678 window == document为true,document == window竟然为false的神奇特性
    // 标准浏览器及IE9，IE10等使用 正则检测
    return obj == obj.document && obj.document != obj //jshint ignore:line
}


function isWindow(obj) {
    return rwindow.test(serialize.call(obj))
}

if (isWindow(avalon.window)) {
    avalon.isWindow = isWindow
}

var enu, enumerateBUG
for (enu in avalon({})) {
    break
}
enumerateBUG = enu !== '0' //IE6下为true, 其他为false

/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
avalon.isPlainObject = function (obj, key) {
    if (!obj || avalon.type(obj) !== 'object' || obj.nodeType || avalon.isWindow(obj)) {
        return false
    }
    try { //IE内置对象没有constructor
        if (obj.constructor &&
                !ohasOwn.call(obj, 'constructor') &&
                !ohasOwn.call(obj.constructor.prototype || {}, 'isPrototypeOf')) {
            return false
        }
    } catch (e) { //IE8 9会在这里抛错
        return false
    }
    if (enumerateBUG) {
        for (key in obj) {
            return ohasOwn.call(obj, key)
        }
    }
    for (key in obj) {
    }
    return key === void 0 || ohasOwn.call(obj, key)
}


if (rnative.test(Object.getPrototypeOf)) {
    avalon.isPlainObject = function (obj) {
        // 简单的 typeof obj === 'object'检测，会致使用isPlainObject(window)在opera下通不过
        return serialize.call(obj) === '[object Object]' &&
                Object.getPrototypeOf(obj) === Object.prototype
    }
}

//与jQuery.extend方法，可用于浅拷贝，深拷贝
avalon.mix = avalon.fn.mix = function () {
    var options, name, src, copy, copyIsArray, clone,
            target = arguments[0] || {},
            i = 1,
            length = arguments.length,
            deep = false

    // 如果第一个参数为布尔,判定是否深拷贝
    if (typeof target === 'boolean') {
        deep = target
        target = arguments[1] || {}
        i++
    }

    //确保接受方为一个复杂的数据类型
    if (typeof target !== 'object' && !avalon.isFunction(target)) {
        target = {}
    }

    //如果只有一个参数，那么新成员添加于mix所在的对象上
    if (i === length) {
        target = this
        i--
    }

    for (; i < length; i++) {
        //只处理非空参数
        if ((options = arguments[i]) != null) {
            for (name in options) {
                try {
                    src = target[name]
                    copy = options[name] //当options为VBS对象时报错
                } catch (e) {
                    continue
                }

                // 防止环引用
                if (target === copy) {
                    continue
                }
                if (deep && copy && (avalon.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {

                    if (copyIsArray) {
                        copyIsArray = false
                        clone = src && Array.isArray(src) ? src : []

                    } else {
                        clone = src && avalon.isPlainObject(src) ? src : {}
                    }

                    target[name] = avalon.mix(deep, clone, copy)
                } else if (copy !== void 0) {
                    target[name] = copy
                }
            }
        }
    }
    return target
}

/*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
function isArrayLike(obj) {
    if (!obj)
        return false
    var n = obj.length
    if (n === (n >>> 0)) { //检测length属性是否为非负整数
        var type = serialize.call(obj).slice(8, -1)
        if (rarraylike.test(type))
            return false
        if (type === 'Array')
            return true
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


avalon.each = function (obj, fn) {
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

module.exports = {
    avalon: avalon,
    isArrayLike: isArrayLike
}

