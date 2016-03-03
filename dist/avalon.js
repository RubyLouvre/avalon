(function webpackUniversalModuleDefinition(root, factory) {
	if(typeof exports === 'object' && typeof module === 'object')
		module.exports = factory();
	else if(typeof define === 'function' && define.amd)
		define([], factory);
	else if(typeof exports === 'object')
		exports["avalon"] = factory();
	else
		root["avalon"] = factory();
})(this, function() {
return /******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(global) {__webpack_require__(1)
	//var buildin = global.buildin = 
	__webpack_require__(2)
	var avalon = global.avalon = __webpack_require__(3).avalon //这个版本兼容IE6

	__webpack_require__(4)
	__webpack_require__(5)
	__webpack_require__(11)

	avalon.define = __webpack_require__(19).define
	avalon.mediatorFactory = __webpack_require__(19).mediatorFactory

	__webpack_require__(35)

	__webpack_require__(27)
	module.exports = avalon



	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 1 */
/***/ function(module, exports) {

	
	/**
	 * 此模块不依赖任何模块,用于修复语言的底层缺陷
	 */

	var ohasOwn = Object.prototype.hasOwnProperty

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
	                if (!(skipProto && name === "prototype") &&
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
	        return String.prototype.toString.call(a) === "[object Array]"
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

	function iterator(vars, body, ret) {
	    var fun = 'for(var ' + vars + 'i=0,n = this.length; i < n; i++){' +
	            body.replace('_', '((i in this) && fn.call(scope,this[i],i,this))') +
	            '}' + ret
	    /* jshint ignore:start */
	    return Function("fn,scope", fun)
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
	        forEach: iterator("", '_', ""),
	        //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
	        filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
	        //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Prototype.js的对应名字为collect。
	        map: iterator('r=[],', 'r[i]=_', 'return r'),
	        //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Prototype.js的对应名字为any。
	        some: iterator("", 'if(_)return true', 'return false'),
	        //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Prototype.js的对应名字为all。
	        every: iterator("", 'if(!_)return false', 'return true')
	    }

	    for (var i in shim) {
	        ap[i] = shim[i]
	    }
	}
	module.exports = {}

/***/ },
/* 2 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {

	var ap = Array.prototype
	var op = Object.prototype
	var rword = /[^, ]+/g
	var rd4 = /\d\.\d{4}/
	var rhyphen = /([a-z\d])([A-Z]+)/g
	var rcamelize = /[-_][^-_]/g
	var isStaticNode = false
	var window = global
	var serialize = op.toString


	function noop() {
	}
	var builtin = {
	    log: function () {
	        if (window.console && avalon.config.debug) {
	            // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
	            Function.apply.call(console.log, console, arguments)
	        }
	    },
	    error: function (str, e) {
	        throw (e || Error)(str)
	    },
	    /* avalon.range(10)
	     => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
	     avalon.range(1, 11)
	     => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
	     avalon.range(0, 30, 5)
	     => [0, 5, 10, 15, 20, 25]
	     avalon.range(0, -10, -1)
	     => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
	     avalon.range(0)
	     => []*/
	    range: function (start, end, step) { // 用于生成整数数组
	        step || (step = 1)
	        if (end == null) {
	            end = start || 0
	            start = 0
	        }
	        var index = -1,
	                length = Math.max(0, Math.ceil((end - start) / step)),
	                result = new Array(length)
	        while (++index < length) {
	            result[index] = start
	            start += step
	        }
	        return result
	    },
	    noop: noop,
	    //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
	    nullObject: {},
	    //切割字符串为一个个小块，以空格或逗号分开它们，结合replace实现字符串的forEach
	    rword: rword,
	    rw20g: /\w+/g,
	    rsvg: /^\[object SVG\w*Element\]$/,
	    ramp: /&amp;/g,
	    rmsAttr: /^(?:ms|av)-(\w+)-?(.*)/,
	    document: {//方便在nodejs环境不会报错
	        createElement: function () {
	            return {}
	        },
	        contains: noop
	    },
	    root: {
	        outerHTML: "x"
	    },
	    ap: ap,
	    op: op,
	    ohasOwn: op.hasOwnProperty,
	    aslice: ap.slice,
	    W3C: true,
	    window: global,
	    serialize: serialize,
	    bindingID: 1,
	    msie: NaN,
	    //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	    makeHashCode: function (prefix) {
	        prefix = prefix || "avalon"
	        return String(Math.random() + Math.random()).replace(rd4, prefix)
	    },
	    markID: function (fn) {
	        return fn.uuid || (fn.uuid = builtin.makeHashCode("e"))
	    },
	    /*将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象*/
	    oneObject: function (array, val) {
	        if (typeof array === "string") {
	            array = array.match(rword) || []
	        }
	        var result = {},
	                value = val !== void 0 ? val : 1
	        for (var i = 0, n = array.length; i < n; i++) {
	            result[array[i]] = value
	        }
	        return result
	    },
	    hyphen: function (target) {
	        //转换为连字符线风格
	        return target.replace(rhyphen, "$1-$2").toLowerCase()
	    },
	    camelize: function (target) {
	        //提前判断，提高getStyle等的效率
	        if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
	            return target
	        }
	        //转换为驼峰风格
	        return target.replace(rcamelize, function (match) {
	            return match.charAt(1).toUpperCase()
	        })
	    },
	    pushArray: function (target, other) {
	        target.push.apply(target, other)
	    }
	}

	if (window.window === window) {
	    var document = window.document
	    builtin.W3C = window.dispatchEvent
	    builtin.document = document
	    builtin.root = document.documentElement
	    builtin.avalonFragment = document.createDocumentFragment()
	    builtin.div = document.createElement("div")
	    if (window.VBArray) {
	        builtin.msie = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
	    }
	    var textNode = document.createTextNode("test")
	    try {
	        textNode.uuid = 1234
	    } catch (e) {
	        isStaticNode = true
	    }
	}

	builtin.nextTick = (function () {// jshint ignore:line
	    var tickImmediate = window.setImmediate
	    var tickObserver = window.MutationObserver
	    if (tickImmediate) {
	        return tickImmediate.bind(window)
	    }

	    var queue = []
	    function callback() {
	        var n = queue.length
	        for (var i = 0; i < n; i++) {
	            queue[i]()
	        }
	        queue = queue.slice(n)
	    }

	    if (tickObserver) {
	        var node = document.createTextNode("avalon")
	        new tickObserver(callback).observe(node, {characterData: true})// jshint ignore:line
	        var bool = false
	        return function (fn) {
	            queue.push(fn)
	            bool = !bool
	            node.data = bool
	        }
	    }
	    return function (fn) {
	        setTimeout(fn, 4)
	    }
	})()

	var nodeList = []
	var uuidList = []
	function getUid(el) {
	    //对IE6-8的文本节点或注释节点(甚至对其toString, childNodes等子属性)添加任何属性都会抛错
	    if (isStaticNode && (el.nodeType === 3 || el.nodeType === 8)) {
	        var index = nodeList.indexOf(el)
	        if (index === -1) {
	            index = nodeList.push(el)
	            var uuid = "_" + (++builtin.bindingID)
	            return uuidList[index] = uuid
	        } else {
	            return uuidList[index]
	        }
	    }
	    return el.uuid || (el.uuid = "_" + (++builtin.bindingID))
	}


	var meta = {
	    '\b': '\\b',
	    '\t': '\\t',
	    '\n': '\\n',
	    '\f': '\\f',
	    '\r': '\\r',
	    '"': '\\"',
	    '\\': '\\\\'
	}
	var quote = typeof JSON !== "undefined" ? JSON.stringify : function (str) {
	    return '"' + str.replace(/[\\\"\x00-\x1f]/g, function (a) {
	        var c = meta[a];
	        return typeof c === 'string' ? c :
	                '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
	    }) + '"'
	}

	builtin.quote = quote
	builtin.getUid = getUid

	var class2type = {}
	"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function (name) {
	    class2type["[object " + name + "]"] = name.toLowerCase()
	})

	builtin.type = function (obj) { //取得目标的类型
	    if (obj == null) {
	        return String(obj)
	    }
	    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
	    return typeof obj === "object" || typeof obj === "function" ?
	            class2type[serialize.call(obj)] || "object" :
	            typeof obj
	}

	module.exports = builtin



	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(2)
	var serialize = vars.serialize
	var ohasOwn = vars.ohasOwn
	var rword = vars.rword
	var ap = vars.ap

	var rfunction = /^\s*\bfunction\b/
	var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
	var rnative = /\[native code\]/ //判定是否原生函数
	var rarraylike = /(?:regexp|string|function|window|global)$/i

	/**
	 * 创建jQuery式的无new 实例化结构
	 * @param {Element} el
	 * @returns {avalon.init}
	 */
	function avalon(el) {
	    return new avalon.init(el)
	}

	avalon.init = function (el) {
	    this[0] = this.element = el
	}

	avalon.fn = avalon.prototype = avalon.init.prototype


	"noop,msie,rword,getUid,oneObject,nextTick,type,error,log,range".replace(rword,
	        function (name) {
	            avalon[name] = vars[name]
	        })

	avalon.isFunction = typeof alert === "object" ? function (fn) {
	    try {
	        return rfunction.test(fn + "")
	    } catch (e) {
	        return false
	    }
	} : function (fn) {
	    return serialize.call(fn) === "[object Function]"
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

	if (isWindow(vars.window)) {
	    avalon.isWindow = isWindow
	}

	var enu, enumerateBUG
	for (enu in avalon({})) {
	    break
	}
	enumerateBUG = enu !== "0" //IE6下为true, 其他为false

	/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
	avalon.isPlainObject = function (obj, key) {
	    if (!obj || avalon.type(obj) !== "object" || obj.nodeType || avalon.isWindow(obj)) {
	        return false;
	    }
	    try { //IE内置对象没有constructor
	        if (obj.constructor && !ohasOwn.call(obj, "constructor") &&
	                !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
	            return false;
	        }
	    } catch (e) { //IE8 9会在这里抛错
	        return false;
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
	        // 简单的 typeof obj === "object"检测，会致使用isPlainObject(window)在opera下通不过
	        return serialize.call(obj) === "[object Object]" &&
	                Object.getPrototypeOf(obj) === vars.op
	    }
	}


	avalon.slice = function (nodes, start, end) {
	    if(nodes && !Array.isArray(nodes) ){
	        var temp = []
	        for(var i = 0, n = nodes.length; i < n; i++){
	            temp[i] = nodes[i]
	        }
	        nodes = temp
	    }
	    return ap.slice.call(nodes, start, end)
	}

	//与jQuery.extend方法，可用于浅拷贝，深拷贝
	avalon.mix = avalon.fn.mix = function () {
	    var options, name, src, copy, copyIsArray, clone,
	            target = arguments[0] || {},
	            i = 1,
	            length = arguments.length,
	            deep = false

	    // 如果第一个参数为布尔,判定是否深拷贝
	    if (typeof target === "boolean") {
	        deep = target
	        target = arguments[1] || {}
	        i++
	    }

	    //确保接受方为一个复杂的数据类型
	    if (typeof target !== "object" && !avalon.isFunction(target)) {
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
	    if (!obj)
	        return false
	    var n = obj.length
	    if (n === (n >>> 0)) { //检测length属性是否为非负整数
	        var type = serialize.call(obj).slice(8, -1)
	        if (rarraylike.test(type))
	            return false
	        if (type === "Array")
	            return true
	        try {
	            if ({}.propertyIsEnumerable.call(obj, "length") === false) { //如果是原生对象
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

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(2)
	var window = vars.window
	var noop = vars.noop

	var cssHooks = {}

	avalon.mix({
	    caches: {},
	    version: 2.0,
	    ui: {}, //兼容1.4.*

	    eventHooks: {},
	    cssHooks: cssHooks,
	    filters: {},
	    /*读写删除元素节点的样式*/
	    css: function (node, name, value) {
	        if (node instanceof avalon) {
	            node = node[0]
	        }
	        var prop = /[_-]/.test(name) ? vars.camelize(name) : name,
	                fn
	        name = avalon.cssName(prop) || prop
	        if (value === void 0 || typeof value === "boolean") { //获取样式
	            fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
	            if (name === "background") {
	                name = "backgroundColor"
	            }
	            var val = fn(node, name)
	            return value === true ? parseFloat(val) || 0 : val
	        } else if (value === "") { //请除样式
	            node.style[name] = ""
	        } else { //设置样式
	            if (value == null || value !== value) {
	                return
	            }
	            if (isFinite(value) && !avalon.cssNumber[prop]) {
	                value += "px"
	            }
	            fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
	            fn(node, name, value)
	        }
	    },
	    components: {}, //1.5新增

	    isObject: function (a) {//1.6新增
	        return a !== null && typeof a === "object"
	    },
	    Array: {
	        /*只有当前数组不存在此元素时只添加它*/
	        ensure: function (target, item) {
	            if (target.indexOf(item) === -1) {
	                return target.push(item)
	            }
	        },
	        /*移除数组中指定位置的元素，返回布尔表示成功与否*/
	        removeAt: function (target, index) {
	            return !!target.splice(index, 1).length
	        },
	        /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
	        remove: function (target, item) {
	            var index = target.indexOf(item)
	            if (~index)
	                return avalon.Array.removeAt(target, index)
	            return false
	        }
	    }
	})

	var directives = avalon.directives = {}

	avalon.directive = function (name, obj) {
	    obj.init = (obj.init || noop)
	    obj.update = (obj.update || noop)

	    return directives[name] = obj
	}


/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

	
	/*********************************************************************
	 *                          DOM Api                               *
	 *           补丁,接口,css,attr,html,val,event                     *
	 **********************************************************************/

	var builtin = __webpack_require__(2)
	__webpack_require__(6)
	__webpack_require__(8)
	__webpack_require__(9)
	var document = builtin.document
	var window = builtin.window
	var oneObject = builtin.oneObject
	var getUid = builtin.getUid

	var root = builtin.root
	var ap = builtin.ap
	var rword = builtin.rword
	var rsvg = builtin.rsvg
	var W3C = builtin.W3C
	var camelize = builtin.camelize


	/*******************************
	 *************补丁****************
	 ********************************/
	function fixContains(root, el) {
	    try { //IE6-8,游离于DOM树外的文本节点，访问parentNode有时会抛错
	        while ((el = el.parentNode))
	            if (el === root)
	                return true
	        return false
	    } catch (e) {
	        return false
	    }
	}

	avalon.contains = fixContains
	//IE6-11的文档对象没有contains
	if (!document.contains) {
	    document.contains = function (b) {
	        return fixContains(document, b)
	    }
	}

	function outerHTML() {
	    return new XMLSerializer().serializeToString(this)
	}

	if (window.SVGElement) {
	    //safari5+是把contains方法放在Element.prototype上而不是Node.prototype
	    if (!document.createTextNode("x").contains) {
	        Node.prototype.contains = function (arg) {//IE6-8没有Node对象
	            return !!(this.compareDocumentPosition(arg) & 16)
	        }
	    }
	    var svgns = "http://www.w3.org/2000/svg"
	    var svg = document.createElementNS(svgns, "svg")
	    svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
	    if (!builtin.rsvg.test(svg.firstChild)) { // #409
	        function enumerateNode(node, targetNode) {// jshint ignore:line
	            if (node && node.childNodes) {
	                var nodes = node.childNodes
	                for (var i = 0, el; el = nodes[i++]; ) {
	                    if (el.tagName) {
	                        var svg = document.createElementNS(svgns,
	                                el.tagName.toLowerCase())
	                        ap.forEach.call(el.attributes, function (attr) {
	                            svg.setAttribute(attr.name, attr.value) //复制属性
	                        })// jshint ignore:line
	                        // 递归处理子节点
	                        enumerateNode(el, svg)
	                        targetNode.appendChild(svg)
	                    }
	                }
	            }
	        }
	        Object.defineProperties(SVGElement.prototype, {
	            "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
	                enumerable: true,
	                configurable: true,
	                get: outerHTML,
	                set: function (html) {
	                    var tagName = this.tagName.toLowerCase(),
	                            par = this.parentNode,
	                            frag = avalon.parseHTML(html)
	                    // 操作的svg，直接插入
	                    if (tagName === "svg") {
	                        par.insertBefore(frag, this)
	                        // svg节点的子节点类似
	                    } else {
	                        var newFrag = document.createDocumentFragment()
	                        enumerateNode(frag, newFrag)
	                        par.insertBefore(newFrag, this)
	                    }
	                    par.removeChild(this)
	                }
	            },
	            "innerHTML": {
	                enumerable: true,
	                configurable: true,
	                get: function () {
	                    var s = this.outerHTML
	                    var ropen = new RegExp("<" + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', "i")
	                    var rclose = new RegExp("<\/" + this.nodeName + ">$", "i")
	                    return s.replace(ropen, "").replace(rclose, "")
	                },
	                set: function (html) {
	                    if (avalon.clearHTML) {
	                        avalon.clearHTML(this)
	                        var frag = avalon.parseHTML(html)
	                        enumerateNode(frag, this)
	                    }
	                }
	            }
	        })
	    }
	}
	if (!root.outerHTML && window.HTMLElement) { //firefox 到11时才有outerHTML
	    HTMLElement.prototype.__defineGetter__("outerHTML", outerHTML);
	}

	/*******************************
	 **************接口**************
	 ********************************/

	var fakeClassListMethods = {
	    _toString: function () {
	        var node = this.node
	        var cls = node.className
	        var str = typeof cls === "string" ? cls : cls.baseVal
	        return str.split(/\s+/).join(" ")
	    },
	    _contains: function (cls) {
	        return (" " + this + " ").indexOf(" " + cls + " ") > -1
	    },
	    _add: function (cls) {
	        if (!this.contains(cls)) {
	            this._set(this + " " + cls)
	        }
	    },
	    _remove: function (cls) {
	        this._set((" " + this + " ").replace(" " + cls + " ", " "))
	    },
	    __set: function (cls) {
	        cls = cls.trim()
	        var node = this.node
	        if (rsvg.test(node)) {
	            //SVG元素的className是一个对象 SVGAnimatedString { baseVal="", animVal=""}，只能通过set/getAttribute操作
	            node.setAttribute("class", cls)
	        } else {
	            node.className = cls
	        }
	    } //toggle存在版本差异，因此不使用它
	}

	function fakeClassList(node) {
	    if (!("classList" in node)) {
	        node.classList = {
	            node: node
	        }
	        for (var k in fakeClassListMethods) {
	            node.classList[k.slice(1)] = fakeClassListMethods[k]
	        }
	    }
	    return node.classList
	}


	"add,remove".replace(rword, function (method) {
	    avalon.fn[method + "Class"] = function (cls) {
	        var el = this[0]
	        //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
	        if (cls && typeof cls === "string" && el && el.nodeType === 1) {
	            cls.replace(/\S+/g, function (c) {
	                fakeClassList(el)[method](c)
	            })
	        }
	        return this
	    }
	})
	avalon.fn.mix({
	    hasClass: function (cls) {
	        var el = this[0] || {}
	        return el.nodeType === 1 && fakeClassList(el).contains(cls)
	    },
	    toggleClass: function (value, stateVal) {
	        var className, i = 0
	        var classNames = String(value).split(/\s+/)
	        var isBool = typeof stateVal === "boolean"
	        while ((className = classNames[i++])) {
	            var state = isBool ? stateVal : !this.hasClass(className)
	            this[state ? "addClass" : "removeClass"](className)
	        }
	        return this
	    },
	    attr: function (name, value) {
	        if (arguments.length === 2) {
	            this[0].setAttribute(name, value)
	            return this
	        } else {
	            return this[0].getAttribute(name)
	        }
	    },
	    data: function (name, value) {
	        name = "data-" + hyphen(name || "")
	        switch (arguments.length) {
	            case 2:
	                this.attr(name, value)
	                return this
	            case 1:
	                var val = this.attr(name)
	                return parseData(val)
	            case 0:
	                var ret = {}
	                ap.forEach.call(this[0].attributes, function (attr) {
	                    if (attr) {
	                        name = attr.name
	                        if (!name.indexOf("data-")) {
	                            name = camelize(name.slice(5))
	                            ret[name] = parseData(attr.value)
	                        }
	                    }
	                })
	                return ret
	        }
	    },
	    removeData: function (name) {
	        name = "data-" + hyphen(name)
	        this[0].removeAttribute(name)
	        return this
	    },
	    css: function (name, value) {
	        if (avalon.isPlainObject(name)) {
	            for (var i in name) {
	                avalon.css(this, i, name[i])
	            }
	        } else {
	            var ret = avalon.css(this, name, value)
	        }
	        return ret !== void 0 ? ret : this
	    },
	    position: function () {
	        var offsetParent, offset,
	                elem = this[0],
	                parentOffset = {
	                    top: 0,
	                    left: 0
	                }
	        if (!elem) {
	            return
	        }
	        if (this.css("position") === "fixed") {
	            offset = elem.getBoundingClientRect()
	        } else {
	            offsetParent = this.offsetParent() //得到真正的offsetParent
	            offset = this.offset() // 得到正确的offsetParent
	            if (offsetParent[0].tagName !== "HTML") {
	                parentOffset = offsetParent.offset()
	            }
	            parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
	            parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)

	            // Subtract offsetParent scroll positions
	            parentOffset.top -= offsetParent.scrollTop()
	            parentOffset.left -= offsetParent.scrollLeft()
	        }
	        return {
	            top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
	            left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
	        }
	    },
	    offsetParent: function () {
	        var offsetParent = this[0].offsetParent
	        while (offsetParent && avalon.css(offsetParent, "position") === "static") {
	            offsetParent = offsetParent.offsetParent;
	        }
	        return avalon(offsetParent || root)
	    },
	    bind: function (type, fn, phase) {
	        if (this[0]) { //此方法不会链
	            return avalon.bind(this[0], type, fn, phase)
	        }
	    },
	    unbind: function (type, fn, phase) {
	        if (this[0]) {
	            avalon.unbind(this[0], type, fn, phase)
	        }
	        return this
	    },
	    val: function (value) {
	        var node = this[0]
	        if (node && node.nodeType === 1) {
	            var get = arguments.length === 0
	            var access = get ? ":get" : ":set"
	            var fn = valHooks[getValType(node) + access]
	            if (fn) {
	                var val = fn(node, value)
	            } else if (get) {
	                return (node.value || "").replace(/\r/g, "")
	            } else {
	                node.value = value
	            }
	        }
	        return get ? val : this
	    }
	})

	function parseData(data) {
	    try {
	        if (typeof data === "object")
	            return data
	        data = data === "true" ? true :
	                data === "false" ? false :
	                data === "null" ? null : +data + "" === data ? +data : rbrace.test(data) ? avalon.parseJSON(data) : data
	    } catch (e) {
	    }
	    return data
	}

	var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/,
	        rvalidchars = /^[\],:{}\s]*$/,
	        rvalidbraces = /(?:^|:|,)(?:\s*\[)+/g,
	        rvalidescape = /\\(?:["\\\/bfnrt]|u[\da-fA-F]{4})/g,
	        rvalidtokens = /"[^"\\\r\n]*"|true|false|null|-?(?:\d+\.|)\d+(?:[eE][+-]?\d+|)/g
	avalon.parseJSON = window.JSON ? JSON.parse : function (data) {
	    if (typeof data === "string") {
	        data = data.trim();
	        if (data) {
	            if (rvalidchars.test(data.replace(rvalidescape, "@")
	                    .replace(rvalidtokens, "]")
	                    .replace(rvalidbraces, ""))) {
	                return (new Function("return " + data))() // jshint ignore:line
	            }
	        }
	        avalon.error("Invalid JSON: " + data)
	    }
	    return data
	}

	/*******************************
	 **************css**************
	 ********************************/


	/*******************************
	 **************attr**************
	 ********************************/



	/*******************************
	 **************html**************
	 ********************************/

	// We have to close these tags to support XHTML
	var tagHooks = {
	    area: [1, "<map>", "</map>"],
	    param: [1, "<object>", "</object>"],
	    col: [2, "<table><colgroup>", "</colgroup></table>"],
	    legend: [1, "<fieldset>", "</fieldset>"],
	    option: [1, "<select multiple='multiple'>", "</select>"],
	    thead: [1, "<table>", "</table>"],
	    tr: [2, "<table>", "</table>"],
	    td: [3, "<table><tr>", "</tr></table>"],
	    g: [1, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">', '</svg>'],
	    //IE6-8在用innerHTML生成节点时，不能直接创建no-scope元素与HTML5的新标签
	    _default: W3C ? [0, "", ""] : [1, "X<div>", "</div>"] //div可以不用闭合
	}
	tagHooks.th = tagHooks.td
	tagHooks.optgroup = tagHooks.option
	tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
	String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function (tag) {
	    tagHooks[tag] = tagHooks.g //处理SVG
	})

	var rtagName = /<([\w:]+)/ //取得其tagName
	var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
	var rcreate = W3C ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig
	var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
	var rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/ //需要处理套嵌关系的标签
	var script = document.createElement("script")
	var rhtml = /<|&#?\w+;/

	avalon.parseHTML = function (html) {
	    var fragment = builtin.avalonFragment.cloneNode(false)
	    if (typeof html !== "string") {
	        return fragment
	    }
	    if (!rhtml.test(html)) {
	        fragment.appendChild(document.createTextNode(html))
	        return fragment
	    }
	    html = html.replace(rxhtml, "<$1></$2>").trim()
	    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
	            //取得其标签名
	            wrap = tagHooks[tag] || tagHooks._default,
	            wrapper = builtin.div,
	            firstChild, neo
	    if (!W3C) { //fix IE
	        html = html.replace(rcreate, "<br class=msNoScope>$1") //在link style script等标签之前添加一个补丁
	    }
	    wrapper.innerHTML = wrap[1] + html + wrap[2]
	    var els = wrapper.getElementsByTagName("script")
	    if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
	        for (var i = 0, el; el = els[i++]; ) {
	            if (scriptTypes[el.type]) {
	                //以偷龙转凤方式恢复执行脚本功能
	                neo = script.cloneNode(false) //FF不能省略参数
	                ap.forEach.call(el.attributes, function (attr) {
	                    if (attr && attr.specified) {
	                        neo[attr.name] = attr.value //复制其属性
	                        neo.setAttribute(attr.name, attr.value)
	                    }
	                }) // jshint ignore:line
	                neo.text = el.text
	                el.parentNode.replaceChild(neo, el) //替换节点
	            }
	        }
	    }
	    if (!W3C) { //fix IE
	        var target = wrap[1] === "X<div>" ? wrapper.lastChild.firstChild : wrapper.lastChild
	        if (target && target.tagName === "TABLE" && tag !== "tbody") {
	            //IE6-7处理 <thead> --> <thead>,<tbody>
	            //<tfoot> --> <tfoot>,<tbody>
	            //<table> --> <table><tbody></table>
	            for (els = target.childNodes, i = 0; el = els[i++]; ) {
	                if (el.tagName === "TBODY" && !el.innerHTML) {
	                    target.removeChild(el)
	                    break
	                }
	            }
	        }
	        els = wrapper.getElementsByTagName("br")
	        var n = els.length
	        while (el = els[--n]) {
	            if (el.className === "msNoScope") {
	                el.parentNode.removeChild(el)
	            }
	        }
	        for (els = wrapper.all, i = 0; el = els[i++]; ) { //fix VML
	            if (isVML(el)) {
	                fixVML(el)
	            }
	        }
	    }
	    //移除我们为了符合套嵌关系而添加的标签
	    for (i = wrap[0]; i--; wrapper = wrapper.lastChild) {
	    }
	    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
	        fragment.appendChild(firstChild)
	    }
	    return fragment
	}

	function isVML(src) {
	    var nodeName = src.nodeName
	    return nodeName.toLowerCase() === nodeName && src.scopeName && src.outerText === ""
	}

	function fixVML(node) {
	    if (node.currentStyle.behavior !== "url(#default#VML)") {
	        node.style.behavior = "url(#default#VML)"
	        node.style.display = "inline-block"
	        node.style.zoom = 1 //hasLayout
	    }
	}

	avalon.innerHTML = function (node, html) {
	    if (!W3C && (!rcreate.test(html) && !rnest.test(html))) {
	        try {
	            node.innerHTML = html
	            return
	        } catch (e) {
	        }
	    }
	    var a = this.parseHTML(html)
	    this.clearHTML(node).appendChild(a)
	}

	avalon.clearHTML = function (node) {
	    node.textContent = ""
	    while (node.lastChild) {
	        node.removeChild(node.lastChild)
	    }
	    return node
	}

	/*******************************
	 **************val**************
	 ********************************/

	function getValType(elem) {
	    var ret = elem.tagName.toLowerCase()
	    return ret === "input" && /checkbox|radio/.test(elem.type) ? "checked" : ret
	}
	var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
	var valHooks = {
	    "option:get": builtin.msie ? function (node) {
	        //在IE11及W3C，如果没有指定value，那么node.value默认为node.text（存在trim作），但IE9-10则是取innerHTML(没trim操作)
	        //specified并不可靠，因此通过分析outerHTML判定用户有没有显示定义value
	        return roption.test(node.outerHTML) ? node.value : node.text.trim()
	    } : function (node) {
	        return node.value
	    },
	    "select:get": function (node, value) {
	        var option, options = node.options,
	                index = node.selectedIndex,
	                getter = valHooks["option:get"],
	                one = node.type === "select-one" || index < 0,
	                values = one ? null : [],
	                max = one ? index + 1 : options.length,
	                i = index < 0 ? max : one ? index : 0
	        for (; i < max; i++) {
	            option = options[i]
	            //IE6-9在reset后不会改变selected，需要改用i === index判定
	            //我们过滤所有disabled的option元素，但在safari5下，
	            //如果设置optgroup为disable，那么其所有孩子都disable
	            //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
	            if ((option.selected || i === index) && !option.disabled &&
	                    (!option.parentNode.disabled || option.parentNode.tagName !== "OPTGROUP")
	                    ) {
	                value = getter(option)
	                if (one) {
	                    return value
	                }
	                //收集所有selected值组成数组返回
	                values.push(value)
	            }
	        }
	        return values
	    },
	    "select:set": function (node, values, optionSet) {
	        values = [].concat(values) //强制转换为数组
	        var getter = valHooks["option:get"]
	        for (var i = 0, el; el = node.options[i++]; ) {
	            if ((el.selected = values.indexOf(getter(el)) > -1)) {
	                optionSet = true
	            }
	        }
	        if (!optionSet) {
	            node.selectedIndex = -1
	        }
	    }
	}
	/*******************************
	 **************event**************
	 ********************************/
	__webpack_require__(10)


	module.exports = {
	    
	}

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var propMap = __webpack_require__(7)

	var window = builtin.window
	var document = builtin.document

	var rsvg = builtin.rsvg
	var ramp = builtin.ramp

	function attrUpdate(node, vnode) {
	    var attrs = vnode.changeAttr
	    if (!node || node.nodeType !== 1 || vnode.disposed) {
	        return
	    }
	    if (attrs) {
	        for (var attrName in attrs) {
	            var val = attrs[attrName]
	            // switch
	            if (attrName === "href" || attrName === "src") {
	                if (!node.hasAttribute) {
	                    val = String(val).replace(ramp, "&") //处理IE67自动转义的问题
	                }
	                node[attrName] = val
	                if (window.chrome && node.tagName === "EMBED") {
	                    var parent = node.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
	                    var comment = document.createComment("ms-src")
	                    parent.replaceChild(comment, node)
	                    parent.replaceChild(node, comment)
	                }
	            } else if (attrName.indexOf("data-") === 0) {
	                node.setAttribute(attrName, val)

	            } else {
	                var propName = propMap[attrName] || attrName
	                if (typeof node[propName] === "boolean") {
	                    node[propName] = !!val
	                  
	                    //布尔属性必须使用el.xxx = true|false方式设值
	                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
	                    //会影响到样式,需要进一步处理
	                }

	                if (val === false ) {
	                    node.removeAttribute(propName)
	                    continue
	                }
	                //SVG只能使用setAttribute(xxx, yyy), VML只能使用node.xxx = yyy ,
	                //HTML的固有属性必须node.xxx = yyy
	                var isInnate = rsvg.test(node) ? false :
	                        (document.namespaces && isVML(node)) ? true :
	                        attrName in node.cloneNode(false)
	                if (isInnate) {
	                    node[propName] = val + ""
	                } else {
	                    node.setAttribute(attrName, val)
	                }

	            }

	        }
	        delete vnode.changeAttr
	    }
	}

	module.exports = attrUpdate

/***/ },
/* 7 */
/***/ function(module, exports) {

	var bools = ["autofocus,autoplay,async,allowTransparency,checked,controls",
	    "declare,disabled,defer,defaultChecked,defaultSelected,",
	    "isMap,loop,multiple,noHref,noResize,noShade",
	    "open,readOnly,selected"
	].join(",")

	var propMap = {//不规则的属性名映射
	    "accept-charset": "acceptCharset",
	    "char": "ch",
	    "charoff": "chOff",
	    "class": "className",
	    "for": "htmlFor",
	    "http-equiv": "httpEquiv"
	}
	/*
	contenteditable不是布尔属性
	http://www.zhangxinxu.com/wordpress/2016/01/contenteditable-plaintext-only/
	contenteditable=""
	contenteditable="events"
	contenteditable="caret"
	contenteditable="plaintext-only"
	contenteditable="true"
	contenteditable="false"
	 */
	bools.replace(/\w+/g, function (name) {
	    propMap[name.toLowerCase()] = name
	})


	var anomaly = ["accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan",
	    "dateTime,defaultValue,contentEditable,frameBorder,longDesc,maxLength,marginWidth,marginHeight",
	    "rowSpan,tabIndex,useMap,vSpace,valueType,vAlign"
	].join(",")
	anomaly.replace(/\w+/g, function (name) {
	    propMap[name.toLowerCase()] = name
	})

	module.exports = propMap


/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)

	var document = builtin.document
	var window = builtin.window
	var camelize = builtin.camelize

	var root = builtin.root

	var cssHooks = avalon.cssHooks
	var prefixes = ["", "-webkit-", "-o-", "-moz-", "-ms-"]
	var cssMap = {
	    "float": window.Range ? "cssFloat" : "styleFloat"
	}
	avalon.cssNumber = avalon.oneObject("animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

	avalon.cssName = function (name, host, camelCase) {
	    if (cssMap[name]) {
	        return cssMap[name]
	    }
	    host = host || root.style
	    for (var i = 0, n = prefixes.length; i < n; i++) {
	        camelCase = camelize(prefixes[i] + name)
	        if (camelCase in host) {
	            return (cssMap[name] = camelCase)
	        }
	    }
	    return null
	}

	cssHooks["@:set"] = function (node, name, value) {
	    try {
	        //node.style.width = NaN;node.style.width = "xxxxxxx";
	        //node.style.width = undefine 在旧式IE下会抛异常
	        node.style[name] = value
	    } catch (e) {
	    }
	}

	if (window.getComputedStyle) {
	    cssHooks["@:get"] = function (node, name) {
	        if (!node || !node.style) {
	            throw new Error("getComputedStyle要求传入一个节点 " + node)
	        }
	        var ret, styles = getComputedStyle(node, null)
	        if (styles) {
	            ret = name === "filter" ? styles.getPropertyValue(name) : styles[name]
	            if (ret === "") {
	                ret = node.style[name] //其他浏览器需要我们手动取内联样式
	            }
	        }
	        return ret
	    }
	    cssHooks["opacity:get"] = function (node) {
	        var ret = cssHooks["@:get"](node, "opacity")
	        return ret === "" ? "1" : ret
	    }
	} else {
	    var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
	    var rposition = /^(top|right|bottom|left)$/
	    var ralpha = /alpha\([^)]*\)/i
	    var ie8 = !!window.XDomainRequest
	    var salpha = "DXImageTransform.Microsoft.Alpha"
	    var border = {
	        thin: ie8 ? '1px' : '2px',
	        medium: ie8 ? '3px' : '4px',
	        thick: ie8 ? '5px' : '6px'
	    }
	    cssHooks["@:get"] = function (node, name) {
	        //取得精确值，不过它有可能是带em,pc,mm,pt,%等单位
	        var currentStyle = node.currentStyle
	        var ret = currentStyle[name]
	        if ((rnumnonpx.test(ret) && !rposition.test(ret))) {
	            //①，保存原有的style.left, runtimeStyle.left,
	            var style = node.style,
	                    left = style.left,
	                    rsLeft = node.runtimeStyle.left
	            //②由于③处的style.left = xxx会影响到currentStyle.left，
	            //因此把它currentStyle.left放到runtimeStyle.left，
	            //runtimeStyle.left拥有最高优先级，不会style.left影响
	            node.runtimeStyle.left = currentStyle.left
	            //③将精确值赋给到style.left，然后通过IE的另一个私有属性 style.pixelLeft
	            //得到单位为px的结果；fontSize的分支见http://bugs.jquery.com/ticket/760
	            style.left = name === 'fontSize' ? '1em' : (ret || 0)
	            ret = style.pixelLeft + "px"
	            //④还原 style.left，runtimeStyle.left
	            style.left = left
	            node.runtimeStyle.left = rsLeft
	        }
	        if (ret === "medium") {
	            name = name.replace("Width", "Style")
	            //border width 默认值为medium，即使其为0"
	            if (currentStyle[name] === "none") {
	                ret = "0px"
	            }
	        }
	        return ret === "" ? "auto" : border[ret] || ret
	    }
	    cssHooks["opacity:set"] = function (node, name, value) {
	        var style = node.style
	        var opacity = isFinite(value) && value <= 1 ? "alpha(opacity=" + value * 100 + ")" : ""
	        var filter = style.filter || "";
	        style.zoom = 1
	        //不能使用以下方式设置透明度
	        //node.filters.alpha.opacity = value * 100
	        style.filter = (ralpha.test(filter) ?
	                filter.replace(ralpha, opacity) :
	                filter + " " + opacity).trim()
	        if (!style.filter) {
	            style.removeAttribute("filter")
	        }
	    }
	    cssHooks["opacity:get"] = function (node) {
	        //这是最快的获取IE透明值的方式，不需要动用正则了！
	        var alpha = node.filters.alpha || node.filters[salpha],
	                op = alpha && alpha.enabled ? alpha.opacity : 100
	        return (op / 100) + "" //确保返回的是字符串
	    }
	}

	"top,left".replace(/\w+/g, function (name) {
	    cssHooks[name + ":get"] = function (node) {
	        var computed = cssHooks["@:get"](node, name)
	        return /px$/.test(computed) ? computed :
	                avalon(node).position()[name] + "px"
	    }
	})

	var cssShow = {
	    position: "absolute",
	    visibility: "hidden",
	    display: "block"
	}

	var rdisplayswap = /^(none|table(?!-c[ea]).+)/

	function showHidden(node, array) {
	    //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
	    if (node.offsetWidth <= 0) { //opera.offsetWidth可能小于0
	        if (rdisplayswap.test(cssHooks["@:get"](node, "display"))) {
	            var obj = {
	                node: node
	            }
	            for (var name in cssShow) {
	                obj[name] = node.style[name]
	                node.style[name] = cssShow[name]
	            }
	            array.push(obj)
	        }
	        var parent = node.parentNode
	        if (parent && parent.nodeType === 1) {
	            showHidden(parent, array)
	        }
	    }
	}
	avalon.each({
	    Width: "width",
	    Height: "height"
	}, function (name, method) {
	    var clientProp = "client" + name,
	            scrollProp = "scroll" + name,
	            offsetProp = "offset" + name
	    cssHooks[method + ":get"] = function (node, which, override) {
	        var boxSizing = -4
	        if (typeof override === "number") {
	            boxSizing = override
	        }
	        which = name === "Width" ? ["Left", "Right"] : ["Top", "Bottom"]
	        var ret = node[offsetProp] // border-box 0
	        if (boxSizing === 2) { // margin-box 2
	            return ret + avalon.css(node, "margin" + which[0], true) + avalon.css(node, "margin" + which[1], true)
	        }
	        if (boxSizing < 0) { // padding-box  -2
	            ret = ret - avalon.css(node, "border" + which[0] + "Width", true) - avalon.css(node, "border" + which[1] + "Width", true)
	        }
	        if (boxSizing === -4) { // content-box -4
	            ret = ret - avalon.css(node, "padding" + which[0], true) - avalon.css(node, "padding" + which[1], true)
	        }
	        return ret
	    }
	    cssHooks[method + "&get"] = function (node) {
	        var hidden = [];
	        showHidden(node, hidden);
	        var val = cssHooks[method + ":get"](node)
	        for (var i = 0, obj; obj = hidden[i++]; ) {
	            node = obj.node
	            for (var n in obj) {
	                if (typeof obj[n] === "string") {
	                    node.style[n] = obj[n]
	                }
	            }
	        }
	        return val
	    }
	    avalon.fn[method] = function (value) { //会忽视其display
	        var node = this[0]
	        if (arguments.length === 0) {
	            if (node.setTimeout) { //取得窗口尺寸
	                return node["inner" + name] ||
	                        node.document.documentElement[clientProp] ||
	                        node.document.body[clientProp] //IE6下前两个分别为undefined,0
	            }
	            if (node.nodeType === 9) { //取得页面尺寸
	                var doc = node.documentElement
	                //FF chrome    html.scrollHeight< body.scrollHeight
	                //IE 标准模式 : html.scrollHeight> body.scrollHeight
	                //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
	                return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
	            }
	            return cssHooks[method + "&get"](node)
	        } else {
	            return this.css(method, value)
	        }
	    }
	    avalon.fn["inner" + name] = function () {
	        return cssHooks[method + ":get"](this[0], void 0, -2)
	    }
	    avalon.fn["outer" + name] = function (includeMargin) {
	        return cssHooks[method + ":get"](this[0], void 0, includeMargin === true ? 2 : 0)
	    }
	})

	avalon.fn.offset = function () { //取得距离页面左右角的坐标
	    var node = this[0],
	            box = {
	                left: 0,
	                top: 0
	            }
	    if (!node || !node.tagName || !node.ownerDocument) {
	        return box
	    }
	    var doc = node.ownerDocument,
	            body = doc.body,
	            root = doc.documentElement,
	            win = doc.defaultView || doc.parentWindow
	    if (!avalon.contains(root, node)) {
	        return box
	    }
	    //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
	    //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
	    //http://msdn.microsoft.com/en-us/library/ms536433.aspx
	    if (node.getBoundingClientRect) {
	        box = node.getBoundingClientRect() // BlackBerry 5, iOS 3 (original iPhone)
	    }
	    //chrome/IE6: body.scrollTop, firefox/other: root.scrollTop
	    var clientTop = root.clientTop || body.clientTop,
	            clientLeft = root.clientLeft || body.clientLeft,
	            scrollTop = Math.max(win.pageYOffset || 0, root.scrollTop, body.scrollTop),
	            scrollLeft = Math.max(win.pageXOffset || 0, root.scrollLeft, body.scrollLeft)
	    // 把滚动距离加到left,top中去。
	    // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
	    // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
	    return {
	        top: box.top + scrollTop - clientTop,
	        left: box.left + scrollLeft - clientLeft
	    }
	}

	//生成avalon.fn.scrollLeft, avalon.fn.scrollTop方法
	avalon.each({
	    scrollLeft: "pageXOffset",
	    scrollTop: "pageYOffset"
	}, function (method, prop) {
	    avalon.fn[method] = function (val) {
	        var node = this[0] || {},
	                win = getWindow(node),
	                top = method === "scrollTop"
	        if (!arguments.length) {
	            return win ? (prop in win) ? win[prop] : root[method] : node[method]
	        } else {
	            if (win) {
	                win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
	            } else {
	                node[method] = val
	            }
	        }
	    }
	})

	function getWindow(node) {
	    return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
	}

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

	/*********************************************************************
	 *                           DOMReady                               *
	 **********************************************************************/
	var builtin = __webpack_require__(2)
	var document = builtin.document
	var window = builtin.window
	var root = builtin.root
	var W3C = builtin.W3C

	var readyList = [], isReady
	var fireReady = function(fn) {
	    isReady = true
	   
	    while(fn = readyList.shift()){
	        fn(avalon)
	    }
	}

	function doScrollCheck() {
	    try { //IE下通过doScrollCheck检测DOM树是否建完
	        root.doScroll("left")
	        fireReady()
	    } catch (e) {
	        setTimeout(doScrollCheck)
	    }
	}

	if (document.readyState === "complete") {
	    setTimeout(fireReady) //如果在domReady之外加载
	} else if (W3C) {
	    document.addEventListener("DOMContentLoaded", fireReady)
	} else {
	    document.attachEvent("onreadystatechange", function() {
	        if (document.readyState === "complete") {
	            fireReady()
	        }
	    })
	    try {
	        var isTop = window.frameElement === null
	    } catch (e) {
	    }
	    if (root.doScroll && isTop && window.external) {//fix IE iframe BUG
	        doScrollCheck()
	    }
	}
	avalon.bind(window, "load", fireReady)

	avalon.ready = function(fn) {
	    if (!isReady) {
	        readyList.push(fn)
	    } else {
	        fn(avalon)
	    }
	}



/***/ },
/* 10 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var document = builtin.document
	var window = builtin.window
	var root = builtin.root

	var getUid = builtin.getUid
	var W3C = builtin.W3C
	////http://www.feiesoft.com/html/events.html
	//http://segmentfault.com/q/1010000000687977/a-1020000000688757
	var canBubbleUp = {
	    click: true,
	    dblclick: true,
	    keydown: true,
	    keypress: true,
	    keyup: true,
	    mousedown: true,
	    mousemove: true,
	    mouseup: true,
	    mouseover: true,
	    mouseout: true,
	    wheel: true,
	    mousewheel: true,
	    input: true,
	    change: true,
	    beforeinput: true,
	    compositionstart: true,
	    compositionupdate: true,
	    compositionend: true,
	    select: true,
	    cut: true,
	    paste: true,
	    focusin: true,
	    focusout: true,
	    DOMFocusIn: true,
	    DOMFocusOut: true,
	    DOMActivate: true,
	    dragend: true,
	    datasetchanged: true
	}
	if (!W3C) {
	    delete canBubbleUp.change
	    delete canBubbleUp.select
	}

	avalon.eventHandlers = {}
	avalon.__eventVM__ = {}
	var eventHooks = avalon.eventHooks
	/*绑定事件*/
	avalon.bind = function (elem, type, fn) {
	    if (elem.nodeType === 1) {
	        var value = elem.getAttribute("avalon-events") || ""
	        //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324,
	        //如果是使用bind方法绑定的回调,其uuid格式为_12
	        var uuid = getUid(fn)
	        var key = type + ":" + uuid
	        var hook = eventHooks[type]
	        if (hook) {
	            type = hook.type
	            if (hook.fix) {
	                fn = hook.fix(elem, fn)
	                fn.uuid = uuid + "0"
	            }
	            key = type + ":" + fn.uuid
	        }
	        avalon.eventHandlers[fn.uuid] = fn
	        if (value.indexOf(type + ":") === -1) {//同一种事件只绑定一次
	            if (canBubbleUp[type]) {
	                delegateEvent(type)
	            } else {
	                nativeBind(elem, type, dispatch)
	            }
	        }
	        var keys = value.split("??")
	        if (keys[0] === "") {
	            keys.shift()
	        }
	        if (keys.indexOf(key) === -1) {
	            keys.push(key)
	            keys.sort()
	            elem.setAttribute("avalon-events", keys.join("??"))
	            //将令牌放进avalon-events属性中
	        }

	    } else {
	        nativeBind(elem, type, fn)
	    }
	    return fn //兼容之前的版本
	}

	avalon.unbind = function (elem, type, fn) {
	    if (elem.nodeType === 1) {
	        var value = elem.getAttribute("avalon-events") || ""
	        switch (arguments.length) {
	            case 1:
	                nativeUnBind(elem, type, dispatch)
	                elem.removeAttribute("avalon-events")
	                break
	            case 2:
	                value = value.split("??").filter(function (str) {
	                    return str.indexOf(type + ":") === -1
	                }).join("??")

	                elem.setAttribute("avalon-events", value)
	                break
	            case 3:
	                var search = type + ":" + fn.uuid
	                value = value.split("??").filter(function (str) {
	                    return str !== search
	                }).join("??")
	                elem.setAttribute("avalon-events", value)
	                if (search.length > 10) {
	                    delete avalon.__eventVM__[search]
	                } else {
	                    delete avalon.eventHandlers[fn.uuid]
	                }
	                break
	        }
	    } else {
	        nativeUnBind(elem, type, fn)
	    }
	}

	var reventNames = /[^\s\?]+/g
	var last = +new Date()
	function collectHandlers(elem, type, handlers) {
	    var value = elem.getAttribute("avalon-events")
	    if (value && (elem.disabled !== true || type !== "click")) {
	        var uuids = [], isBreak
	        var arr = value.match(reventNames) || []
	        for (var i = 0, el; el = arr[i++]; ) {
	            var v = el.split(":")
	            if (v[0] === type) {
	                uuids.push(v[1])
	                isBreak = true
	            } else if (isBreak) {
	                break
	            }
	        }
	        if (uuids.length) {
	            handlers.push({
	                elem: elem,
	                uuids: uuids
	            })
	        }
	    }
	    elem = elem.parentNode
	    if (elem && elem.getAttribute && canBubbleUp[type]) {
	        collectHandlers(elem, type, handlers)
	    }

	}
	function dispatch(event) {
	    event = new avEvent(event)
	    var type = event.type
	    var elem = event.target
	    
	    var handlers = []

	    collectHandlers(elem, type, handlers)
	    var i = 0, j, uuid, handler
	    while ((handler = handlers[i++]) && !event.cancelBubble) {
	        event.currentTarget = handler.elem
	        j = 0
	        while ((uuid = handler.uuids[ j++ ]) &&
	                !event.isImmediatePropagationStopped) {
	            var fn = avalon.eventHandlers[uuid]
	            if (fn) {
	                var vm = avalon.__eventVM__[type + ":" + uuid ]
	                if (vm && vm.$hashcode === false) {
	                    return avalon.unbind(elem, type, fn)
	                }
	                if (/move|scroll/.test(type)) {
	                    var curr = +new Date()
	                    if (curr - last > 16) {
	                        fn.call(vm || elem, event)
	                        last = curr
	                    }
	                } else {
	                    fn.call(vm || elem, event)
	                }
	            }
	        }
	    }
	}


	var nativeBind = W3C ? function (el, type, fn) {
	    el.addEventListener(type, fn)
	} : function (el, type, fn) {
	    el.attachEvent("on" + type, fn)
	}
	var nativeUnBind = W3C ? function (el, type, fn) {
	    el.removeEventListener(type, fn)
	} : function (el, type, fn) {
	    el.detachEvent("on" + type, fn)
	}

	function delegateEvent(type) {
	    var value = root.getAttribute("delegate-events") || ""
	    if (value.indexOf(type) === -1) {
	        var arr = value.match(reventNames) || []
	        arr.push(type)
	        root.setAttribute("delegate-events", arr.join("??"))
	        nativeBind(root, type, dispatch)
	    }
	}

	avalon.fireDom = function (elem, type, opts) {
	    if (document.createEvent) {
	        var hackEvent = document.createEvent("Events");
	        hackEvent.initEvent(type, true, true, opts)
	        avalon.mix(hackEvent, opts)

	        elem.dispatchEvent(hackEvent)
	    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报"SCRIPT16389: 未指明的错误"
	        hackEvent = document.createEventObject()
	        avalon.mix(hackEvent, opts)
	        elem.fireEvent("on" + type, hackEvent)
	    }
	}

	var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
	var rsponsor = /^(ms|webkit|moz)/
	function avEvent(event) {
	    if (event.originalEvent) {
	        return this
	    }
	    for (var i in event) {
	        if (!rsponsor.test(i) && typeof event[i] !== "function") {
	            this[i] = event[i]
	        }
	    }
	    if(!this.target){
	        this.target = event.srcElement
	    }
	    var target = this.target
	    if (event.type.indexOf("key") === 0) {
	        this.which = event.charCode != null ? event.charCode : event.keyCode
	    } else if (rmouseEvent.test(event.type) && !("pageX" in this)) {
	        var doc = target.ownerDocument || document
	        var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
	        this.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
	        this.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
	        this.wheelDeltaY = this.wheelDelta
	        this.wheelDeltaX = 0
	    }
	    this.timeStamp = new Date() - 0
	    this.originalEvent = event
	}
	avEvent.prototype = {
	    preventDefault: function () {
	        var e = this.originalEvent;
	        this.returnValue = false
	        if (e) {
	            e.returnValue = false
	            if (e.preventDefault) {
	                e.preventDefault()
	            }
	        }
	    },
	    stopPropagation: function () {
	        var e = this.originalEvent
	        this.cancelBubble = true
	        if (e) {
	            e.cancelBubble = true
	            if (e.stopPropagation) {
	                e.stopPropagation()
	            }
	        }
	    },
	    stopImmediatePropagation: function () {
	        var e = this.originalEvent
	        this.isImmediatePropagationStopped = true
	        if (e.stopImmediatePropagation) {
	            e.stopImmediatePropagation()
	        }
	        this.stopPropagation()
	    }
	}

	//针对firefox, chrome修正mouseenter, mouseleave
	if (!("onmouseenter" in root)) {
	    avalon.each({
	        mouseenter: "mouseover",
	        mouseleave: "mouseout"
	    }, function (origType, fixType) {
	        eventHooks[origType] = {
	            type: fixType,
	            fix: function (elem, fn) {
	                return function (e) {
	                    var t = e.relatedTarget
	                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
	                        delete e.type
	                        e.type = origType
	                        return fn.apply(elem, arguments)
	                    }
	                }
	            }
	        }
	    })
	}
	//针对IE9+, w3c修正animationend
	avalon.each({
	    AnimationEvent: "animationend",
	    WebKitAnimationEvent: "webkitAnimationEnd"
	}, function (construct, fixType) {
	    if (window[construct] && !eventHooks.animationend) {
	        eventHooks.animationend = {
	            type: fixType
	        }
	    }
	})
	//针对IE6-8修正input
	if (!("oninput" in document.createElement("input"))) {
	    eventHooks.input = {
	        type: "propertychange",
	        fix: function (elem, fn) {
	            return function (e) {
	                if (e.propertyName === "value") {
	                    e.type = "input"
	                    return fn.apply(elem, arguments)
	                }
	            }
	        }
	    }
	}
	if (document.onmousewheel === void 0) {
	    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
	     firefox DOMMouseScroll detail 下3 上-3
	     firefox wheel detlaY 下3 上-3
	     IE9-11 wheel deltaY 下40 上-40
	     chrome wheel deltaY 下100 上-100 */
	    var fixWheelType = document.onwheel !== void 0 ? "wheel" : "DOMMouseScroll"
	    var fixWheelDelta = fixWheelType === "wheel" ? "deltaY" : "detail"
	    eventHooks.mousewheel = {
	        type: fixWheelType,
	        fix: function (elem, fn) {
	            return function (e) {
	                e.wheelDeltaY = e.wheelDelta = e[fixWheelDelta] > 0 ? -120 : 120
	                e.wheelDeltaX = 0
	                if (Object.defineProperty) {
	                    Object.defineProperty(e, "type", {
	                        value: "mousewheel"
	                    })
	                }
	                return fn.apply(elem, arguments)
	            }
	        }
	    }
	}


/***/ },
/* 11 */
/***/ function(module, exports, __webpack_require__) {

	var camelize = __webpack_require__(2).camelize

	var number = __webpack_require__(12)
	var escape = __webpack_require__(13)
	var sanitize = __webpack_require__(14)
	var date = __webpack_require__(15)
	var arrayFilters = __webpack_require__(16)
	var eventFilters = __webpack_require__(18)

	var filters = avalon.filters

	avalon.mix(filters, {
	    uppercase: function (str) {
	        return str.toUpperCase()
	    },
	    lowercase: function (str) {
	        return str.toLowerCase()
	    },
	    truncate: function (str, length, truncation) {
	        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
	        length = length || 30
	        truncation = typeof truncation === "string" ? truncation : "..."
	        return str.length > length ?
	                str.slice(0, length - truncation.length) + truncation :
	                String(str)
	    },
	    camelize: camelize,
	    number: number,
	    date: date,
	    escape: escape,
	    sanitize: sanitize,
	    currency: function (amount, symbol, fractionSize) {
	        return (symbol || "\uFFE5") +
	                number(amount,
	                        isFinite(fractionSize) ? fractionSize : 2)
	    }
	}, arrayFilters, eventFilters)



	function fixNull(val) {
	    return val == null ? "" : val
	}
	avalon.mix(avalon.filters, {
	    checked: {
	        get: function (val, elem) {
	            return !elem.oldValue
	        }
	    },
	    string: {//转换为字符串或,字符串数组
	        get: function (val) { //同步到VM
	            return val == null ? "" : val + ""
	        },
	        set: fixNull
	    },
	    boolean: {
	        get: function (val) {
	            return val === "true"
	        },
	        set: fixNull
	    },
	    number: {
	        get: function (val) {
	            if (arguments.length === 2) {
	                var last = arguments[1]
	                if (last && last.nodeType === 1) {
	                    var a = parseFloat(val)
	                    return  a === "" ? "" : a !== a ? 0 : a
	                }
	            }
	            return number.apply(0, arguments)
	        },
	        set: fixNull
	    }
	})



/***/ },
/* 12 */
/***/ function(module, exports) {

	function numberFormat(number, decimals, point, thousands) {
	    //form http://phpjs.org/functions/number_format/
	    //number 必需，要格式化的数字
	    //decimals 可选，规定多少个小数位。
	    //point 可选，规定用作小数点的字符串（默认为 . ）。
	    //thousands 可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
	    number = (number + '')
	            .replace(/[^0-9+\-Ee.]/g, '')
	    var n = !isFinite(+number) ? 0 : +number,
	            prec = !isFinite(+decimals) ? 3 : Math.abs(decimals),
	            sep = thousands || ",",
	            dec = point || ".",
	            s = '',
	            toFixedFix = function (n, prec) {
	                var k = Math.pow(10, prec)
	                return '' + (Math.round(n * k) / k)
	                        .toFixed(prec)
	            }
	    // Fix for IE parseFloat(0.55).toFixed(0) = 0;
	    s = (prec ? toFixedFix(n, prec) : '' + Math.round(n))
	            .split('.')
	    if (s[0].length > 3) {
	        s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
	    }
	    if ((s[1] || '')
	            .length < prec) {
	        s[1] = s[1] || ''
	        s[1] += new Array(prec - s[1].length + 1)
	                .join('0')
	    }
	    return s.join(dec)
	}

	module.exports = numberFormat

	//处理 货币 http://openexchangerates.github.io/accounting.js/

/***/ },
/* 13 */
/***/ function(module, exports) {

	
	var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
	var rnoalphanumeric = /([^\#-~| |!])/g

	function escape(str) {
	    //将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
	    return String(str).
	            replace(/&/g, '&amp;').
	            replace(rsurrogate, function (value) {
	                var hi = value.charCodeAt(0)
	                var low = value.charCodeAt(1)
	                return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
	            }).
	            replace(rnoalphanumeric, function (value) {
	                return '&#' + value.charCodeAt(0) + ';'
	            }).
	            replace(/</g, '&lt;').
	            replace(/>/g, '&gt;')
	}

	module.exports = escape

/***/ },
/* 14 */
/***/ function(module, exports) {

	var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
	var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
	var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/ig
	var rsanitize = {
	    a: /\b(href)\=("javascript[^"]*"|'javascript[^']*')/ig,
	    img: /\b(src)\=("javascript[^"]*"|'javascript[^']*')/ig,
	    form: /\b(action)\=("javascript[^"]*"|'javascript[^']*')/ig
	}


	//https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
	//    <a href="javasc&NewLine;ript&colon;alert('XSS')">chrome</a> 
	//    <a href="data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==">chrome</a>
	//    <a href="jav	ascript:alert('XSS');">IE67chrome</a>
	//    <a href="jav&#x09;ascript:alert('XSS');">IE67chrome</a>
	//    <a href="jav&#x0A;ascript:alert('XSS');">IE67chrome</a>
	module.exports = function sanitize(str) {
	    return str.replace(rscripts, "").replace(ropen, function (a, b) {
	        var match = a.toLowerCase().match(/<(\w+)\s/)
	        if (match) { //处理a标签的href属性，img标签的src属性，form标签的action属性
	            var reg = rsanitize[match[1]]
	            if (reg) {
	                a = a.replace(reg, function (s, name, value) {
	                    var quote = value.charAt(0)
	                    return name + "=" + quote + "javascript:void(0)" + quote// jshint ignore:line
	                })
	            }
	        }
	        return a.replace(ron, " ").replace(/\s+/g, " ") //移除onXXX事件
	    })
	}


/***/ },
/* 15 */
/***/ function(module, exports) {

	/*
	 'yyyy': 4 digit representation of year (e.g. AD 1 => 0001, AD 2010 => 2010)
	 'yy': 2 digit representation of year, padded (00-99). (e.g. AD 2001 => 01, AD 2010 => 10)
	 'y': 1 digit representation of year, e.g. (AD 1 => 1, AD 199 => 199)
	 'MMMM': Month in year (January-December)
	 'MMM': Month in year (Jan-Dec)
	 'MM': Month in year, padded (01-12)
	 'M': Month in year (1-12)
	 'dd': Day in month, padded (01-31)
	 'd': Day in month (1-31)
	 'EEEE': Day in Week,(Sunday-Saturday)
	 'EEE': Day in Week, (Sun-Sat)
	 'HH': Hour in day, padded (00-23)
	 'H': Hour in day (0-23)
	 'hh': Hour in am/pm, padded (01-12)
	 'h': Hour in am/pm, (1-12)
	 'mm': Minute in hour, padded (00-59)
	 'm': Minute in hour (0-59)
	 'ss': Second in minute, padded (00-59)
	 's': Second in minute (0-59)
	 'a': am/pm marker
	 'Z': 4 digit (+sign) representation of the timezone offset (-1200-+1200)
	 format string can also be one of the following predefined localizable formats:
	 
	 'medium': equivalent to 'MMM d, y h:mm:ss a' for en_US locale (e.g. Sep 3, 2010 12:05:08 pm)
	 'short': equivalent to 'M/d/yy h:mm a' for en_US locale (e.g. 9/3/10 12:05 pm)
	 'fullDate': equivalent to 'EEEE, MMMM d,y' for en_US locale (e.g. Friday, September 3, 2010)
	 'longDate': equivalent to 'MMMM d, y' for en_US locale (e.g. September 3, 2010
	 'mediumDate': equivalent to 'MMM d, y' for en_US locale (e.g. Sep 3, 2010)
	 'shortDate': equivalent to 'M/d/yy' for en_US locale (e.g. 9/3/10)
	 'mediumTime': equivalent to 'h:mm:ss a' for en_US locale (e.g. 12:05:08 pm)
	 'shortTime': equivalent to 'h:mm a' for en_US locale (e.g. 12:05 pm)
	 */

	function toInt(str) {
	    return parseInt(str, 10) || 0
	}

	function padNumber(num, digits, trim) {
	    var neg = ""
	    if (num < 0) {
	        neg = '-'
	        num = -num
	    }
	    num = "" + num
	    while (num.length < digits)
	        num = "0" + num
	    if (trim)
	        num = num.substr(num.length - digits)
	    return neg + num
	}

	function dateGetter(name, size, offset, trim) {
	    return function (date) {
	        var value = date["get" + name]()
	        if (offset > 0 || value > -offset)
	            value += offset
	        if (value === 0 && offset === -12) {
	            value = 12
	        }
	        return padNumber(value, size, trim)
	    }
	}

	function dateStrGetter(name, shortForm) {
	    return function (date, formats) {
	        var value = date["get" + name]()
	        var get = (shortForm ? ("SHORT" + name) : name).toUpperCase()
	        return formats[get][value]
	    }
	}

	function timeZoneGetter(date) {
	    var zone = -1 * date.getTimezoneOffset()
	    var paddedZone = (zone >= 0) ? "+" : ""
	    paddedZone += padNumber(Math[zone > 0 ? "floor" : "ceil"](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
	    return paddedZone
	}
	//取得上午下午

	function ampmGetter(date, formats) {
	    return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
	}
	var DATE_FORMATS = {
	    yyyy: dateGetter("FullYear", 4),
	    yy: dateGetter("FullYear", 2, 0, true),
	    y: dateGetter("FullYear", 1),
	    MMMM: dateStrGetter("Month"),
	    MMM: dateStrGetter("Month", true),
	    MM: dateGetter("Month", 2, 1),
	    M: dateGetter("Month", 1, 1),
	    dd: dateGetter("Date", 2),
	    d: dateGetter("Date", 1),
	    HH: dateGetter("Hours", 2),
	    H: dateGetter("Hours", 1),
	    hh: dateGetter("Hours", 2, -12),
	    h: dateGetter("Hours", 1, -12),
	    mm: dateGetter("Minutes", 2),
	    m: dateGetter("Minutes", 1),
	    ss: dateGetter("Seconds", 2),
	    s: dateGetter("Seconds", 1),
	    sss: dateGetter("Milliseconds", 3),
	    EEEE: dateStrGetter("Day"),
	    EEE: dateStrGetter("Day", true),
	    a: ampmGetter,
	    Z: timeZoneGetter
	}
	var rdateFormat = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/
	var raspnetjson = /^\/Date\((\d+)\)\/$/
	function dateFilter(date, format) {
	    var locate = dateFilter.locate,
	            text = "",
	            parts = [],
	            fn, match
	    format = format || "mediumDate"
	    format = locate[format] || format
	    if (typeof date === "string") {
	        if (/^\d+$/.test(date)) {
	            date = toInt(date)
	        } else if (raspnetjson.test(date)) {
	            date = +RegExp.$1
	        } else {
	            var trimDate = date.trim()
	            var dateArray = [0, 0, 0, 0, 0, 0, 0]
	            var oDate = new Date(0)
	            //取得年月日
	            trimDate = trimDate.replace(/^(\d+)\D(\d+)\D(\d+)/, function (_, a, b, c) {
	                var array = c.length === 4 ? [c, a, b] : [a, b, c]
	                dateArray[0] = toInt(array[0])     //年
	                dateArray[1] = toInt(array[1]) - 1 //月
	                dateArray[2] = toInt(array[2])     //日
	                return ""
	            })
	            var dateSetter = oDate.setFullYear
	            var timeSetter = oDate.setHours
	            trimDate = trimDate.replace(/[T\s](\d+):(\d+):?(\d+)?\.?(\d)?/, function (_, a, b, c, d) {
	                dateArray[3] = toInt(a) //小时
	                dateArray[4] = toInt(b) //分钟
	                dateArray[5] = toInt(c) //秒
	                if (d) {                //毫秒
	                    dateArray[6] = Math.round(parseFloat("0." + d) * 1000)
	                }
	                return ""
	            })
	            var tzHour = 0
	            var tzMin = 0
	            trimDate = trimDate.replace(/Z|([+-])(\d\d):?(\d\d)/, function (z, symbol, c, d) {
	                dateSetter = oDate.setUTCFullYear
	                timeSetter = oDate.setUTCHours
	                if (symbol) {
	                    tzHour = toInt(symbol + c)
	                    tzMin = toInt(symbol + d)
	                }
	                return ""
	            })

	            dateArray[3] -= tzHour
	            dateArray[4] -= tzMin
	            dateSetter.apply(oDate, dateArray.slice(0, 3))
	            timeSetter.apply(oDate, dateArray.slice(3))
	            date = oDate
	        }
	    }
	    if (typeof date === "number") {
	        date = new Date(date)
	    }
	    if (avalon.type(date) !== "date") {
	        return
	    }
	    while (format) {
	        match = rdateFormat.exec(format)
	        if (match) {
	            parts = parts.concat(match.slice(1))
	            format = parts.pop()
	        } else {
	            parts.push(format)
	            format = null
	        }
	    }
	    parts.forEach(function (value) {
	        fn = DATE_FORMATS[value]
	        text += fn ? fn(date, locate) : value.replace(/(^'|'$)/g, "").replace(/''/g, "'")
	    })
	    return text
	}


	var locate = {
	    AMPMS: {
	        0: "上午",
	        1: "下午"
	    },
	    DAY: {
	        0: "星期日",
	        1: "星期一",
	        2: "星期二",
	        3: "星期三",
	        4: "星期四",
	        5: "星期五",
	        6: "星期六"
	    },
	    MONTH: {
	        0: "1月",
	        1: "2月",
	        2: "3月",
	        3: "4月",
	        4: "5月",
	        5: "6月",
	        6: "7月",
	        7: "8月",
	        8: "9月",
	        9: "10月",
	        10: "11月",
	        11: "12月"
	    },
	    SHORTDAY: {
	        "0": "周日",
	        "1": "周一",
	        "2": "周二",
	        "3": "周三",
	        "4": "周四",
	        "5": "周五",
	        "6": "周六"
	    },
	    fullDate: "y年M月d日EEEE",
	    longDate: "y年M月d日",
	    medium: "yyyy-M-d H:mm:ss",
	    mediumDate: "yyyy-M-d",
	    mediumTime: "H:mm:ss",
	    "short": "yy-M-d ah:mm",
	    shortDate: "yy-M-d",
	    shortTime: "ah:mm"
	}
	locate.SHORTMONTH = locate.MONTH
	dateFilter.locate = locate

	module.exports = dateFilter

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

	var escapeRegExp = __webpack_require__(17).escapeRegExp

	function orderBy(array, criteria, reverse) {
	    var type = avalon.type(array)
	    if (type !== "array" || type !== "object")
	        throw "orderBy只能处理对象或数组"
	    var order = (reverse && reverse < 0) ? -1 : 1

	    if (typeof criteria === "string") {
	        var key = criteria
	        criteria = function (a) {
	            return a && a[key]
	        }
	    }
	    var oldData = array
	    array = convertArray(array)
	    array.forEach(function (el) {
	        el.order = criteria(el.value, el.key)
	    })
	    array.sort(function (left, right) {
	        var a = left.order
	        var b = right.order
	        return a === b ? 0 : a > b ? order : -order
	    })
	    var isArray = type === "array"
	    var target = isArray ? [] : {}
	    return makeData(target, array, oldData, function (el) {
	        if (isArray) {
	            target.push(el.value)
	        } else {
	            target[el.key] = el.value
	        }
	    })
	}
	function filterBy(array, search) {

	    var type = avalon.type(array)

	    if (type !== "array" && type !== "object")
	        throw "filterBy只能处理对象或数组"
	    var oldData = array
	    var args = avalon.slice(arguments, 2)
	    if (typeof search === "function") {
	        var criteria = search
	    } else if (typeof search === "string") {
	        args.unshift(new RegExp(escapeRegExp(search), "i"))
	        criteria = containKey
	    } else {
	        throw search + "必须是字符串或函数"
	    }

	    array = convertArray(array).filter(function (el) {
	         return !!criteria.apply(el, [el.value].concat(args))
	    })
	    var isArray = type === "array"
	    var target = isArray ? [] : {}
	    return makeData(target, array, oldData, function (el) {
	        if (isArray) {
	            target.push(el.value)
	        } else {
	            target[el.key] = el.value
	        }
	    })
	}

	function selectBy(data, array) {
	    if (avalon.isObject(data) && !Array.isArray(data)) {
	        var target = []
	        return makeData(target, array, data, function (name) {
	            target.push(data.hasOwnProperty(name) ? data[name] : "")
	        })
	    } else {
	        throw "selectBy只支持对象"
	    }
	}
	Number.isNaN = Number.isNaN || function(a){
	    return a !== a
	}

	function limitBy(input, limit, begin) {
	    if (Math.abs(Number(limit)) === Infinity) {
	        limit = Number(limit);
	    } else {
	        limit = parseInt(limit,10)
	    }
	    var data = input
	    if (Number.isNaN(limit))
	        return input

	    if (typeof input === "number")
	        input = input + ""
	    if ((!Array.isArray(input)) && (typeof input !== "string"))
	        return input

	    begin = (!begin || Number.isNaN(begin)) ? 0 : ~~begin
	  
	    
	    begin = (begin < 0) ? Math.max(0, input.length + begin) : begin
	    if (limit >= 0) {
	        input = input.slice(begin, begin + limit)
	    } else {
	        if (begin === 0) {
	            input = input.slice(limit, input.length)
	        } else {
	            input = input.slice(Math.max(0, begin + limit), begin);
	        }
	    }

	    return makeData(input, [], data)
	}

	function makeData(ret, array, data, callback) {
	    for (var i = 0, n = array.length; i < n; i++) {
	        callback(array[i])
	    }
	    if (data && data.$hashcode) {
	        ret.$id = data.$id
	        ret.$hashcode = data.$hashcode
	    }
	    return ret
	}

	function containKey(a, reg) {
	    if (avalon.isPlainObject(a)) {
	        for (var k in a) {
	            if (reg.test(a[k]))
	                return true
	        }
	    } else if (Array.isArray(a)) {
	        return a.some(function (b) {
	            return reg.test(b)
	        })
	    } else if (a !== null) {
	        return reg.test(a)
	    }
	    return false
	}

	function convertArray(array) {
	    var ret = [], i = 0
	    avalon.each(array, function (key, value) {
	        ret[i++] = {
	            value: value,
	            key: key
	        }
	    })
	    return ret
	}

	module.exports = {
	    limitBy: limitBy,
	    orderBy: orderBy,
	    selectBy: selectBy,
	    filterBy: filterBy
	}

/***/ },
/* 17 */
/***/ function(module, exports, __webpack_require__) {

	var vars = __webpack_require__(2)

	function kernel(settings) {
	    for (var p in settings) {
	        if (!vars.ohasOwn.call(settings, p))
	            continue
	        var val = settings[p]
	        if (typeof kernel.plugins[p] === "function") {
	            kernel.plugins[p](val)
	        } else if (typeof kernel[p] === "object") {
	            avalon.mix(kernel[p], val)
	        } else {
	            kernel[p] = val
	        }
	    }
	    return this
	}

	avalon.config = kernel


	var plugins = {
	    interpolate: function (array) {
	        var openTag = array[0]
	        var closeTag = array[1]
	        if (openTag === closeTag) {
	            throw new SyntaxError("openTag!==closeTag")
	            var test = openTag + "test" + closeTag
	            var div = vars.div
	            div.innerHTML = test

	            if (div.innerHTML !== test && div.innerHTML.indexOf("&lt;") > -1) {
	                throw new SyntaxError("此定界符不合法")
	            }
	            div.innerHTML = ""
	        }
	        kernel.openTag = openTag
	        kernel.closeTag = closeTag
	        var o = escapeRegExp(openTag),
	                c = escapeRegExp(closeTag)
	        kernel.rexpr = new RegExp(o + "([\\ss\\S]*)" + c)
	        kernel.rexprg = new RegExp(o + "([\\ss\\S]*)" + c, "g")
	        kernel.rbind = new RegExp(o + "[\\ss\\S]*" + c + "|\\b(?:ms|av)-")
	    }
	}
	kernel.plugins = plugins
	kernel.plugins['interpolate'](["{{", "}}"])

	kernel.debug = true
	kernel.paths = {}
	kernel.shim = {}
	kernel.maxRepeatSize = 100

	var rescape = /[-.*+?^${}()|[\]\/\\]/g

	function escapeRegExp(target) {
	    //http://stevenlevithan.com/regex/xregexp/
	    //将字符串安全格式化为正则表达式的源码
	    return (target + "").replace(rescape, "\\$&")
	}


	module.exports = {
	    escapeRegExp: escapeRegExp
	}



/***/ },
/* 18 */
/***/ function(module, exports) {

	
	var eventFilters = {
	    stop: function (e) {
	        e.stopPropagation()
	        return e
	    },
	    prevent: function (e) {
	        e.preventDefault()
	        return e
	    }
	}
	var keyCode = {
	    esc: 27,
	    tab: 9,
	    enter: 13,
	    space: 32,
	    del: 46,
	    up: 38,
	    left: 37,
	    right: 39,
	    down: 40
	}

	avalon.each(keyCode, function (name, keyCode) {
	    eventFilters[name] = function (e) {
	        if (e.which !== keyCode) {
	            e.$return = true
	        }
	        return e
	    }
	})

	module.exports = eventFilters

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

	
	var $$skipArray = __webpack_require__(20)
	var canHideProperty = __webpack_require__(21)
	var defineProperties = __webpack_require__(22)
	var vars = __webpack_require__(2)


	var ap = vars.ap
	var W3C = vars.ap
	var rword = vars.rword
	var oneObject = vars.oneObject
	var makeHashCode = vars.makeHashCode

	var innerBuiltin = __webpack_require__(23)
	var isSkip = innerBuiltin.isSkip
	var rtopsub = innerBuiltin.rtopsub
	var Observer = innerBuiltin.Observer
	var getComputed = innerBuiltin.getComputed
	var makeComputed = innerBuiltin.makeComputed

	var diff = __webpack_require__(26)
	var createRender = __webpack_require__(49)
	var batchUpdateEntity = __webpack_require__(24)

	var dispatch = __webpack_require__(48)
	var $watch = dispatch.$watch
	var $emit = dispatch.$emit

	//所有vmodel都储存在这
	avalon.vmodels = {}

	/**
	 * avalon最核心的方法的方法，返回一个vm
	 *  vm拥有如下私有属性
	 
	 $id: vm.id
	 $events: 放置$watch回调与绑定对象
	 $watch: 增强版$watch
	 $fire: 触发$watch回调
	 $hashcode:相当于uuid,但为false时会防止依赖收集,让框架来回收
	 $model:返回一个纯净的JS对象
	 $accessors: avalon.js独有的对象,放置所有访问器属性
	 
	 * 
	 * @param {Object} definition 用户定义
	 * @returns {Observer} vm
	 */
	function define(definition) {
	    var $id = definition.$id
	    if (!$id) {
	        avalon.log("warning: vm.$id must be specified")
	    }
	    var vm = observeObject(definition, {}, {
	        pathname: "",
	        idname: $id,
	        top: true
	    })

	    if (avalon.vmodels[$id]) {
	        throw Error("warning:[", $id, "] had defined!")
	    }
	    avalon.vmodels[$id] = vm
	    avalon.ready(function () {
	        var elem = document.getElementById($id)
	        vm.$element = elem
	        var now = new Date - 0
	        var vnode = avalon.createVirtual(elem.outerHTML)
	        avalon.log("create primitive vtree", new Date - now)
	        now = new Date
	        vm.$render = avalon.createRender(vnode)

	        avalon.log("create template Function ", new Date - now)
	        avalon.rerenderStart = new Date
	        elem.vnode = vnode
	        batchUpdateEntity($id)

	    })

	    return vm
	}


	/**
	 * 生成一个vm
	 *
	 * @param {Object} definition 用户的原始数据
	 * @param {Object} heirloom   用来保存顶层vm的引用
	 * @param {Object} options
	 *        top      {Boolean} 是否顶层vm
	 *        idname   {String}  $id
	 *        pathname {String}  当前路径
	 * @returns {Observer}
	 */

	function observeObject(definition, heirloom, options) {
	    options = options || {}
	    var $skipArray = {}

	    if (definition.$skipArray) {//收集所有不可监听属性
	        $skipArray = oneObject(definition.$skipArray)
	        delete definition.$skipArray
	    }

	    var keys = {}
	    var $accessors = {}
	    var $vmodel = new Observer()
	    var $pathname = options.pathname || ""
	    var $computed = getComputed(definition)
	    var $idname = options.idname || makeHashCode("$")

	    var key, sid, spath

	    for (key in definition) {
	        if ($$skipArray[key])
	            continue
	        var val = keys[key] = definition[key]
	        if (!isSkip(key, val, $skipArray)) {
	            sid = $idname + "." + key
	            spath = $pathname ? $pathname + "." + key : key
	            $accessors[key] = makeObservable(sid, spath, heirloom)
	        }
	    }

	    for (key in $computed) {
	        keys[key] = definition[key]
	        sid = $idname + "." + key
	        spath = $pathname ? $pathname + "." + key : key
	        $accessors[key] = makeComputed(sid, spath, heirloom, key, $computed[key])
	    }

	    $accessors.$model = $modelAccessor

	    $vmodel = defineProperties($vmodel, $accessors, definition)

	    for (key in keys) {
	        //对普通监控属性或访问器属性进行赋值
	        if (!(key in $computed)) {
	            $vmodel[key] = keys[key]
	        }
	        //删除系统属性
	        if (key in $skipArray) {
	            delete keys[key]
	        } else {
	            keys[key] = true
	        }
	    }

	    function hasOwnKey(key) {
	        return keys[key] === true
	    }

	    hideProperty($vmodel, "$id", $idname)
	    hideProperty($vmodel, "$accessors", $accessors)
	    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)

	    if (options.top === true) {
	        makeFire($vmodel, heirloom)
	    }

	    for (key in $computed) {
	        val = $vmodel[key]
	    }

	    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

	    return $vmodel
	}


	/**
	 * observeArray及observeObject的包装函数
	 * @param {type} definition
	 * @param {type} old
	 * @param {type} heirloom
	 * @param {type} options
	 * @returns {Observer|Any}
	 */
	function observe(definition, old, heirloom, options) {
	    //如果数组转换为监控数组
	    if (Array.isArray(definition)) {
	        return observeArray(definition, old, heirloom, options)
	    } else if (avalon.isPlainObject(definition)) {
	        //如果此属性原来就是一个VM,拆分里面的访问器属性
	        if (Object(old) === old) {
	            var vm = subModelFactory(old, definition, heirloom, options)
	            for (var i in definition) {
	                if ($$skipArray[i])
	                    continue
	                vm[i] = definition[i]
	            }
	            return vm
	        } else {
	            //否则新建一个VM
	            vm = observeObject(definition, heirloom, options)
	            return vm
	        }
	    } else {
	        return definition
	    }
	}




	/**
	 * 生成普通访问器属性
	 * 
	 * @param {type} sid
	 * @param {type} spath
	 * @param {type} heirloom
	 * @returns {PropertyDescriptor}
	 */
	function makeObservable(sid, spath, heirloom) {
	    var old = NaN
	    function get() {
	        return old
	    }
	    get.heirloom = heirloom
	    return {
	        get: get,
	        set: function (val) {
	            if (old === val) {
	                return
	            }
	            if (val && typeof val === "object") {
	                if (old && old.$id && val.$id && !Array.isArray(old)) {
	                    //合并两个对象类型的子vm,比如proxy item中的el = newEl
	                    for (var ii in val) {
	                        old[ii] = val[ii]
	                    }
	                } else {
	                    val = observe(val, old, heirloom, {
	                        pathname: spath,
	                        idname: sid
	                    })
	                }
	            }

	            var older = old
	            old = val
	            var vm = heirloom.__vmodel__
	            if (this.$hashcode && vm) {
	                //★★确保切换到新的events中(这个events可能是来自oldProxy)               
	                if (vm && heirloom !== vm.$events) {
	                    get.heirloom = vm.$events
	                }
	                $emit(get.heirloom[spath], vm, spath, val, older)
	                if (sid.indexOf(".*.") > 0) {//如果是item vm
	                    var arr = sid.match(rtopsub)
	                    var top = avalon.vmodels[ arr[1] ]
	                    if (top) {
	                        var path = arr[2]
	                        $emit(top.$events[ path ], vm, path, val, older)
	                    }
	                }
	                var vid = vm.$id.split(".")[0]
	                avalon.rerenderStart = new Date
	                batchUpdateEntity(vid, true)
	            }
	        },
	        enumerable: true,
	        configurable: true
	    }
	}
	/**
	 * 为vm添加$events, $watch, $fire方法
	 *
	 * @param {Observer} $vmodel
	 * @returns {undefined}
	 */
	function makeFire($vmodel, heirloom) {
	    heirloom.__vmodel__ = $vmodel
	    hideProperty($vmodel, "$events", heirloom)
	    hideProperty($vmodel, "$watch", function (expr, fn) {
	        if (arguments.length === 2) {
	            return $watch.apply($vmodel, arguments)
	        } else {
	            throw "$watch方法参数不对"
	        }
	    })
	    hideProperty($vmodel, "$fire", function (expr, a, b) {
	        if (expr.indexOf("all!") === 0) {
	            var p = expr.slice(4)
	            for (var i in avalon.vmodels) {
	                var v = avalon.vmodels[i]
	                v.$fire && v.$fire(p, a, b)
	            }
	        } else {
	            var list = $vmodel.$events[expr]
	            $emit(list, $vmodel, expr, a, b)
	        }
	    })
	}

	/**
	 * 生成vm的$model
	 *
	 * @param {Observer} val
	 * @returns {Object|Array}
	 */
	function toJson(val) {
	    var xtype = avalon.type(val)
	    if (xtype === "array") {
	        var array = []
	        for (var i = 0; i < val.length; i++) {
	            array[i] = toJson(val[i])
	        }
	        return array
	    } else if (xtype === "object") {
	        var obj = {}
	        for (i in val) {
	            if (i === "__proxy__" || i === "__data__" || i === "__const__")
	                continue
	            if (val.hasOwnProperty(i)) {
	                var value = val[i]
	                obj[i] = value && value.nodeType ? value : toJson(value)
	            }
	        }
	        return obj
	    }
	    return val
	}

	//$model的PropertyDescriptor
	var $modelAccessor = {
	    get: function () {
	        return toJson(this)
	    },
	    set: avalon.noop,
	    enumerable: false,
	    configurable: true
	}
	/**
	 * 添加不可遍历的系统属性($$skipArray中的那些属性)
	 *
	 * @param {type} host
	 * @param {type} name
	 * @param {type} value
	 * @returns {undefined}
	 */

	function hideProperty(host, name, value) {
	    if (canHideProperty) {
	        Object.defineProperty(host, name, {
	            value: value,
	            writable: true,
	            enumerable: false,
	            configurable: true
	        })
	    } else {
	        host[name] = value
	    }
	}

	/**************************************
	 * *************************************
	 ***************************************/
	/**
	 * 回收已有子vm构建新的子vm
	 * 用于vm.obj = newObj 的场合
	 * 
	 * @param {Observer} before
	 * @param {Observer} after
	 * @param {Object} heirloom
	 * @param {Object} options
	 * @returns {Observer}
	 */

	function subModelFactory(before, after, heirloom, options) {
	    var keys = {}
	    var $accessors = {}
	    var $idname = options.idname
	    var $pathname = options.pathname
	    var resue = before.$accessors || {}

	    var key, sid, spath
	    var skips = {}
	    for (key in after) {
	        if ($$skipArray[key])
	            continue
	        keys[key] = true
	        if (!isSkip(key, after[key], {})) {
	            if (resue[key]) {
	                $accessors[key] = resue[key]
	            } else {
	                sid = $idname + "." + key
	                spath = $pathname ? $pathname + "." + key : key
	                $accessors[key] = makeObservable(sid, spath, heirloom)
	            }
	        } else {
	            skips[key] = after[key]
	        }
	    }
	    var hashcode = before.$hashcode
	    $accessors.$model = $modelAccessor
	    var $vmodel = new Observer()
	    $vmodel = defineProperties($vmodel, $accessors, skips)

	    for (key in skips) {
	        $vmodel[key] = skips[key]
	        delete after[key]
	    }
	    function hasOwnKey(key) {
	        return keys[key] === true
	    }
	    if (options.top === true) {
	        makeFire($vmodel, heirloom)
	    }
	    before.$hashcode = false
	    hideProperty($vmodel, "$id", $idname)
	    hideProperty($vmodel, "$accessors", $accessors)
	    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
	    hideProperty($vmodel, "$hashcode", hashcode || makeHashCode("$"))

	    return $vmodel
	}
	/**************************************
	 ***************************************
	 ***************************************/
	/**
	 * 合并两个vm为一个vm,方便依赖收集
	 *
	 * @param {Component} before
	 * @param {Component} after
	 * @param {Object} heirloom
	 * @returns {Component}
	 */
	function mediatorFactory(before, after, heirloom, callback) {
	    heirloom = heirloom || {}
	    var b = before.$accessors || {}
	    var a = after.$accessors || {}
	    var $accessors = {}
	    var keys = {}, key
	    //收集所有键值对及访问器属性
	    for (key in before) {
	        keys[key] = before[key]
	        if (b[key]) {
	            $accessors[key] = b[key]
	        }
	    }

	    for (key in after) {
	        keys[key] = after[key]
	        if (a[key]) {
	            $accessors[key] = a[key]
	        }
	    }
	    callback && callback(keys, $accessors)

	    var $vmodel = new Observer()
	    $vmodel = defineProperties($vmodel, $accessors, keys)

	    for (key in keys) {
	        if (!$accessors[key]) {//添加不可监控的属性
	            $vmodel[key] = keys[key]
	        }
	        if (key in $$skipArray) {
	            delete keys[key]
	        } else {
	            keys[key] = true
	        }
	    }

	    function hasOwnKey(key) {
	        return keys[key] === true
	    }

	    makeFire($vmodel, heirloom)
	    hideProperty($vmodel, "$id", before.$id)
	    hideProperty($vmodel, "$accessors", $accessors)
	    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
	    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

	    return $vmodel
	}



	/*********************************************************************
	 *          监控数组（与ms-each, ms-repeat配合使用）                     *
	 **********************************************************************/
	function observeArray(array, old, heirloom, options) {
	    if (old && old.splice) {
	        var args = [0, old.length].concat(array)
	        old.splice.apply(old, args)
	        return old
	    } else {
	        for (var i in newProto) {
	            array[i] = newProto[i]
	        }

	        var hashcode = makeHashCode("$")
	        hideProperty(array, "$hashcode", hashcode)
	        hideProperty(array, "$id", options.idname || hashcode)
	        if (options.top) {
	            makeFire(array, heirloom)
	        }
	        array.notify = function (a, b, c, d) {
	            var vm = heirloom.__vmodel__
	            if (vm) {
	                var path = a === null || a === void 0 ?
	                        options.pathname :
	                        options.pathname + "." + a
	                vm.$fire(path, b, c)
	                if (!d) {
	                    avalon.rerenderStart = new Date
	                    batchUpdateEntity(vm.$id, true)
	                }
	            }
	        }

	        if (W3C) {
	            hideProperty(array, "$model", $modelAccessor)
	        } else {
	            array.$model = toJson(array)
	        }

	        var arrayOptions = {
	            idname: array.$id + ".*",
	            top: true
	        }
	        for (var j = 0, n = array.length; j < n; j++) {
	            array[j] = observeItem(array[j], {}, arrayOptions)
	        }

	        return array
	    }
	}


	function observeItem(item, a, b) {
	    if (avalon.isObject(item)) {
	        return observe(item, 0, a, b)
	    } else {
	        return item
	    }
	}

	var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
	var newProto = {
	    set: function (index, val) {
	        if (((index >>> 0) === index) && this[index] !== val) {
	            if (index > this.length) {
	                throw Error(index + "set方法的第一个参数不能大于原数组长度")
	            }
	            this.notify("*", val, this[index], true)
	            this.splice(index, 1, val)
	        }
	    },
	    contains: function (el) { //判定是否包含
	        return this.indexOf(el) !== -1
	    },
	    ensure: function (el) {
	        if (!this.contains(el)) { //只有不存在才push
	            this.push(el)
	        }
	        return this
	    },
	    pushArray: function (arr) {
	        return this.push.apply(this, arr)
	    },
	    remove: function (el) { //移除第一个等于给定值的元素
	        return this.removeAt(this.indexOf(el))
	    },
	    removeAt: function (index) { //移除指定索引上的元素
	        if ((index >>> 0) === index) {
	            return this.splice(index, 1)
	        }
	        return []
	    },
	    removeAll: function (all) { //移除N个元素
	        var size = this.length
	        if (Array.isArray(all)) {
	            for (var i = this.length - 1; i >= 0; i--) {
	                if (all.indexOf(this[i]) !== -1) {
	                    _splice.call(this, i, 1)
	                }
	            }
	        } else if (typeof all === "function") {
	            for (i = this.length - 1; i >= 0; i--) {
	                var el = this[i]
	                if (all(el, i)) {
	                    _splice.call(this, i, 1)
	                }
	            }
	        } else {
	            _splice.call(this, 0, this.length)

	        }
	        if (!W3C) {
	            this.$model = toJson(this)
	        }
	        notifySize(this, size)
	        this.notify()

	    },
	    clear: function () {
	        this.removeAll()
	        return this
	    }
	}

	function notifySize(array, size) {
	    if (array.length !== size) {
	        array.notify("length", array.length, size, true)
	    }
	}

	var _splice = ap.splice

	arrayMethods.forEach(function (method) {
	    var original = ap[method]
	    newProto[method] = function (a, b) {
	        // 继续尝试劫持数组元素的属性
	        var args = [], size = this.length
	        var options = {
	            idname: this.$id + ".*",
	            top: true
	        }
	        if (method === "splice" && this[0] && typeof this[0] === "object") {
	            var old = this.slice(a, b)
	            var neo = ap.slice.call(arguments, 2)
	            var args = [a, b]
	            for (var j = 0, jn = neo.length; j < jn; j++) {
	                args[j + 2] = observe(neo[j], old[j], old[j] && old[j].$events, options)
	            }
	        } else {
	            for (var i = 0, n = arguments.length; i < n; i++) {
	                args[i] = observeItem(arguments[i], {}, options)
	            }
	        }


	        var result = original.apply(this, args)
	        if (!W3C) {
	            this.$model = toJson(this)
	        }
	        notifySize(this, size)
	        this.notify()

	        return result
	    }
	})

	"sort,reverse".replace(rword, function (method) {
	    newProto[method] = function () {
	        ap[method].apply(this, arguments)
	        if (!W3C) {
	            this.$model = toJson(this)
	        }
	        this.notify()
	        return this
	    }
	})

	module.exports = {
	    observeArray: observeArray,
	    observeObject: observeObject,
	    makeObservable: makeObservable,
	    mediatorFactory: mediatorFactory,
	    define: define
	}
	//使用这个来扁平化数据  https://github.com/gaearon/normalizr
	//使用Promise  https://github.com/stefanpenner/es6-promise
	//使用这个AJAX库 https://github.com/matthew-andrews/isomorphic-fetch

/***/ },
/* 20 */
/***/ function(module, exports) {

	/**
	 * 
	$$skipArray:是系统级通用的不可监听属性
	$skipArray: 是当前对象特有的不可监听属性

	 不同点是
	 $$skipArray被hasOwnProperty后返回false
	 $skipArray被hasOwnProperty后返回true
	 */
	module.exports = avalon.oneObject("$id,$render,$element,$watch,$fire,$events,$model,$skipArray,$hashcode")


/***/ },
/* 21 */
/***/ function(module, exports) {

	//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
	//标准浏览器使用__defineGetter__, __defineSetter__实现
	var flag = true
	try {
	    Object.defineProperty({}, "_", {
	        value: "x"
	    })
	} catch (e) {
	    flag = false
	}

	module.exports = flag

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var makeHashCode = builtin.makeHashCode
	var msie = builtin.msie
	var window = builtin.window

	var canHideProperty = __webpack_require__(21)
	var $$skipArray = __webpack_require__(20)


	var defineProperties = Object.defineProperties
	var defineProperty = Object.defineProperty

	var expose = new Date() - 0

	if (!canHideProperty) {
	    if ("__defineGetter__" in avalon) {
	        defineProperty = function (obj, prop, desc) {
	            if ('value' in desc) {
	                obj[prop] = desc.value
	            }
	            if ("get" in desc) {
	                obj.__defineGetter__(prop, desc.get)
	            }
	            if ('set' in desc) {
	                obj.__defineSetter__(prop, desc.set)
	            }
	            return obj
	        }
	        defineProperties = function (obj, descs) {
	            for (var prop in descs) {
	                if (descs.hasOwnProperty(prop)) {
	                    defineProperty(obj, prop, descs[prop])
	                }
	            }
	            return obj
	        }
	    }
	    if (msie) {
	        var VBClassPool = {}
	        window.execScript([// jshint ignore:line
	            "Function parseVB(code)",
	            "\tExecuteGlobal(code)",
	            "End Function" //转换一段文本为VB代码
	        ].join("\n"), "VBScript")
	        function VBMediator(instance, accessors, name, value) {// jshint ignore:line
	            var accessor = accessors[name]
	            if (arguments.length === 4) {
	                accessor.set.call(instance, value)
	            } else {
	                return accessor.get.call(instance)
	            }
	        }
	        defineProperties = function (name, accessors, properties) {
	            // jshint ignore:line
	            var buffer = []
	            buffer.push(
	                    "\r\n\tPrivate [__data__], [__proxy__]",
	                    "\tPublic Default Function [__const__](d" + expose + ", p" + expose + ")",
	                    "\t\tSet [__data__] = d" + expose + ": set [__proxy__] = p" + expose,
	                    "\t\tSet [__const__] = Me", //链式调用
	                    "\tEnd Function")
	            //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
	            var uniq = {}

	            //添加访问器属性 
	            for (name in accessors) {
	                uniq[name] = true
	                buffer.push(
	                        //由于不知对方会传入什么,因此set, let都用上
	                        "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
	                        "\t\tCall [__proxy__](Me,[__data__], \"" + name + "\", val" + expose + ")",
	                        "\tEnd Property",
	                        "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
	                        "\t\tCall [__proxy__](Me,[__data__], \"" + name + "\", val" + expose + ")",
	                        "\tEnd Property",
	                        "\tPublic Property Get [" + name + "]", //getter
	                        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
	                        "\t\tSet[" + name + "] = [__proxy__](Me,[__data__],\"" + name + "\")",
	                        "\tIf Err.Number <> 0 Then",
	                        "\t\t[" + name + "] = [__proxy__](Me,[__data__],\"" + name + "\")",
	                        "\tEnd If",
	                        "\tOn Error Goto 0",
	                        "\tEnd Property")

	            }
	            for (name in properties) {
	                if (uniq[name] !== true) {
	                    uniq[name] = true
	                    buffer.push("\tPublic [" + name + "]")
	                }
	            }
	            for (name in $$skipArray) {
	                if (uniq[name] !== true) {
	                    uniq[name] = true
	                    buffer.push("\tPublic [" + name + "]")
	                }
	            }
	            buffer.push("\tPublic [" + 'hasOwnProperty' + "]")
	            buffer.push("End Class")
	            var body = buffer.join("\r\n")
	            var className = VBClassPool[body]
	            if (!className) {
	                className = makeHashCode("VBClass")
	                window.parseVB("Class " + className + body)
	                window.parseVB([
	                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
	                    "\tDim o",
	                    "\tSet o = (New " + className + ")(a, b)",
	                    "\tSet " + className + "Factory = o",
	                    "End Function"
	                ].join("\r\n"))
	                VBClassPool[body] = className
	            }
	            var ret = window[className + "Factory"](accessors, VBMediator) //得到其产品
	            return ret //得到其产品
	        }
	    }
	}

	module.exports = defineProperties

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

	

	var rtopsub = /([^.]+)\.(.+)/

	var batchUpdateEntity = __webpack_require__(24)
	var $emit = __webpack_require__(48).$emit

	//一个vm总是为Observer的实例
	function Observer() {
	}


	/**
	 * 生成计算访问器属性
	 * 
	 * @param {type} sid
	 * @param {type} spath
	 * @param {type} heirloom
	 * @param {type} top
	 * @param {type} key
	 * @param {type} value
	 * @returns {PropertyDescriptor}
	 */

	function makeComputed(sid, spath, heirloom, key, value) {
	    var old = NaN
	    function get() {
	        return old = value.get.call(this)
	    }
	    get.heirloom = heirloom
	    return {
	        get: get,
	        set: function (x) {
	            if (typeof value.set === "function") {
	                var older = old
	                value.set.call(this, x)
	                var val = this[key]
	                if (this.$hashcode && (val !== older)) {
	                    var vm = heirloom.__vmodel__
	                    if (vm) {
	                        if (heirloom !== vm.$events) {
	                            get.heirloom = vm.$events
	                        }
	                        $emit(get.heirloom[spath], this, spath, val, older)
	                        var vid = vm.$id.split(".")[0]

	                        batchUpdateEntity(vid, true)

	                    }
	                }
	            }
	        },
	        enumerable: true,
	        configurable: true
	    }
	}



	/**
	 * 判定此属性能否转换访问器
	 * 
	 * @param {type} key
	 * @param {type} value
	 * @param {type} skipArray
	 * @returns {Boolean}
	 */
	function isSkip(key, value, skipArray) {
	    return key.charAt(0) === "$" ||
	            skipArray[key] ||
	            (typeof value === "function") ||
	            (value && value.nodeName && value.nodeType > 0)
	}

	/**
	 * 判定是否计算属性的定义对象
	 * 
	 * @param {type} val
	 * @returns {Boolean}
	 */
	function isComputed(val) {//speed up!
	    if (val && typeof val === "object") {
	        for (var i in val) {
	            if (i !== "get" && i !== "set") {
	                return false
	            }
	        }
	        return typeof val.get === "function"
	    }
	}

	/**
	 * 抽取用户定义中的所有计算属性的定义
	 * 1.5中集中定义在$computed对象中
	 * @param {type} obj
	 * @returns {Object}
	 */
	function getComputed(obj) {
	    if (obj.$computed) {
	        delete obj.$computed
	        return obj.$computed
	    }
	    var $computed = {}
	    for (var i in obj) {
	        if (isComputed(obj[i])) {
	            $computed[i] = obj[i]
	            delete obj[i]
	        }
	    }
	    return $computed
	}

	module.exports = {
	    rtopsub: rtopsub,
	    Observer: Observer,
	    isSkip: isSkip,
	    getComputed: getComputed,
	    isComputed: isComputed,
	    makeComputed: makeComputed
	}

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var updateEntity = __webpack_require__(25)

	var root = builtin.root
	var document = builtin.document
	var diff = __webpack_require__(26)

	//如果正在更新一个子树,那么将它放到
	var dirtyTrees = {}
	var isBatchingUpdates = false
	function batchUpdateEntity(id, immediate) {
	    var vm = avalon.vmodels[id]
	    if (!document.nodeName || !vm || !vm.$render)//如果是在mocha等测试环境中立即返回
	        return

	    dirtyTrees[id] = true
	    if (isBatchingUpdates || avalon.repeatCount) {
	        return
	    }

	    var dom = vm.$element || document.getElementById(id)
	    //document.all http://www.w3help.org/zh-cn/causes/BX9002

	    if (dom) {
	        flushUpdate(function () {
	            isBatchingUpdates = true
	            var neo = vm.$render(vm)
	            // console.log(dom, dom.vnode,"!!!")
	            diff(neo, dom.vnode|| [])
	           
	            updateEntity([dom], neo)
	            dom.vnode = neo
	            avalon.log("rerender", new Date - avalon.rerenderStart)
	            
	            isBatchingUpdates = false
	            delete dirtyTrees[id]
	            for (var i in dirtyTrees) {//更新其他子树
	                batchUpdateEntity(i, true)
	                break
	            }
	        }, immediate)
	    }

	}

	function flushUpdate(callback, immediate ) {
	    if (immediate) {
	        callback()
	    } else {
	        avalon.nextTick(callback)
	    }
	}

	module.exports = batchUpdateEntity


/***/ },
/* 25 */
/***/ function(module, exports) {

	
	/**
	 * 更新真实DOM树
	 * @param {DOM} nodes 一个节点集合
	 * @param {VDOM} vnodes 一个虚拟节点数组
	 * @param {DOM} parent
	 * @returns {undefined}
	 */

	function updateEntity(nodes, vnodes, parent) {
	    var next = nodes[0]
	    if (!next && !parent)
	        return
	    parent = parent || next.parentNode
	    for (var i = 0, vn = vnodes.length; i < vn; i++) {
	        var vnode = vnodes[i]
	        var node = next
	        if (node)
	            next = node.nextSibling

	        if (vnode.directive === "for") {//ms-repeat
	            var hooks = vnode.change
	            if (hooks && hooks.length) {
	                var repeatNodes = [node], cur = node
	                innerLoop:
	                        while (cur && (cur = cur.nextSibling)) {
	                    repeatNodes.push(cur)
	                    if ((cur.nodeValue || "").indexOf("av-for-end:") === 0) {
	                        next = cur.nextSibling
	                        break innerLoop
	                    }
	                }
	                var hook, h = 0
	                while(hook = hooks[h++]){
	                    hook(repeatNodes, vnode.repeatVnodes, parent)
	                }
	                delete vnode.change
	            }
	         //ms-html,ms-text, ms-visible
	        } else if (false === execHooks(node, vnode, parent, "change")) {
	            execHooks(node, vnode, parent, "afterChange")//ms-duplex
	            continue
	        } else if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
	            //处理子节点
	            updateEntity(avalon.slice(node.childNodes), vnode.children, node)
	        }

	        execHooks(node, vnode, parent, "afterChange")
	    }
	}

	function execHooks(node, vnode, parent, hookName) {
	    var hooks = vnode[hookName]
	    if (hooks) {
	        for (var hook; hook = hooks.shift(); ) {
	            if (false === hook(node, vnode, parent)) {
	                return false
	            }
	        }
	        delete vnode[hookName]
	    }
	}


	module.exports = updateEntity

	// ms-if 没有路标, 组件
	// ms-include 没有路标, 非组件
	// ms-repeat 一开始添加路标,组件
	// ms-each 一开始添加路标, 组件
	// ms-html 没有路标,非组件
	// ms-text 没有路标,非组件


/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

	var directives = avalon.directives
	__webpack_require__(27)
	var empty = {
	    children: [], props: {}
	}
	function diff(current, previous) {
	    for (var i = 0; i < current.length; i++) {
	        var cur = current[i]
	        var pre = previous[i] || empty
	        switch (cur.type) {
	            case "#text":
	                if (!cur.skipContent) {
	                    directives.expr.diff(cur, pre)
	                }
	                break
	            case "#comment":
	                if (cur.directive === "for") {
	                    i = directives["for"].diff(current, previous, i)
	                } else if (cur.directive === "if") {
	                    directives["if"].diff(cur, pre)
	                }
	                break
	            default:
	                if (!cur.skipAttrs) {
	                    diffProps(cur, pre)
	                }
	                if (!cur.skipContent) {
	                    diff(cur.children, pre.children)
	                }
	                break

	        }

	    }
	}
	var rmsAttr = /^(?:ms|av)-(\w+)-?(.*)/
	function diffProps(current, previous) {
	    current.change = current.change || []
	    for (var name in current.props) {
	        var match = name.match(rmsAttr)
	        if (match) {
	            var type = match[1]
	            try {
	                directives[type] && directives[type].diff(current, previous, type, name)
	            } catch (e) {
	                avalon.log(current, previous, e, "diffProps error")
	            }
	        }
	    }

	}

	module.exports = avalon.diff = diff

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(28)
	__webpack_require__(31)
	__webpack_require__(32)
	__webpack_require__(33)
	__webpack_require__(34)
	__webpack_require__(42)
	__webpack_require__(43)
	__webpack_require__(44)
	__webpack_require__(45)
	__webpack_require__(46)
	__webpack_require__(47)

/***/ },
/* 28 */
/***/ function(module, exports, __webpack_require__) {

	
	var attrUpdate = __webpack_require__(6)
	var parse = __webpack_require__(29)


	var attrDir = avalon.directive("attr", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-attr'] = " + parse(binding) + ";\n"
	    },
	    diff: function (cur, pre) {
	        var a = cur.props["av-attr"]
	        var p = pre.props["av-attr"]
	        if (a && typeof a === "object") {
	            if (Array.isArray(a)) {
	                a = cur.props["av-attr"] = avalon.mix.apply({}, a)
	            }
	            if (typeof p !== "object") {
	                cur.changeAttr = a
	            } else {
	                var patch = {}
	                var hasChange = false
	                for (var i in a) {
	                    if (a[i] !== p[i]) {
	                        hasChange = true
	                        patch = a[i]
	                    }
	                }
	                if (hasChange) {
	                    cur.changeAttr = patch
	                }
	            }
	            if (cur.changeAttr) {
	                var list = cur.change || (cur.change = [])
	                avalon.Array.ensure(list, this.update)
	            }
	        }else {
	            cur.props["av-attr"] = pre.props["av-attr"]
	        }
	    },
	    //dom, vnode
	    update: attrUpdate
	})

	"aa:2, aa:2"

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

	
	var Cache = __webpack_require__(30)

	var rexpr = avalon.config.rexpr
	var quote = __webpack_require__(2).quote
	//function quote(a){
	//    return JSON.stringify(a)
	//}
	function K(a) {
	    return a
	}

	//缓存求值函数，以便多次利用
	var evaluatorPool = new Cache(512)
	var ifStatement = "if(!__elem__ || __elem__.nodeType !== 1){\n\treturn __value__\n}\n"

	avalon.mix({
	    __read__: function (name) {
	        var fn = avalon.filters[name]
	        if (fn) {
	            return fn.get ? fn.get : fn
	        }
	        return K
	    },
	    __write__: function (name) {
	        var fn = avalon.filters[name]
	        return fn && fn.set || K
	    }
	})
	var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
	var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
	var rfill = /\?\?\d+/g
	var brackets = /\(([^)]*)\)/
	var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g
	function parser(str, category) {
	    var binding = {}
	    if (typeof str === "object") {
	        binding = str
	        str = binding.expr
	    }
	    category = category || "other"
	    var input = str.trim()

	    var cacheStr = evaluatorPool.get(category + ":" + input)

	    if (cacheStr) {
	        return cacheStr
	    }

	    var number = 1
	//相同的表达式生成相同的函数
	    var maps = {}
	    function dig(a) {
	        var key = "??" + number++
	        maps[key] = a
	        return key
	    }

	    function fill(a) {
	        return maps[a]
	    }

	    input = input.replace(rregexp, dig).//移除所有正则
	            replace(rstring, dig).//移除所有字符串
	            replace(/\|\|/g, dig).//移除所有短路与
	            replace(/\s*(\.|\1)\s*/g, "$1").//移除. |两端空白
	            split(/\|(?=\w)/) //分离过滤器

	//还原body
	    var body = input.shift().replace(rfill, fill).trim().replace(rAt, "$1__vmodel__.")

	//处理表达式的过滤器部分
	    var filters = input.map(function (str) {

	        str = str.replace(rfill, fill).replace(rAt, "$1__vmodel__.") //还原
	        var hasBracket = false
	        str = str.replace(brackets, function (a, b) {
	            hasBracket = true
	            return /\S/.test(b) ?
	                    "(__value__," + b + ");" :
	                    "(__value__);"
	        })
	        if (!hasBracket) {
	            str += "(__value__);"
	        }
	        str = str.replace(/(\w+)/, "avalon.__read__('$1')")
	        return "__value__ = " + str
	    })
	    var ret = []
	    if (category === "on") {
	        filters = filters.map(function (el) {
	            return el.replace("__value__", "$event")
	        })
	        if (filters.length) {
	            filters.push("if($event.$return){\n\treturn;\n}")
	        }
	        ret = ["function self($event){",
	            "try{",
	            "\tvar __vmodel__ = this;",
	            "\t" + body,
	            "}catch(e){",
	            "\tavalon.log(e, " + quote('parse "' + str + '" fail') + ")",
	            "}",
	            "}"]
	        filters.unshift(2, 0)
	    } else if (category === "duplex") {
	        var setterFilters = filters.map(function (str) {
	            str = str.replace("__read__", "__write__")
	            return str.replace(");", ",__elem__);")
	        })
	        //setter
	        var setterBody = [
	            "function (__vmodel__, __value__, __elem__){",
	            "if(!__elem__ || __elem__.nodeType !== 1) ",
	            "\treturn",
	            "try{",
	            "\t" + body + " = __value__",
	            "}catch(e){",
	            "\tavalon.log(e, " + quote('parse "' + str + '" fail') + ")",
	            "}",
	            "}"]

	        setterBody.splice(3, 0, setterFilters.join("\n"))
	        var fn = Function("return " + setterBody.join("\n"))()
	        evaluatorPool.put("duplex:" + str.trim() + ":setter", fn)

	        var getterFilters = filters.map(function (str) {
	            return str.replace(");", ",__elem__);")
	        })
	        var getterBody = [
	            "function (__vmodel__, __value__, __elem__){",
	            "try{",
	            "if(arguments.length === 1)",
	            "\treturn " + body,
	            "if(!__elem__ || __elem__.nodeType !== 1) return ",
	            "return __value__",
	            "}catch(e){",
	            "\tavalon.log(e, " + quote('parse "' + str + '" fail') + ")",
	            "}",
	            "}"]
	        getterBody.splice(5, 0, getterFilters.join("\n"))
	        fn = Function("return " + getterBody.join("\n"))()
	        evaluatorPool.put("duplex:" + str.trim(), fn)
	        return
	    } else {
	        ret = [
	            "(function(){",
	            "try{",
	            "var __value__ = " + body,
	            "return __value__",
	            "}catch(e){",
	            "\tavalon.log(e, " + quote('parse "' + str + '" fail') + ")",
	            "\treturn ''",
	            "}",
	            "})()"
	        ]
	        filters.unshift(3, 0)
	    }

	    ret.splice.apply(ret, filters)
	    cacheStr = ret.join('\n')
	    evaluatorPool.put(category + ":" + input, cacheStr)
	    return cacheStr

	}

	avalon.parseExprProxy = function (code, type) {
	    var fn = parser(code, type)
	    if (fn) {
	        return Function("return " + fn)()
	    }
	    return fn
	}

	parser.caches = evaluatorPool

	module.exports = parser
	//var str = parser("@aaa |upper(11)|ddd | eee")
	//console.log(str)

