//这里放置存在异议的方法

var serialize = avalon.inspect
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var rarraylike = /(Array|List|Collection|Map|Arguments)\]$/

avalon.quote = JSON.stringify

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


avalon.isFunction = function (fn) {
    return typeof fn === 'function'
}

avalon.isWindow = function (obj) {
    return rwindow.test(serialize.call(obj))
}


/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
avalon.isPlainObject = function (obj) {
    // 简单的 typeof obj === 'object'检测，会致使用isPlainObject(window)在opera下通不过
    return serialize.call(obj) === '[object Object]' &&
            Object.getPrototypeOf(obj) === Object.prototype
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
    if (typeof target !== 'object' && typeof target !== 'function') {
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
                src = target[name]
                try {
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
    if (obj && typeof obj === 'object') {
        var n = obj.length,
                str = serialize.call(obj)
        if (rarraylike.test(str)) {
            return true
        } else if (str === '[object Object]' && n === (n >>> 0)) {
            return true //由于ecma262v5能修改对象属性的enumerable，因此不能用propertyIsEnumerable来判定了
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


