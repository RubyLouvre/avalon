
/**
 * 此模块不依赖任何模块,用于修复语言的底层缺陷
 */

var ohasOwn = Object.prototype.hasOwnProperty

if (!'司徒正美'.trim) {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
    String.prototype.trim = function () {
        return this.replace(rtrim, '')
    }
}
var hasDontEnumBug = !({
    'toString': null
}).propertyIsEnumerable('toString'),
        hasProtoEnumBug = (function () {
        }).propertyIsEnumerable('prototype'),
        dontEnums = [
            'toString',
            'toLocaleString',
            'valueOf',
            'hasOwnProperty',
            'isPrototypeOf',
            'propertyIsEnumerable',
            'constructor'
        ],
        dontEnumsLength = dontEnums.length;
if (!Object.keys) {
    Object.keys = function (object) { //ecma262v5 15.2.3.14
        var theKeys = []
        var skipProto = hasProtoEnumBug && typeof object === 'function'
        if (typeof object === 'string' || (object && object.callee)) {
            for (var i = 0; i < object.length; ++i) {
                theKeys.push(String(i))
            }
        } else {
            for (var name in object) {
                if (!(skipProto && name === 'prototype') &&
                        ohasOwn.call(object, name)) {
                    theKeys.push(String(name))
                }
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                    skipConstructor = ctor && ctor.prototype === object
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j]
                if (!(skipConstructor && dontEnum === 'constructor') && ohasOwn.call(object, dontEnum)) {
                    theKeys.push(dontEnum)
                }
            }
        }
        return theKeys
    }
}
if (!Array.isArray) {
    Array.isArray = function (a) {
        return Object.prototype.toString.call(a) === '[object Array]'
    }
}

if (!Array.isArray.bind) {
    Function.prototype.bind = function (scope) {
        if (arguments.length < 2 && scope === void 0)
            return this
        var fn = this,
                argv = arguments
        return function () {
            var args = [],
                    i
            for (i = 1; i < argv.length; i++)
                args.push(argv[i])
            for (i = 0; i < arguments.length; i++)
                args.push(arguments[i])
            return fn.apply(scope, args)
        }
    }
}
//https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Reference/Global_Objects/Array/slice
/**
* Shim for "fixing" IE's lack of support (IE < 9) for applying slice
* on host objects like NamedNodeMap, NodeList, and HTMLCollection
* (technically, since host objects have been implementation-dependent,
* at least before ES6, IE hasn't needed to work this way).
* Also works on strings, fixes IE < 9 to allow an explicit undefined
* for the 2nd argument (as in Firefox), and prevents errors when
* called on other DOM objects.
*/

var _slice = Array.prototype.slice
try {
    // Can't be used with DOM elements in IE < 9
    _slice.call(document.documentElement)
} catch (e) { // Fails in IE < 9
    // This will work for genuine arrays, array-like objects,
    // NamedNodeMap (attributes, entities, notations),
    // NodeList (e.g., getElementsByTagName), HTMLCollection (e.g., childNodes),
    // and will not fail on other DOM objects (as do DOM elements in IE < 9)
    Array.prototype.slice = function (begin, end) {
        // IE < 9 gets unhappy with an undefined end argument
        end = (typeof end !== 'undefined') ? end : this.length

        // For native Array objects, we use the native slice function
        if (Array.isArray(this) ) {
            return _slice.call(this, begin, end)
        }

        // For array like object we handle it ourselves.
        var i, cloned = [],
                size, len = this.length

        // Handle negative value for "begin"
        var start = begin || 0
        start = (start >= 0) ? start : len + start

        // Handle negative value for "end"
        var upTo = (end) ? end : len
        if (end < 0) {
            upTo = len + end
        }

        // Actual expected size of the slice
        size = upTo - start

        if (size > 0) {
            cloned = new Array(size)
            if (this.charAt) {
                for (i = 0; i < size; i++) {
                    cloned[i] = this.charAt(start + i)
                }
            } else {
                for (i = 0; i < size; i++) {
                    cloned[i] = this[start + i]
                }
            }
        }

        return cloned
    }
}

function iterator(vars, body, ret) {
    var fun = 'for(var ' + vars + 'i=0,n = this.length; i < n; i++){' +
            body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') +
            '}' + ret
    /* jshint ignore:start */
    return Function('fn,scope', fun)
    /* jshint ignore:end */
}

var ap = Array.prototype
if (!/\[native code\]/.test(ap.map)) {
    var shim = {
        //定位操作，返回数组中第一个等于给定参数的元素的索引值。
        indexOf: function (item, index) {
            var n = this.length,
                    i = ~~index
            if (i < 0)
                i += n
            for (; i < n; i++)
                if (this[i] === item)
                    return i
            return -1
        },
        //定位操作，同上，不过是从后遍历。
        lastIndexOf: function (item, index) {
            var n = this.length,
                    i = index == null ? n - 1 : index
            if (i < 0)
                i = Math.max(0, n + i)
            for (; i >= 0; i--)
                if (this[i] === item)
                    return i
            return -1
        },
        //迭代操作，将数组的元素挨个儿传入一个函数中执行。Prototype.js的对应名字为each。
        forEach: iterator('', '_', ''),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Prototype.js的对应名字为collect。
        map: iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Prototype.js的对应名字为any。
        some: iterator('', 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Prototype.js的对应名字为all。
        every: iterator('', 'if(!_)return false', 'return true')
    }

    for (var i in shim) {
        ap[i] = shim[i]
    }
}
module.exports = {}