/***/ },
/* 30 */
/***/ function(module, exports) {

	// https://github.com/rsms/js-lru
	function LRU(maxLength) {
	    this.size = 0
	    this.limit = maxLength
	    this.head = this.tail = void 0
	    this._keymap = {}
	}

	var p = LRU.prototype

	p.put = function (key, value) {
	    var entry = {
	        key: key,
	        value: value
	    }
	    this._keymap[key] = entry
	    if (this.tail) {
	        this.tail.newer = entry
	        entry.older = this.tail
	    } else {
	        this.head = entry
	    }
	    this.tail = entry
	    if (this.size === this.limit) {
	        this.shift()
	    } else {
	        this.size++
	    }
	    return value
	}

	p.shift = function () {
	    var entry = this.head
	    if (entry) {
	        this.head = this.head.newer
	        this.head.older =
	                entry.newer =
	                entry.older =
	                this._keymap[entry.key] = void 0
	        delete this._keymap[entry.key] //#1029
	    }
	}
	p.get = function (key) {
	    var entry = this._keymap[key]
	    if (entry === void 0)
	        return
	    if (entry === this.tail) {
	        return  entry.value
	    }
	    // HEAD--------------TAIL
	    //   <.older   .newer>
	    //  <--- add direction --
	    //   A  B  C  <D>  E
	    if (entry.newer) {
	        if (entry === this.head) {
	            this.head = entry.newer
	        }
	        entry.newer.older = entry.older // C <-- E.
	    }
	    if (entry.older) {
	        entry.older.newer = entry.newer // C. --> E
	    }
	    entry.newer = void 0 // D --x
	    entry.older = this.tail // D. --> E
	    if (this.tail) {
	        this.tail.newer = entry // E. <-- D
	    }
	    this.tail = entry
	    return entry.value
	}

	module.exports = LRU


/***/ },
/* 31 */
/***/ function(module, exports) {

	
	avalon.directive("expr", {
	    parse: function () {
	    },
	    diff: function (cur, pre) {//curNode, preNode
	        if (cur.nodeValue !== pre.nodeValue) {
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (node, vnode, parent) {
	        if (node.nodeType !== 3) {
	            parent.replaceChild(vnode.toDOM(), node)
	        } else {
	            node.nodeValue = vnode.nodeValue
	        }
	    }
	})

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

	
	var parse = __webpack_require__(29)

	avalon.directive("style", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-style'] = " + parse(binding.expr) + ";\n"
	    },
	    diff: function (cur, pre) {
	        var a = cur.props["av-style"]
	        var p = pre.props["av-style"]
	        if (a && typeof a === "object") {
	            if (Array.isArray(a)) {
	                a = cur.props["av-style"] = avalon.mix.apply({}, a)
	            }
	            if (typeof p !== "object") {
	                cur.changeStyle = a
	            } else {
	                var patch = {}
	                var hasChange = false
	                for (var i in a) {
	                    if (a[i] !== p[i]) {
	                        hasChange = true
	                        patch = a[i]
	                    }
	                }
	                if (hasChange) {
	                    cur.changeStyle = patch
	                }
	            }
	            if (cur.changeStyle) {
	                var list = cur.change || (cur.change = [])
	                avalon.Array.ensure(list, this.update)
	            }
	        } else {
	            cur.props["av-style"] = p
	        }
	    },
	    update: function (node, vnode) {
	        var change = vnode.changeStyle
	        var wrap = avalon(node)
	        for (var name in change) {
	            wrap.css(name, change[name])
	        }
	        delete vnode.changeStyle
	    }
	})


/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

	
	var parse = __webpack_require__(29)

	avalon.caches["text:all"] = function () {
	    var a = this.props["av-text"]
	    a = a == null ? '' : a + ""
	    return [{type: '#text', nodeValue: String(a)}]
	}

	avalon.directive("text", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".$render = avalon.caches['text:all'];\n" +
	                "vnode" + num + ".props['av-text'] =" + parse(binding.expr) + ";\n"
	    },
	    diff: function (cur, pre) {
	        var curValue = cur.props["av-text"]
	        var preValue = pre.props["av-text"]
	        if (curValue !== preValue) {
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (node, vnode) {
	        var child = vnode.children[0]
	        if (!child) {
	            return
	        }
	        if ("textContent" in node) {
	            node.textContent = child.nodeValue + ""
	        } else {
	            node.innerText = child.nodeValue + ""
	        }
	    }
	})


/***/ },
/* 34 */
/***/ function(module, exports, __webpack_require__) {

	
	var createVirtual = __webpack_require__(35)
	var parse = __webpack_require__(29)
	var VElement = __webpack_require__(39)

	avalon.createRenderProxy = function (str) {
	    var vnode = avalon.createVirtual(str, true)
	    return avalon.caches["render:" + str] = avalon.createRender(vnode)
	}

	avalon.directive("html", {
	    parse: function (binding, num) {
	        return "var dynamicHTML" + num + " = vnode" + num + ".props['av-html'] = " + parse(binding.expr) +
	                ";\nvnode" + num + ".$render = avalon.caches['render:'+dynamicHTML" + num + "] || " +
	                "avalon.createRenderProxy(dynamicHTML" + num + ")\n"
	    },
	    diff: function (cur, pre) {
	        var curValue = cur.props["av-html"]
	        var preValue = pre.props["av-html"]
	        if (curValue !== preValue) {
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        } else {
	            cur.children = pre.children.concat()
	        }

	    },
	    update: function (node, vnode) {
	        //移除事件
	        if (node.querySelectorAll) {
	            var nodes = node.querySelectorAll("[avalon-events]")
	            avalon.each(nodes, function (el) {
	                avalon.unbind(el)
	            })
	        } else {
	            var nodes = node.getElementsByTagName("")
	            avalon.each(nodes, function (el) {
	                if (el.getAttribute("avalon-events")) {
	                    avalon.unbind(el)
	                }
	            })
	        }
	        //添加节点
	        if (window.Range) {
	            node.innerHTML = vnode.children.map(function (c) {
	                return avalon.vdomAdaptor(c).toHTML()
	            }).join("")
	        } else {
	            avalon.clearHTML(node)
	            var fragment = document.createDocumentFragment()
	            vnode.children.forEach(function (c) {
	                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
	            })

	            node.appendChild(fragment)
	        }
	    }
	})


/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	
	var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
	//匹配只有开标签的无内容元素（Void elements 或 self-contained tags）
	//http://www.colorglare.com/2014/02/03/to-close-or-not-to-close.html
	//http://blog.jobbole.com/61514/
	var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/
	//用于创建适配某一种标签的正则表达式
	//var openStr = "(?:\\s+[^=\\s]+(?:\\=[^>\\s]+)?)*\\s*>"
	var openStr = "(?:\\s+[^>=]*?(?:=[^>]+?)?)*>"
	//匹配文本节点
	var rtext = /^[^<]+/
	//匹配注释节点
	var rcomment = /^<!--([\w\W]*?)-->/

	var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
	var rstring2 = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/
	// /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
	var rnocontent = /textarea|template|script|style/
	var tagCache = {}// 缓存所有匹配开标签闭标签的正则
	var controllerHook = __webpack_require__(36).controllerHook

	var maps = {}
	var number = 1
	function dig(a) {
	    var key = "??" + number++
	    maps[key] = a
	    return key
	}
	var rfill = /\?\?\d+/g
	function fill(a) {
	    var val = maps[a]
	    return val
	}
	var pushArray = __webpack_require__(2).pushArray
	var makeHashCode = __webpack_require__(2).makeHashCode

	var vdom = __webpack_require__(37)
	var VText = vdom.VText
	var VComment = vdom.VComment
	var VElement = vdom.VElement
	var rchar = /./g
	var rsp = /^\s+$/
	var rspAfterForStart = /^(ms|av)-for\:/
	var rspBeforeForEnd = /^(ms|av)-for-end\:/
	var rleftTrim = /^\s+/
	//=== === === === 创建虚拟DOM树 === === === === =


	//此阶段只会生成VElement,VText,VComment
	function createVirtual(text, recursive) {
	    //text.replace(/<!--(ms|av)-for\:(\S)-->(\s+)/)

	    var nodes = []
	    if (recursive && !avalon.config.rbind.test(text)) {
	        return nodes
	    }
	    if (!recursive) {
	        text = text.replace(rstring, dig)
	    }
	    do {
	        var matchText = ""

	        var match = text.match(rtext)
	        var node = false

	        if (match) {//尝试匹配文本
	            matchText = match[0]
	            node = new VText(matchText.replace(rfill, fill))
	        }

	        if (!node) {//尝试匹配注释
	            match = text.match(rcomment)
	            if (match) {
	                matchText = match[0]
	                node = new VComment(match[1].replace(rfill, fill))
	                if (rspBeforeForEnd.test(node.nodeValue)) {
	                    var sp = nodes[nodes.length - 1]
	                    //移除紧挨着<!--av-for-end:xxxx-->前的空白节点
	                    if (sp && sp.type === '#text' && rsp.test(sp.nodeValue)) {
	                        nodes.pop()
	                    }
	                }
	            }
	        }


	        if (!node) {//尝试匹配拥有闭标签的元素节点
	            match = text.match(rfullTag)
	            if (match) {
	                matchText = match[0]//贪婪匹配 outerHTML,可能匹配过多
	                var type = match[1].toLowerCase()//nodeName
	                var opens = []
	                var closes = []
	                var ropen = tagCache[type + "open"] ||
	                        (tagCache[type + "open"] = new RegExp("<" + type + openStr, "g"))
	                var rclose = tagCache[type + "close"] ||
	                        (tagCache[type + "close"] = new RegExp("<\/" + type + ">", "g"))
	                /* jshint ignore:start */
	                matchText.replace(ropen, function (_, b) {
	                    //注意,页面有时很长,b的数值就很大,如
	                    //000000000<000000011>000000041<000000066>000000096<000000107>
	                    opens.push(("0000000000" + b + "<").slice(-10))//取得所有开标签的位置
	                    return _.replace(rchar, "1")
	                }).replace(rclose, function (_, b) {
	                    closes.push(("0000000000" + b + ">").slice(-10))//取得所有闭标签的位置               
	                })

	                /* jshint ignore:end */
	                //<div><div>01</div><div>02</div></div><div>222</div><div>333</div>
	                //会变成000<005<012>018<025>031>037<045>051<059>
	                //再变成<<><>><><>
	                //最后获取正确的>的索引值,这里为<<><>>的最后一个字符,
	                var pos = opens.concat(closes).sort()
	                var gtlt = pos.join("").replace(/\d+/g, "")
	                var k = 0, last = 0

	                for (var i = 0, n = gtlt.length; i < n; i++) {
	                    var c = gtlt.charAt(i)
	                    if (c === "<") {
	                        k += 1
	                    } else {
	                        k -= 1
	                    }
	                    if (k === 0) {
	                        last = i
	                        break
	                    }
	                }
	                var findex = parseFloat(pos[last]) + type.length + 3 // (</>为三个字符)
	                matchText = matchText.slice(0, findex) //取得正确的outerHTML
	                match = matchText.match(rvoidTag) //抽取所有属性

	                var attrs = {}
	                if (match[2]) {
	                    parseAttrs(match[2], attrs)
	                }

	                var template = matchText.slice(match[0].length,
	                        (type.length + 3) * -1) //抽取innerHTML
	                var innerHTML = template.replace(rfill, fill).trim()

	                node = {
	                    type: type,
	                    props: attrs,
	                    template: innerHTML,
	                    children: []
	                }

	                if (node.props["av-skip"]) {
	                    node.skipContent = true
	                } else if (type === "textarea") {
	                    node.props.type = "textarea"
	                } else if (type === "option") {
	                    node.children.push(new VText(trimHTML(innerHTML)))
	                } else if (type === "xmp") {
	                    node.children.push(new VText(innerHTML))
	                } else if (rnocontent.test(type)) {
	                    node.skipContent = true
	                } else {//script, noscript, template, textarea
	                    var childs = createVirtual(template, true)
	                    if (childs.length) {
	                        pushArray(node.children, childs)
	                    }
	                }
	                node = new VElement(node)
	            }
	        }

	        if (!node) {
	            match = text.match(rvoidTag)
	            if (match) {//尝试匹配自闭合标签及注释节点
	                matchText = match[0]
	                type = match[1].toLowerCase()
	                attrs = {}
	                if (match[2]) {
	                    parseAttrs(match[2], attrs)
	                }
	                node = new VElement({
	                    type: type,
	                    props: attrs,
	                    template: "",
	                    children: [],
	                    isVoidTag: true
	                })
	                if (type === "input" && !node.props.type) {
	                    node.props.type = "text"
	                }
	              
	            }
	        }
	        if (node) {
	            nodes.push(node)
	            text = text.slice(matchText.length)
	            if (node.type === '#comment' && rspAfterForStart.test(node.nodeValue)) {
	                node.signature = makeHashCode("for")
	                //移除紧挨着<!--av-for:xxxx-->后的空白节点
	                text = text.replace(rleftTrim, "")
	            }
	        } else {
	            break
	        }
	    } while (1);
	    if (!recursive) {
	        maps = {}
	    }
	    return nodes
	}

	var rnowhite = /\S+/g
	var rnogutter = /\s*=\s*/g
	var rquote = /&quot;/g
	var ramp = /&amp;/g
	var rstringFill = /^\?\?\d+$/

	function parseAttrs(str, attrs) {
	    str.replace(rnogutter, "=").replace(rnowhite, function (el) {
	        var arr = el.split("="), value = arr[1] || "",
	                name = arr[0].toLowerCase()
	        if (arr.length === 2) {
	            //if (value.match(rstring)) { //if(rstring2.test(value)) {
	            if (value.indexOf("??") === 0) {
	                value = value.replace(rfill, fill).
	                        slice(1, -1).
	                        replace(ramp, "&").
	                        replace(rquote, '"')

	            }

	        }
	        attrs[name] = value
	    })
	}
	//form prototype.js
	var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
	function trimHTML(v) {
	    return String(v).replace(rtrimHTML, "").trim()
	}


	module.exports = avalon.createVirtual = createVirtual

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	var attrUpdate = __webpack_require__(6)


	//添加更新真实DOM的钩子,钩子为指令的update方法,它们与绑定对象一样存在优化级
	function addData(elem, name) {
	    return elem[name] || (elem[name] = {})
	}

	function addHook(node, hook, name, priority) {
	    name = name || "change"
	    var hooks = node[name] || (node[name] = [])
	    if (avalon.Array.ensure(hooks, hook)) {
	        if (priority) {
	            hook.priority = priority
	        }
	        hooks.sort(function (a, b) {
	            return a.priority - b.priority
	        })
	    }
	}

	function addHooks(dir, binding) {
	    var hook = dir.update
	    hook.priority = binding.priority
	    addHook(binding.element, hook)
	}

	function addAttrHook(node) {
	    addHook(node, attrUpdate)
	}



	module.exports = {
	    addData: addData,
	    addHook: addHook,
	    addHooks: addHooks,
	    addAttrHook: addAttrHook
	}

	/*
	 每次domReady时都会扫描全部DOM树
	 创建一个虚拟DOM树
	 如果之前存在一个虚拟DOM树,
	 那么它的所有节点将打上disposed标记, 在gc系统中集中销毁
	 
	 然后扫描虚拟DOM树,将一些特有的绑定属性转换为虚拟组件(VComponent)
	 如ms-repeat, ms-html, ms-if, ms-text, ms-include 
	 现在虚拟DOM树存在4种类型 VElement, VComment, VText, VComponent
	 其他绑定属性将转换绑定对象
	 同一个元素底下的绑定对象按优化级排序, 依次初始化, 将它们关联到VM的对应属性的订阅者数组中
	 
	 绑定对象初始化会添加getter,change, update方法(ms-duplex还有setter方法)
	 
	 当VM属性变化时, 执行对应订阅数组的所有绑定对象的change方法,更新虚拟DOM树的某些属性或结构
	 并且框架在执行这订阅数组前,将canUpdateEntity置为false, 用于批量更新真实DOM树,
	 只有当更新完才将canUpdateEntity置为true
	 
	 批量更新真实DOM树的步骤如下:
	 从上到下, 一个个真实DOM节点与虚拟DOM节点进行比较
	 在上面的change方法会为虚拟DOM节点添加了一个change的钩子函数数组,
	 里面拥有各种更新DOM的策略,这些钩子的优先级也排好了
	 如果这个虚拟DOM没有change数组会直接跳过
	 如果这个虚拟DOM打上skip或skipContent,也会跳过
	 否则先判定其类型是否 VElement或VComponent,继续更新其孩子
	 
	 当此子树更新完了,就会更新它的下一个兄弟,是一个深序优先遍历算法
	 
	 此更新策略有如下特点
	 从上到下更新, 如果上级节点要被删掉,即真实DOM没有对应的虚拟DOM, 那么
	 下方的change数组会直接跳过
	 
	 用户对同一个属性进行操作, 会在change方法中被合并
	 
	 订阅数组中的绑定对象的移除,之前是通过判定element是否在DOM树上,不断调用contains方法
	 性能很差, 现在这个element为虚拟DOM, 它是否移除看disposed属性
	 
	 ms-repeat等重型指令,其处理对象也是一堆repeatItem 组件, 排序添加删除只是一个普通的JS操作,
	 比真实DOM的移动轻量多了
	 
	 
	 */

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * 虚拟DOM的4大构造器
	 */
	var VText = __webpack_require__(38)
	var VElement = __webpack_require__(39)
	var VComment = __webpack_require__(40)
	var VComponent = __webpack_require__(41)
	avalon.vdomAdaptor = function (obj) {
	    switch (obj.type) {
	        case "#text":
	            return new VText(obj)
	        case "#comment":
	            return new VComment(obj)
	        case "#component":
	            return new VComponent(obj)
	        default:

	            return new VElement(obj)
	    }
	}

	module.exports = {
	    VText: VText,
	    VComment: VComment,
	    VElement: VElement,
	    VComponent: VComponent
	}


/***/ },
/* 38 */
/***/ function(module, exports) {

	var rexpr = avalon.config.rexpr
	var rexpr = avalon.config.rexpr

	function VText(text) {
	    if (typeof text === "string") {
	        this.type = "#text"
	        this.nodeValue = text
	        this.skipContent = !rexpr.test(text)
	    } else {
	        for (var i in text) {
	            this[i] = text[i]
	        }
	    }
	}

	VText.prototype = {
	    constructor: VText,
	    clone: function () {
	        return new VText(this)
	    },
	    toDOM: function () {
	        return document.createTextNode(this.nodeValue)
	    },
	    toHTML: function () {
	        return this.nodeValue
	    }
	}

	module.exports = VText

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var rmsAttr = builtin.rmsAttr
	var quote = builtin.quote
	var pushArray = builtin.pushArray

	function VElement(type, props, children) {
	    if (typeof type === "object") {
	        for (var i in type) {
	            this[i] = type[i]
	        }
	    } else {
	        this.type = type
	        this.props = props
	        this.children = children
	        this.template = ""
	    }
	}
	VElement.prototype = {
	    clone: function () {
	        var clone = new VElement(this.type,
	                avalon.mix({}, this.props),
	                this.children.map(function (el) {
	                    return el.clone()
	                }))
	        clone.template = this.template
	        if (this.skipContent) {
	            clone.skipContent = this.skipContent
	        }
	        if (this.isVoidTag) {
	            clone.isVoidTag = this.isVoidTag
	        }
	        return clone
	    },
	    constructor: VElement,
	    toDOM: function () {

	        var dom = document.createElement(this.type)

	        for (var i in this.props) {
	            if (this.props[i] !== false) {
	                dom.setAttribute(i, String(this.props[i]))
	            }
	        }
	        if (this.skipContent) {
	            switch (this.type) {
	                case "script":
	                    dom.text = this.template
	                    break
	                case "style":
	                case "template":
	                    dom.innerHTML = this.template
	                    break
	                case "noscript":
	                    dom.textContent = this.template
	                    break
	                default:
	                    var a = avalon.parseHTML(this.template)
	                    dom.appendChild(a)
	                    break
	            }

	        } else if (!this.isVoidTag) {
	            if (this.children.length) {
	                this.children.forEach(function (c) {
	                    dom.appendChild(avalon.vdomAdaptor(c).toDOM())
	                })
	            } else if (window.Range) {
	                dom.innerHTML = this.template
	            } else {
	                dom.appendChild(avalon.parseHTML(this.template))
	            }

	        }
	        return dom
	    },
	    toHTML: function () {
	        var arr = []
	        for (var i in this.props) {
	            arr.push(i + "=" + quote(String(this.props[i])))
	        }
	        arr = arr.length ? " " + arr.join(" ") : ""
	        var str = "<" + this.type + arr
	        if (this.isVoidTag) {
	            return str + "/>"
	        }
	        str += ">"
	        if (this.children.length) {
	            str += this.children.map(function (c) {
	                return avalon.vdomAdaptor(c).toHTML()
	            }).join("")
	        } else {
	            str += this.template
	        }
	        return str + "</" + this.type + ">"
	    }
	}

	module.exports = VElement

/***/ },
/* 40 */
/***/ function(module, exports) {

	
	function VComment(text) {
	    if (typeof text === "string") {
	        this.type = "#comment"
	        this.nodeValue = text
	        this.skipContent = true
	    } else {
	        for (var i in text) {
	            this[i] = text[i]
	        }
	    }
	}
	VComment.prototype = {
	    constructor: VComment,
	    clone: function () {
	        return new VComment(this)
	    },
	    toDOM: function () {
	        return document.createComment(this.nodeValue)
	    },
	    toHTML: function () {
	        return "<!--" + this.nodeValue + "-->"
	    }
	}

	module.exports = VComment

/***/ },
/* 41 */
/***/ function(module, exports, __webpack_require__) {

	var pushArray = __webpack_require__(2).pushArray

	function VComponent(config) {
	    for (var i in config) {
	        this[i] = config[i]
	    }
	    var type = this.__type__ = this.type 
	    
	    this.type = "#component"
	    var me = avalon.components[type]
	    if (me && me.init && arguments.length) {
	        me.init.apply(this, arguments)
	    }
	}

	VComponent.prototype = {
	    clone: function () {
	        var me = avalon.components[this.__type__]
	        if (me && me.clone) {
	            return me.clone.call(this)
	        } else {
	            var clone = new VComponent()
	            clone.props = avalon.mix(clone.props, this.props)
	            clone.children = this.children.map(function (el) {
	                return el.clone()
	            })
	            clone.__type__ = this.__type__
	            clone.template = this.template
	            return this
	        }
	    },
	    toDOM: function () {
	        var me = avalon.components[this.__type__]
	        if (me && me.toDOM) {
	            return me.toDOM.call(this)
	        }
	        var fragment = document.createDocumentFragment()
	        for (var i = 0; i < this.children.length; i++) {
	            fragment.appendChild(this.children[i].toDOM())
	        }
	        return fragment
	    },
	    toHTML: function () {
	        var me = avalon.components[this.__type__]
	        if (me && me.toHTML) {
	            return me.toHTML.call(this)
	        }
	        var ret = ""
	        for (var i = 0; i < this.children.length; i++) {
	            ret += this.children[i].toHTML()
	        }
	        return ret
	    }
	}


	module.exports = VComponent

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var builtin = __webpack_require__(2)
	var document = builtin.document
	var W3C = builtin.W3C
	var root = builtin.root
	var parse = __webpack_require__(29)

	function parseDisplay(nodeName, val) {
	    //用于取得此类标签的默认display值
	    var key = "_" + nodeName
	    if (!parseDisplay[key]) {
	        var node = document.createElement(nodeName)
	        root.appendChild(node)
	        if (W3C) {
	            val = getComputedStyle(node, null).display
	        } else {
	            val = node.currentStyle.display
	        }
	        root.removeChild(node)
	        parseDisplay[key] = val
	    }
	    return parseDisplay[key]
	}

	avalon.parseDisplay = parseDisplay

	avalon.directive("visible", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-visible'] = " + parse(binding) + ";\n"
	    },
	    change: function (cur, pre) {
	        var curValue = !!cur.props['av-visible']
	        if (curValue !== Boolean(pre.props['av-visible'])) {
	            cur.isShow = curValue
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }

	    },
	    update: function (node, vnode) {
	        if (vnode.isShow) {
	            var cur = avalon(node).css("display")
	            if (!vnode.displayValue && cur !== "none") {
	                vnode.displayValue = cur
	            }
	            if (cur === "none") {
	                if (!vnode.displayValue) {
	                    vnode.displayValue = parseDisplay(node.nodeName)
	                }
	                node.style.display = vnode.displayValue
	            } else {
	                node.style.display = vnode.displayValue
	            }
	        } else {
	            node.style.display = "none"
	        }
	    }
	})

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
	//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
	var markID = __webpack_require__(2).markID
	var parse = __webpack_require__(29)



	var directives = avalon.directives
	avalon.directive("class", {
	    parse: function (binding, num) {
	        //必须是布尔对象或字符串数组
	        return "vnode" + num + ".props['" + binding.name + "'] = " + parse(binding) + ";\n"
	    },
	    diff: function (cur, pre, type) {
	        var curValue = cur.props["av-" + type]
	        var preValue = pre.props["av-" + type]
	        if (!pre.classEvent) {
	            var classEvent = {}
	            if (type === "hover") {//在移出移入时切换类名
	                classEvent.mouseenter = activateClass
	                classEvent.mouseleave = abandonClass
	            } else if (type === "active") {//在获得焦点时切换类名
	                cur.props.tabindex = cur.props.tabindex || -1
	                classEvent.tabIndex = cur.props.tabindex
	                classEvent.mousedown = activateClass
	                classEvent.mouseup = abandonClass
	                classEvent.mouseleave = abandonClass
	            }
	            cur.classEvent = classEvent
	        } else {
	            cur.classEvent = pre.classEvent
	        }

	        if (Object(curValue) === curValue) {
	            var className
	            if (Array.isArray(curValue)) {
	                //convert it to a string 
	                className = curValue.join(" ").trim().replace(/\s+/, " ")
	            } else if (typeof curValue === "object") {
	                className = Object.keys(curValue).filter(function (name) {
	                    return curValue[name]
	                }).join(" ")
	            }
	            if (typeof className !== "string") {
	                cur.props["av-" + type] = preValue
	                return
	            }
	            if (!preValue || preValue !== className) {
	                cur["change-" + type] = className
	                var list = cur.change || (cur.change = [])
	                avalon.Array.ensure(list, this.update)
	            }

	        } else {
	            cur.props["av-" + type] = preValue
	        }
	    },
	    update: function (node, vnode) {
	        var classEvent = vnode.classEvent
	        if (classEvent) {
	            for (var i in classEvent) {
	                if (i === "tabIndex") {
	                    node[i] = classEvent[i]
	                } else {
	                    avalon.bind(node, i, classEvent[i])
	                }
	            }
	            vnode.classEvent = {}
	        }
	        var names = ["class", "hover", "active"]
	        names.forEach(function (type) {
	            var name = "change-" + type
	            var value = vnode[ name ]
	            if (!value)
	                return
	            if (type === "class") {

	                setClass(node, vnode)
	            } else {
	                var oldType = node.getAttribute(name)
	                if (oldType) {
	                    avalon(node).removeClass(oldType)
	                }
	                node.setAttribute(name, value)
	            }
	        })
	    }
	})
	directives.active = directives.hover = directives["class"]

	var classMap = {
	    mouseenter: "change-hover",
	    mouseleave: "change-hover",
	    mousedown: "change-active",
	    mouseup: "change-active"
	}

	function activateClass(e) {
	    var elem = e.target
	    avalon(elem).addClass(elem.getAttribute(classMap[e.type]) || "")
	}

	function abandonClass(e) {
	    var elem = e.target
	    var name = classMap[e.type]
	    avalon(elem).removeClass(elem.getAttribute(name) || "")
	    if (name !== "change-active") {
	        avalon(elem).removeClass(elem.getAttribute("change-active") || "")
	    }
	}

	function setClass(node, vnode) {
	    var old = vnode["old-change-class"]
	    var neo = vnode["change-class"]
	    avalon(node).removeClass(old).addClass(neo)
	    vnode["old-change-class"] = neo
	    delete vnode["change-class"]
	}

	markID(activateClass)
	markID(abandonClass)




