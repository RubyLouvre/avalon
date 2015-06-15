/*********************************************************************
 *                         javascript 底层补丁                       *
 **********************************************************************/
if (!"司徒正美".trim) {
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g
    String.prototype.trim = function () {
        return this.replace(rtrim, "")
    }
}
var hasDontEnumBug = !({
    'toString': null
}).propertyIsEnumerable('toString'),
        hasProtoEnumBug = (function () {
        }).propertyIsEnumerable('prototype'),
        dontEnums = [
            "toString",
            "toLocaleString",
            "valueOf",
            "hasOwnProperty",
            "isPrototypeOf",
            "propertyIsEnumerable",
            "constructor"
        ],
        dontEnumsLength = dontEnums.length;
if (!Object.keys) {
    Object.keys = function (object) { //ecma262v5 15.2.3.14
        var theKeys = []
        var skipProto = hasProtoEnumBug && typeof object === "function"
        if (typeof object === "string" || (object && object.callee)) {
            for (var i = 0; i < object.length; ++i) {
                theKeys.push(String(i))
            }
        } else {
            for (var name in object) {
                if (!(skipProto && name === "prototype") && ohasOwn.call(object, name)) {
                    theKeys.push(String(name))
                }
            }
        }

        if (hasDontEnumBug) {
            var ctor = object.constructor,
                    skipConstructor = ctor && ctor.prototype === object
            for (var j = 0; j < dontEnumsLength; j++) {
                var dontEnum = dontEnums[j]
                if (!(skipConstructor && dontEnum === "constructor") && ohasOwn.call(object, dontEnum)) {
                    theKeys.push(dontEnum)
                }
            }
        }
        return theKeys
    }
}
if (!Array.isArray) {
    Array.isArray = function (a) {
        return serialize.call(a) === "[object Array]"
    }
}

if (!noop.bind) {
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

function iterator(vars, body, ret) {
    var fun = 'for(var ' + vars + 'i=0,n = this.length; i < n; i++){' + body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') + '}' + ret
    /* jshint ignore:start */
    return Function("fn,scope", fun)
    /* jshint ignore:end */
}
if (!rnative.test([].map)) {
    avalon.mix(ap, {
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
        forEach: iterator("", '_', ""),
        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Prototype.js的对应名字为collect。
        map: iterator('r=[],', 'r[i]=_', 'return r'),
        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Prototype.js的对应名字为any。
        some: iterator("", 'if(_)return true', 'return false'),
        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Prototype.js的对应名字为all。
        every: iterator("", 'if(!_)return false', 'return true')
    })
}