/***/ },
/* 44 */
/***/ function(module, exports, __webpack_require__) {

	var markID = __webpack_require__(2).markID
	var quote = __webpack_require__(2).quote


	//基于事件代理的高性能事件绑定
	var rdash = /\(([^)]*)\)/
	avalon.directive("on", {
	    priority: 3000,
	    parse: function (binding, num) {
	        return  "vnode" + num + ".onVm = __vmodel__\n" +
	                "vnode" + num + ".props[" + quote(binding.name) + "] = " +
	                "avalon.caches[" + quote(binding.type + ":" + binding.expr) + "] = " +
	                "avalon.caches[" + quote(binding.type + ":" + binding.expr) + "] || " +
	                "avalon.parseExprProxy(" + quote(binding.expr) + ",'on');\n"
	    },
	    diff: function (cur, pre, type, name) {
	        var curValue = cur.props[name]
	        var preValue = pre.props[name]
	        
	        if (curValue !== preValue) {
	            type = name.replace("av-on-", "").replace(/-\d+$/, "")
	            var uuid = markID(curValue)
	            var search = type + ":" + uuid
	            if (!avalon.__eventVM__[search]) {//注册事件回调
	                avalon.__eventVM__[search] = cur.onVm
	            }
	            delete cur.onVm
	            cur.changeEvents = cur.changeEvents || {}
	            cur.changeEvents[search] = curValue
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (node, vnode) {
	        if (!vnode.disposed) {
	            vnode.dom = node
	            for (var key in vnode.changeEvents) {
	                var type = key.split(":").shift()
	                var listener = vnode.changeEvents[key]
	                avalon.bind(node, type.replace(/-\d+$/, ""), listener)
	            }
	            delete vnode.changeEvents
	        }
	    }
	})

	function disposeOn() {
	    if (this._) {
	        avalon.unbind(this._)
	        this.dom = null
	    }
	}




/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	//双工绑定

	var parse = __webpack_require__(29)
	var builtin = __webpack_require__(2)
	var createVirtual = __webpack_require__(35)

	var W3C = builtin.W3C
	var msie = builtin.msie
	var quote = builtin.quote
	var markID = builtin.markID
	var document = builtin.document
	var pushArray = builtin.pushArray


	var rchangeFilter = /\|\s*change\b/
	var rcheckedFilter = /\|\s*checked\b/
	var rcheckedType = /^(?:checkbox|radio)$/
	var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/

	var getset = {
	    getter: 1,
	    setter: 1,
	    elem: 1,
	    vnode: 1,
	    vmodel: 1,
	    get: 1,
	    set: 1,
	    watchValueInTimer: 1
	}

	avalon.directive("duplex", {
	    priority: 2000,
	    parse: function (binding, num, elem) {
	        var expr = binding.expr
	        var etype = elem.props.type
	        var xtype

	        if (rcheckedFilter.test(expr)) {
	            if (rcheckedType.test(etype)) {
	                xtype = "checked"
	            } else {
	                avalon.log("只有radio与checkbox才能用checked过滤器")
	                expr = expr.replace(rcheckedFilter, "")
	            }
	        }

	        if (rchangeFilter.test(expr)) {
	            if (rnoduplexInput.test(etype)) {
	                avalon.log(etype + "不支持change过滤器")
	                expr = expr.replace(rchangeFilter, "")
	            } else {
	                xtype = "change"
	            }
	        }

	        if (!xtype) {
	            xtype = etype === "select" ? "select" :
	                    etype === "checkbox" ? "checkbox" :
	                    etype === "radio" ? "radio" :
	                    "input"
	        }
	        binding.expr = expr
	        parse(binding, "duplex")
	        return "vnode" + num + ".duplexVm = __vmodel__;\n" +
	                "vnode" + num + ".props.xtype = " + quote(xtype) + ";\n" +
	                "vnode" + num + ".props['av-duplex'] = " + quote(binding.expr) + ";\n"
	    },
	    diff: function (cur, pre) {
	        if (pre.duplexData && pre.duplexData.set) {
	            cur.duplexData = pre.duplexData
	        } else {
	            initDuplexData(cur)
	        }

	        var duplexData = cur.duplexData
	        delete cur.duplexVm

	        var value = cur.props.value = duplexData.getter(duplexData.vmodel)
	        if (!duplexData.elem) {
	            var isEqual = false
	        } else {

	            var preValue = pre.props.value
	            if (Array.isArray(value)) {
	                isEqual = value + "" === preValue + ""
	            } else {
	                isEqual = value === preValue
	            }
	        }

	        if (!isEqual) {
	            var afterChange = cur.afterChange || (cur.afterChange = [])
	            if (cur.type === "select") {
	                avalon.Array.ensure(afterChange, duplexSelectAfter)
	            }
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }

	    },
	    update: function (node, vnode) {
	        var binding = node.duplexData = vnode.duplexData


	        if (!binding.elem) {//这是一次性绑定
	            binding.elem = node //方便进行垃圾回收
	            for (var eventName in binding) {
	                var callback = binding[eventName]
	                if (!getset[eventName] && typeof callback === "function") {
	                    avalon.bind(node, eventName, binding[eventName])
	                    delete binding[eventName]
	                }
	            }
	            if (binding.watchValueInTimer) {//chrome 42及以下版本需要这个hack
	                node.valueSet = duplexValue //#765
	                watchValueInTimer(function () {
	                    if (!vnode.disposed) {
	                        if (!node.msFocus) {
	                            node.valueSet()
	                        }
	                    } else {
	                        return false
	                    }
	                })
	                delete binding.watchValueInTimer
	            }
	        }

	        var curValue = vnode.props.value

	        switch (vnode.props.xtype) {
	            case "input":
	            case "change":
	                if (curValue !== node.oldValue) {
	                    node.value = curValue
	                }
	                break
	            case "checked":
	            case "radio":
	                curValue = vnode.props.xtype === "checked" ? !!curValue :
	                        curValue + "" === node.value
	                node.oldValue = curValue
	                if (msie === 6) {
	                    setTimeout(function () {
	                        //IE8 checkbox, radio是使用defaultChecked控制选中状态，
	                        //并且要先设置defaultChecked后设置checked
	                        //并且必须设置延迟
	                        node.defaultChecked = curValue
	                        node.checked = curValue
	                    }, 31)
	                } else {
	                    node.checked = curValue
	                }
	                break
	            case "checkbox":
	                var array = [].concat(curValue) //强制转换为数组
	                curValue = node.duplexData.get(node.value)
	                node.checked = array.indexOf(curValue) > -1
	                break
	            case "select":
	                //在afterChange中处理
	                break
	        }
	    }
	})


	function initDuplexData(elem) {
	    var etype = elem.props.type
	    var xtype = elem.props.xtype
	    var duplexData = {}
	    switch (xtype) {
	        case "checked"://当用户指定了checked过滤器
	            duplexData.click = duplexChecked
	            break
	        case "radio":
	            duplexData.click = duplexValue
	            break
	        case "checkbox":
	            duplexData[msie < 9 ? "click" : "change"] = duplexCheckBox
	            break
	        case "change":
	            duplexData.change = duplexValue
	            break
	        case "select":
	            if (!elem.children.length) {
	                pushArray(elem.children, createVirtual(elem.template))
	            }
	            duplexData.change = duplexSelect
	            break
	        case "input":
	            if (!msie) { // W3C
	                duplexData.input = duplexValue
	                duplexData.compositionstart = compositionStart
	                duplexData.compositionend = compositionEnd
	                duplexData.DOMAutoComplete = duplexValue
	            } else {
	                // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
	                if (msie > 8) {
	                    if (msie === 9) {
	                        //IE9删除字符后再失去焦点不会同步 #1167
	                        duplexData.keyup = duplexValue
	                    }
	                    //IE9使用propertychange无法监听中文输入改动
	                    duplexData.input = duplexValue
	                } else {
	                    //onpropertychange事件无法区分是程序触发还是用户触发
	                    //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
	                    duplexData.propertychange = duplexValueHack
	                }
	                duplexData.dragend = duplexDragEnd
	                //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
	                //http://www.matts411.com/post/internet-explorer-9-oninput/
	            }
	            break

	    }

	    if (xtype === "input" && !rnoduplexInput.test(etype)) {
	        if (etype !== "hidden") {
	            duplexData.focus = duplexFocus
	            duplexData.blur = duplexBlur
	        }
	        duplexData.watchValueInTimer = true
	    }

	    duplexData.vmodel = elem.duplexVm
	    duplexData.vnode = elem
	    duplexData.set = function (val, checked) {
	        var vnode = this.vnode
	        if (vnode.props.xtype === "checkbox") {
	            var array = vnode.props.value
	            if (!Array.isArray(array)) {
	                log("ms-duplex应用于checkbox上要对应一个数组")
	                array = [array]
	            }
	            var method = checked ? "ensure" : "remove"
	            if (array[method]) {
	                array[method](val)
	            }
	        } else {
	            this.setter(this.vmodel, val, this.elem)
	        }
	    }

	    duplexData.get = function (val) {
	        return this.getter(this.vmodel, val, this.elem)
	    }

	    var evaluatorPool = parse.caches
	    var expr = elem.props["av-duplex"]
	    duplexData.getter = evaluatorPool.get("duplex:" + expr)
	    duplexData.setter = evaluatorPool.get("duplex:" + expr + ":setter")
	    elem.duplexData = duplexData
	    elem.dispose = disposeDuplex
	}

	function disposeDuplex() {
	    var elem = this.duplexData.elem
	    if (elem) {
	        elem.oldValue = elem.valueSet = elem.duplexData = void 0
	        avalon.unbind(elem)
	        this.dom = null
	    }
	}
	function compositionStart() {
	    this.composing = true
	}
	function compositionEnd() {
	    this.composing = false
	}
	function duplexFocus() {
	    this.msFocus = true
	}
	function duplexBlur() {
	    this.msFocus = false
	}

	function duplexChecked() {
	    var elem = this
	    var binding = elem.duplexData
	    var lastValue = elem.oldValue = binding.get()
	    binding.set(lastValue)
	}

	function duplexCheckBox() {
	    var elem = this
	    var val = elem.duplexData.get(elem.value)
	    elem.duplexData.set(val, elem.checked)
	}

	function duplexValueHack(e) {
	    if (e.propertyName === "value") {
	        duplexValue.call(this, e)
	    }
	}

	function duplexDragEnd(e) {
	    var elem = this
	    setTimeout(function () {
	        duplexValue.call(elem, e)
	    }, 17)
	}


	function duplexValue(e) { //原来的updateVModel
	    var elem = this, fixCaret
	    var val = elem.value //防止递归调用形成死循环
	    if (elem.composing || val === elem.oldValue)
	        return
	    if (elem.msFocus) {
	        try {
	            var pos = getCaret(elem)
	            if (pos.start === pos.end) {
	                pos = pos.start
	                fixCaret = true
	            }
	        } catch (e) {
	            avalon.log("fixCaret", e)
	        }
	    }
	    var lastValue = elem.duplexData.get(val)
	    try {
	        elem.value = elem.oldValue = lastValue + ""
	        if (fixCaret) {
	            setCaret(elem, pos, pos)
	        }
	        elem.duplexData.set(lastValue)
	    } catch (ex) {
	        avalon.log(ex)
	    }
	}

	//用于更新VM
	function duplexSelect() {
	    var elem = this
	    var val = avalon(elem).val() //字符串或字符串数组
	    if (Array.isArray(val)) {
	        val = val.map(function (v) {
	            return elem.duplexData.get(v)
	        })
	    } else {
	        val = elem.duplexData.get(val)
	    }
	    if (val + "" !== elem.oldValue) {
	        try {
	            elem.duplexData.set(val)
	        } catch (ex) {
	            log(ex)
	        }
	    }
	}

	function duplexSelectAfter(elem, vnode) {
	    avalon(elem).val(vnode.value)
	}


	duplexSelectAfter.priority = 2001

	markID(compositionStart)
	markID(compositionEnd)
	markID(duplexFocus)
	markID(duplexBlur)
	markID(duplexValue)
	markID(duplexValueHack)
	markID(duplexDragEnd)
	markID(duplexCheckBox)
	markID(duplexSelect)

	if (msie) {
	    avalon.bind(document, "selectionchange", function (e) {
	        var el = document.activeElement || {}
	        if (!el.msFocus && el.valueSet) {
	            el.valueSet()
	        }
	    })
	}


	var TimerID, ribbon = []

	avalon.tick = function (fn) {
	    if (ribbon.push(fn) === 1) {
	        TimerID = setInterval(ticker, 60)
	    }
	}

	function ticker() {
	    for (var n = ribbon.length - 1; n >= 0; n--) {
	        var el = ribbon[n]
	        if (el() === false) {
	            ribbon.splice(n, 1)
	        }
	    }
	    if (!ribbon.length) {
	        clearInterval(TimerID)
	    }
	}

	var watchValueInTimer = avalon.noop

	        ;
	(function () { // jshint ignore:line
	    try { //#272 IE9-IE11, firefox
	        var setters = {}
	        var aproto = HTMLInputElement.prototype
	        var bproto = HTMLTextAreaElement.prototype
	        function newSetter(value) { // jshint ignore:line
	            setters[this.tagName].call(this, value)
	            if (!this.msFocus && this.valueSet) {
	                this.valueSet()
	            }
	        }
	        var inputProto = HTMLInputElement.prototype
	        Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
	        setters["INPUT"] = Object.getOwnPropertyDescriptor(aproto, "value").set

	        Object.defineProperty(aproto, "value", {
	            set: newSetter
	        })
	        setters["TEXTAREA"] = Object.getOwnPropertyDescriptor(bproto, "value").set
	        Object.defineProperty(bproto, "value", {
	            set: newSetter
	        })
	    } catch (e) {
	        //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
	        // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
	        // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
	        watchValueInTimer = avalon.tick
	    }
	})()

	// jshint ignore:line
	function getCaret(ctrl) {
	    var start = NaN, end = NaN
	    if (ctrl.setSelectionRange) {
	        start = ctrl.selectionStart
	        end = ctrl.selectionEnd
	    } else if (document.selection && document.selection.createRange) {
	        var range = document.selection.createRange()
	        start = 0 - range.duplicate().moveStart('character', -100000)
	        end = start + range.text.length
	    }
	    return {
	        start: start,
	        end: end
	    }
	}

	function setCaret(ctrl, begin, end) {
	    if (!ctrl.value || ctrl.readOnly)
	        return
	    if (ctrl.createTextRange) {//IE6-8
	        var range = ctrl.createTextRange()
	        range.collapse(true)
	        range.moveStart("character", begin)
	        range.select()
	    } else {
	        ctrl.selectionStart = begin
	        ctrl.selectionEnd = end
	    }
	}



/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var makeHashCode = __webpack_require__(2).makeHashCode
	var quote = __webpack_require__(2).quote

	avalon.directive("if", {
	    priority: 5,
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-if'] = " + quote(binding) + ";\n"
	    },
	    diff: function (cur, pre) {
	        if (cur.type !== pre.type) {
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (dom, vnode, parent) {
	        var dtype = dom.nodeName.toLowerCase()
	        var vtype = vnode.type
	        if (dtype !== vtype) {
	            if (dom.nodeType === 1) {
	                var a = makeHashCode("if")
	                avalon.caches[a] = dom
	                parent.replaceChild(document.createComment(a), dom)
	            } else {
	                a = dom.nodeValue
	                var keep = avalon.caches[a]
	                if (keep) {
	                    parent.replaceChild(keep, dom)
	                    delete avalon.caches[a]
	                } else {
	                    var el = new VElement(vnode)
	                    parent.replaceChild(el.toDOM(), dom)
	                }
	            }
	        }
	    }
	})


/***/ },
/* 47 */
/***/ function(module, exports, __webpack_require__) {

	var parse = __webpack_require__(29)

	avalon._each = function (obj, fn) {
	    if (Array.isArray(obj)) {
	        for (var i = 0; i < obj.length; i++) {
	            var value = obj[i]
	            var type = typeof value
	            var key = value && type === "object" ? obj.$hashcode : type + value
	            fn(i, obj[i], key)
	        }
	    } else {
	        for (var i in obj) {
	            if (obj.hasOwnProperty(i)) {
	                fn(i, obj[i], i)
	            }
	        }
	    }
	}
	var rforPrefix = /av-for:\s+/
	var rforLeft = /^\s*\(\s*/
	var rforRight = /\s*\)\s*$/
	var rforSplit = /\s+,\s+/
	avalon.directive("for", {
	    parse: function (str, num) {
	        var arr = str.replace(rforPrefix, "").split(" in ")

	        var def = "var loop" + num + " = " + parse(arr[1]) + "\n"
	        var kv = arr[0].replace(rforLeft, "").replace(rforRight, "").split(rforSplit)
	        if (kv.length === 1) {
	            kv.unshift("$key")
	        }

	        return def + "avalon._each(loop" + num + ", function(" + kv + ",traceKey){\n\n"
	    },
	    diff: function (current, previous, i) {
	        var cur = current[i]
	        var pre = previous[i] || {}
	        var hasSign1 = "directive" in cur
	        var hasSign2 = "directive" in pre

	        var curLoop = hasSign1 ? getForBySignature(current, i) :
	                getForByNodeValue(current, i)

	        var preLoop = pre.repeatVnodes
	        if (!preLoop) {
	            preLoop = hasSign2 ? getForBySignature(previous, i) :
	                    getForByNodeValue(previous, i)
	        }

	        var n = curLoop.length - preLoop.length
	        if (n > 0) {
	            var spliceArgs = [i, 0]
	            for (var j = 0; j < n; j++) {
	                spliceArgs.push(null)
	            }
	            previous.splice.apply(previous, spliceArgs)
	        } else {
	            previous.splice.apply(previous, [i, Math.abs(n)])
	        }
	        cur.action = !hasSign2 ? "replace" : "reorder"

	        cur.repeatVnodes = curLoop
	        var ccom = cur.components = getForByKey(curLoop.slice(1, -1), cur.signature)

	        if (cur.action === "reorder") {
	            var cache = {}
	            var indexes = {}
	            for (var i = 0, c; c = ccom[i++]; ) {
	                saveInCache(cache, c)
	            }
	            var pcom = pre.components

	            for (var i = 0, c; c = pcom[i++]; ) {
	                var p = isInCache(cache, c.key)
	                if (p) {
	                    indexes[c.index] = p.index
	                }
	            }
	            //这是新添加的元素
	            for (var i in cache) {
	                p = cache[i]
	                indexes[p.index + "_"] = p
	            }
	            cur.indexes = indexes
	        }

	        var list = cur.change || (cur.change = [])
	        avalon.Array.ensure(list, this.update)
	        return i + curLoop.length - 1

	    },
	    update: function (nodes, vnodes, parent) {
	        var bellwether = vnodes[0]
	        var action = bellwether.action
	        var startRepeat = nodes[0]
	        var endRepeat = nodes[nodes.length - 1]
	        if (action === "replace") {
	            var node = startRepeat.nextSibling
	            while (node !== endRepeat) {
	                parent.removeChild(node)
	                node = startRepeat.nextSibling
	            }
	            var fragment = document.createDocumentFragment()
	            vnodes[0].repeatVnodes.slice(1, -1).forEach(function (c) {
	                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
	            })
	            parent.insertBefore(fragment, endRepeat)

	        } else {
	            var groupText = bellwether.signature
	            var indexes = bellwether.indexes
	            var emptyFragment = document.createDocumentFragment()
	            var fragment = emptyFragment.cloneNode(false)

	            var next, sortedFragments = {}, fragments = [],
	                    i = 0, el
	            while (next = startRepeat.nextSibling) {
	                if (next === endRepeat) {
	                    break
	                } else if (next.nodeValue === groupText) {
	                    fragment.appendChild(next)
	                    if (indexes[i] !== void 0) {
	                        sortedFragments[indexes[i]] = fragment
	                        delete indexes[i]
	                    } else {
	                        fragments.push(fragment)
	                    }
	                    i++
	                    fragment = emptyFragment.cloneNode(false)
	                } else {
	                    fragment.appendChild(next)
	                }
	            }

	            for (i in indexes) {
	                var com = indexes[i]
	                i = parseFloat(i)
	//                fragment = fragments.shift()
	//                if (fragment) {
	//                    sortedFragments[ i ] = fragment
	//                } else {
	                sortedFragments[ i ] = componentToDom(com, emptyFragment.cloneNode(false))
	//                }
	            }

	            for (i = 0, el; el = sortedFragments[i++]; ) {
	                emptyFragment.appendChild(el)
	            }

	            var entity = avalon.slice(emptyFragment.childNodes)
	            parent.insertBefore(emptyFragment, endRepeat)
	            updateEntity(entity, vnodes.slice(1, -1), parent)
	        }

	    }
	})

	function componentToDom(com, fragment) {
	    com.children.forEach(function (c) {
	        fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
	    })
	    return fragment
	}

	//将要循环的节点根据锚点元素再分成一个个更大的单元,用于diff
	function getForByKey(nodes, signature) {
	    var components = []
	    var com = {
	        children: []
	    }
	    for (var i = 0, el; el = nodes[i]; i++) {
	        if (el.type === "#comment" && el.nodeValue === signature) {
	            com.children.push(el)
	            com.key = el.key
	            com.index = components.length
	            components.push(com)
	            com = {
	                children: []
	            }
	        } else {
	            com.children.push(el)
	        }
	    }
	    return components
	    //components.push(com)
	}

	//从一组节点,取得要循环的部分(第二次生成的虚拟DOM树会走这分支)
	function getForBySignature(nodes, i) {
	    var start = nodes[i], node
	    var endText = start.nodeValue.replace(":start", ":end")
	    var ret = []
	    while (node = nodes[i++]) {
	        ret.push(node)
	        if (node.nodeValue === endText) {
	            break
	        }
	    }
	    return ret
	}

	//从一组节点,取得要循环的部分(初次生成的虚拟DOM树及真实DOM树会走这分支)
	function getForByNodeValue(nodes, i) {
	    var isBreak = 0, ret = [], node
	    while (node = nodes[i++]) {
	        if (node.type === "#comment") {
	            if (node.nodeValue.indexOf("av-for:") === 0) {
	                isBreak++
	            } else if (node.nodeValue.indexOf("av-for-end:") === 0) {
	                isBreak--
	            }
	        }
	        ret.push(node)
	        if (isBreak === 0) {
	            break
	        }
	    }
	    return ret
	}

	// 新 位置: 旧位置
	function isInCache(cache, id) {
	    var c = cache[id]
	    if (c) {
	        var stack = [{id: id, c: c}]
	        while (1) {
	            id += "_"
	            if (cache[id]) {
	                stack.push({
	                    id: id,
	                    c: cache[id]
	                })
	            } else {
	                break
	            }
	        }
	        var a = stack.pop()
	        delete cache[a.id]
	        return a.c
	    }
	    return c
	}

	function saveInCache(cache, component) {
	    var trackId = component.key
	    if (!cache[trackId]) {
	        cache[trackId] = component
	    } else {
	        while (1) {
	            trackId += "_"
	            if (!cache[trackId]) {
	                cache[trackId] = component
	                break
	            }
	        }
	    }
	}


/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	/*********************************************************************
	 *                           依赖调度系统                              *
	 **********************************************************************/


	var builtin = __webpack_require__(2)
	var rtopsub = __webpack_require__(23).rtopsub

	var noop = builtin.noop
	var getUid = builtin.getUid

	function adjustVm(vm, expr) {
	    var toppath = expr.split(".")[0], other
	    try {
	        if (vm.hasOwnProperty(toppath)) {
	            if (vm.$accessors) {
	                other = vm.$accessors[toppath].get.heirloom.__vmodel__
	            } else {
	                other = Object.getOwnPropertyDescriptor(vm, toppath).get.heirloom.__vmodel__
	            }

	        }
	    } catch (e) {
	        avalon.log("adjustVm " + e)
	    }
	    return other || vm
	}


	function $watch(expr, funOrObj) {
	    var vm = adjustVm(this, expr)
	    var hive = vm.$events
	    var list = hive[expr] || (hive[expr] = [])
	    if (vm !== this) {
	        this.$events[expr] = list
	    }
	    var data = typeof funOrObj === "function" ? {
	        update: funOrObj,
	        element: {},
	        expr: "[[ " + expr + " ]]",
	        shouldDispose: function () {
	            return vm.$hashcode === false
	        },
	        uuid: getUid(funOrObj)
	    } : funOrObj

	    funOrObj.shouldDispose = funOrObj.shouldDispose || shouldDispose

	    return function () {
	        avalon.Array.remove(list, data)
	    }
	}


	function shouldDispose() {
	    var el = this.element
	    return !el || el.disposed
	}


	/**
	 * $fire 方法的内部实现
	 * 
	 * @param {Array} list 订阅者数组
	 * @param {Component} vm
	 * @param {String} path 监听属性名或路径
	 * @param {Any} a 当前值 
	 * @param {Any} b 过去值
	 * @param {Number} i 如果抛错,让下一个继续执行
	 * @returns {undefined}
	 */
	function $emit(list, vm, path, a, b, i) {
	    if (list && list.length) {
	        try {
	            for (i = i || list.length - 1; i >= 0; i--) {
	                var data = list[i]
	                if (!data.element || data.element.disposed) {
	                    list.splice(i, 1)
	                } else if (data.update) {
	                    data.update.call(vm, a, b, path)
	                }
	            }
	        } catch (e) {
	            if (i - 1 > 0)
	                $emit(list, vm, path, a, b, i - 1)
	            avalon.log(e, path)
	        }
	       
	    }
	}


	module.exports = {
	    $emit: $emit,
	    $watch: $watch,
	    adjustVm: adjustVm
	}


/***/ },
/* 49 */
/***/ function(module, exports, __webpack_require__) {

	
	var parse = __webpack_require__(29)
	var parseBindings = __webpack_require__(50)
	var parseInterpolate = __webpack_require__(51)


	var rexpr = avalon.config.rexpr
	var quote = __webpack_require__(2).quote
	var makeHashCode = __webpack_require__(2).makeHashCode

	function wrap(a, num) {
	    return "(function(){\n\n" + a + "\n\nreturn nodes" + num + "\n})();\n"
	}
	//av-for: a in @array

	function createRender(arr) {
	    var num = num || String(new Date - 0).slice(0, 6)
	    var body = toTemplate(arr, num) + "\n\nreturn nodes" + num
	    // console.log(body)
	    var fn = Function("__vmodel__", body)
	    return fn
	}
	function toTemplate(arr, num) {
	    num = num || String(new Date - 0).slice(0, 5)

	    var forstack = []
	    var hasIf = false
	    var children = "nodes" + num
	    var vnode = "vnode" + num
	    var str = "var " + children + " = []\n"
	    for (var i = 0; i < arr.length; i++) {
	        var el = arr[i]
	        if (el.type === "#text") {
	            str += "var " + vnode + " = {type:'#text', skipContent:true}\n"
	            var hasExpr = rexpr.test(el.nodeValue)

	            if (hasExpr) {
	                var array = parseInterpolate(el.nodeValue, false)
	                if (array.length === 1) {
	                    var a = parse(array[0].expr)
	                } else {
	                    a = array.map(function (el) {
	                        return el.type ? "String(" + parse(el.expr) + ")" : quote(el.expr)
	                    }).join(" + ")

	                }
	                /* jshint ignore:start */

	                str += vnode + ".nodeValue = String(" + a + ")\n"
	                str += vnode + ".skipContent = false\n"
	            } else {
	                str += vnode + ".nodeValue = " + quote(el.nodeValue) + "\n"
	            }
	            str += children + ".push(" + vnode + ")\n"

	        } else if (el.type === "#comment") {
	            var nodeValue = el.nodeValue
	            if (nodeValue.indexOf("av-for:") === 0) {
	                var signature = el.signature
	                forstack.push(signature)
	                str += children + ".push({" +
	                        "\n\ttype:'#comment'," +
	                        "\n\tdirective:'for'," +
	                        "\n\tskipContent:false," +
	                        "\n\tsignature:" + quote(signature) + "," +
	                        "\n\tnodeValue:" + quote(signature + ":start") + "," +
	                        "\n})\n"
	                str += avalon.directives["for"].parse(nodeValue, num)

	            } else if (nodeValue.indexOf("av-for-end:") === 0) {
	                var signature = forstack[forstack.length - 1]

	                str += children + ".push({" +
	                        "\n\ttype:'#comment'," +
	                        "\n\tskipContent:true," +
	                        "\n\tnodeValue:" + quote(signature) + "," +
	                        "\n\tkey:traceKey\n})\n"
	                str += "\n})\n" //结束循环
	                if (forstack.length) {
	                    var signature = forstack[forstack.length - 1]
	                    str += children + ".push({" +
	                            "\n\ttype:'#comment'," +
	                            "\n\tskipContent:true," +
	                            "\n\tsignature:" + quote(signature) + "," +
	                            "\n\tnodeValue:" + quote(signature + ":end") + "," +
	                            "\n})\n"

	                    forstack.pop()
	                }
	            } else if (nodeValue.indexOf("js:") === 0) {
	                str += parse(nodeValue.replace("js:", "")) + "\n"
	            } else {
	                str += children + ".push(" + quote(el) + ");;;;\n"
	            }
	            continue
	        } else { //处理元素节点
	            var hasIf = el.props["av-if"]
	            if (hasIf) { // 优化处理av-if指令
	                str += "if(!(" + parse(hasIf, 'if') + ")){\n"
	                str += children + ".push({" +
	                        "\n\ttype: '#comment'," +
	                        "\n\tdirective: 'if'," +
	                        "\n\tnodeValue: '<!--av-if:-->'," +
	                        "\n\tprops: {'av-if':true} })\n"
	                str += "\n}else{\n\n"

	            }
	            str += "var " + vnode + " = {" +
	                    "\n\ttype: " + quote(el.type) + "," +
	                    "\n\tprops: {}," +
	                    "\n\tchildren: []," +
	                    "\n\tisVoidTag: " + !!el.isVoidTag + "," +
	                    "\n\ttemplate: '' }\n"
	            var hasBindings = parseBindings(el.props, num,  el)
	            if (hasBindings) {
	                str += hasBindings
	            } else {
	                str += vnode + ".template= " + quote(el.template) + "\n"
	            }
	            //av-text,av-html,会将一个元素变成组件
	            str += "if(" + vnode + ".$render){\n"

	            str += "\t" + vnode + ".children = " + vnode + ".$render(__vmodel__)\n"
	            str += "}else{\n"
	            str += "\t" + vnode + ".children = " + wrap(toTemplate(el.children, num), num) + "\n"
	            str += "}\n"
	            str += children + ".push(" + vnode + ")\n"

	            if (hasIf) {
	                str += "}\n"
	                hasIf = false
	            }
	        }

	    }
	    return str
	}

	module.exports = avalon.createRender = createRender

/***/ },
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	var oneObject = __webpack_require__(2).oneObject

	var directives = avalon.directives

	var priorityMap = {
	    "if": 10,
	    "repeat": 90,
	    "data": 100,
	    "each": 1400,
	    "with": 1500,
	    "duplex": 20000,
	    "on": 30000
	}
	var eventMap = oneObject("animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit")

	var rmsAttr = /^(?:ms|av)-(\w+)-?(.*)/
	function parseBindings(props, num, elem) {
	    var bindings = []
	    for (var i in props) {
	        var value = props[i], match
	        if (i === "av-skip") {
	            return  "vnode" + num + ".skipAttrs = true\n"
	        }
	        if (value && (match = i.match(rmsAttr))) {
	            var type = match[1]
	            var param = match[2] || ""
	            var name = i
	            if (eventMap[type]) {
	                param = type
	                type = "on"
	                delete props[name]
	                name = "av-on-"+param
	                props[name] = value
	            }
	            
	            if (directives[type]) {

	                var binding = {
	                    type: type,
	                    param: param,
	                    name: name,
	                    expr: value,
	                    priority: directives[type].priority ||
	                            type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, "")) || 0)
	                }

	                bindings.push(binding)
	            }
	        }
	    }

	    if (!bindings.length) {
	        return "vnode" + num + ".skipAttrs = true\n"
	    }
	    var ret = ""
	    bindings.sort(bindingSorter).forEach(function (binding) {
	        ret += directives[binding.type].parse(binding, num, elem)
	    })
	    return ret

	}
	function bindingSorter(a, b) {
	    return a.priority - b.priority
	}

	module.exports = parseBindings

/***/ },
/* 51 */
/***/ function(module, exports) {

	var rline = /\r?\n/g

	function parseInterpolate(str, useTrim) {
	    var tokens = [],
	            value, start = 0,
	            stop
	    do {
	        stop = str.indexOf(avalon.config.openTag, start)
	        if (stop === -1) {
	            break
	        }
	        value = str.slice(start, stop)
	        if (start === 0) {
	            value = value.replace(/^\s+/,"")
	        }
	        if (value) { // {{ 左边的文本
	            tokens.push({
	                expr: value
	            })
	        }
	        start = stop + avalon.config.openTag.length
	        stop = str.indexOf(avalon.config.closeTag, start)
	        if (stop === -1) {
	            break
	        }
	        value = str.slice(start, stop)
	        if (value) { //处理{{ }}插值表达式
	            tokens.push({
	                expr: value.replace(rline, ""),
	                type: "{{}}"
	            })
	        }
	        start = stop + avalon.config.closeTag.length
	    } while (1)
	    value = str.slice(start)

	    if (value.replace(/\s+$/,"")) { //}} 右边的文本
	        tokens.push({
	            expr: value.replace(/\s+$/,"")
	        })
	    }
	    return tokens
	}

	module.exports = parseInterpolate


/***/ }
/******/ ])
});
;