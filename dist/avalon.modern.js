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

	var avalon = __webpack_require__(68) 

	__webpack_require__(8)
	__webpack_require__(15)
	__webpack_require__(70)
	__webpack_require__(79)
	__webpack_require__(53)
	__webpack_require__(81)


	module.exports = avalon


/***/ },
/* 1 */,
/* 2 */,
/* 3 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {//avalon的核心,这里都是一些不存在异议的*核心*方法与属性
	function avalon(el) {
	    return new avalon.init(el)
	}

	global.avalon = avalon

	avalon.init = function (el) {
	    this[0] = this.element = el
	}

	avalon.fn = avalon.prototype = avalon.init.prototype


	avalon.mix = function (destination, source) {
	    for (var property in source) {
	        destination[property] = source[property]
	    }
	    return destination
	}

	var rword = /[^, ]+/g


	avalon.mix(avalon, {
	    noop: function(){},
	    //切割字符串为一个个小块，以空格或逗号分开它们，结合replace实现字符串的forEach
	    rword: rword,
	    inspect: ({}).toString,
	    ohasOwn: ({}).hasOwnProperty,
	    log: function () {
	        if (window.console && avalon.config.debug) {
	            // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
	            Function.apply.call(console.log, console, arguments)
	        }
	    },
	    error: function (str, e) {
	        throw (e || Error)(str)
	    },


	    //将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象
	    oneObject: function (array, val) {
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
	    
	})

	module.exports = avalon
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 4 */
/***/ function(module, exports) {

	/* WEBPACK VAR INJECTION */(function(global) {var window = global
	var browser = {
	    window: window,
	    document: {//方便在nodejs环境不会报错
	        createElement: function () {
	            return {}
	        },
	        createElementNS: function(){
	            return {}
	        },
	        contains: Boolean
	    },
	    root: {
	        outerHTML: 'x'
	    },
	    msie: NaN,
	    modern: true,
	    avalonDiv: null,
	    avalonFragment: null
	}

	if (window.window === window) {
	    var document = window.document
	    browser.document = document
	    browser.modern = window.dispatchEvent
	    browser.root = document.documentElement
	    browser.avalonDiv = document.createElement('div')
	    browser.avalonFragment = document.createDocumentFragment()
	    if (window.VBArray) {
	        browser.msie = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
	    }
	}

	browser.nextTick = (function () {// jshint ignore:line
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
	        var node = document.createTextNode('avalon')
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

	module.exports = browser
	/* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 5 */,
/* 6 */
/***/ function(module, exports) {

	var cssHooks = {}
	var rhyphen = /([a-z\d])([A-Z]+)/g
	var rcamelize = /[-_][^-_]/g
	var rhashcode = /\d\.\d{4}/
	var rescape = /[-.*+?^${}()|[\]\/\\]/g


	avalon.mix({
	    caches: {}, //avalon2.0 新增
	    vmodels: {},
	    filters: {},
	    components: {},
	    directives: {},
	    eventHooks: {},
	    cssHooks: cssHooks,
	    version: 2.0,
	    css: function (node, name, value, fn) {
	        //读写删除元素节点的样式
	        if (node instanceof avalon) {
	            node = node[0]
	        }
	        var prop = avalon.camelize(name) 
	        name = avalon.cssName(prop) || prop
	        if (value === void 0 || typeof value === 'boolean') { //获取样式
	            fn = cssHooks[prop + ':get'] || cssHooks['@:get']
	            if (name === 'background') {
	                name = 'backgroundColor'
	            }
	            var val = fn(node, name)
	            return value === true ? parseFloat(val) || 0 : val
	        } else if (value === '') { //请除样式
	            node.style[name] = ''
	        } else { //设置样式
	            if (value == null || value !== value) {
	                return
	            }
	            if (isFinite(value) && !avalon.cssNumber[prop]) {
	                value += 'px'
	            }
	            fn = cssHooks[prop + ':set'] || cssHooks['@:set']
	            fn(node, name, value)
	        }
	    },
	    directive: function (name, definition) {
	        return this.directives[name] = definition
	    },
	    isObject: function (a) {//1.6新增
	        return a !== null && typeof a === 'object'
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
	    hyphen: function (target) {
	        //转换为连字符线风格
	        return target.replace(rhyphen, '$1-$2').toLowerCase()
	    },
	    camelize: function (target) {
	        //提前判断，提高getStyle等的效率
	        if (!target || target.indexOf('-') < 0 && target.indexOf('_') < 0) {
	            return target
	        }
	        //转换为驼峰风格
	        return target.replace(rcamelize, function (match) {
	            return match.charAt(1).toUpperCase()
	        })
	    },
	    //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
	    makeHashCode: function (prefix) {
	        prefix = prefix || 'avalon'
	        return String(Math.random() + Math.random()).replace(rhashcode, prefix)
	    },
	    escapeRegExp: function (target) {
	        //http://stevenlevithan.com/regex/xregexp/
	        //将字符串安全格式化为正则表达式的源码
	        return (target + '').replace(rescape, '\\$&')
	    },
	    Array: {
	        merge: function (target, other) {
	            //合并两个数组 avalon2新增
	            target.push.apply(target, other)
	        },
	        ensure: function (target, item) {
	            //只有当前数组不存在此元素时只添加它
	            if (target.indexOf(item) === -1) {
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
	    }
	})

	var uuid = 1
	module.exports = {
	    //生成事件回调的UUID(用户通过ms-on指令)
	    avalon: avalon,
	    getLongID: function (fn) {
	        return fn.uuid || (fn.uuid = avalon.makeHashCode('e'))
	    },
	    //生成事件回调的UUID(用户通过avalon.bind)
	    getShortID: function (fn) {
	        return fn.uuid || (fn.uuid = '_' + (++uuid))
	    }
	}


/***/ },
/* 7 */
/***/ function(module, exports) {

	
	function kernel(settings) {
	    for (var p in settings) {
	        if (!avalon.ohasOwn.call(settings, p))
	            continue
	        var val = settings[p]
	        if (typeof kernel.plugins[p] === 'function') {
	            kernel.plugins[p](val)
	        } else if (typeof kernel[p] === 'object') {
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
	            throw new SyntaxError('openTag!==closeTag')
	            var test = openTag + 'test' + closeTag
	            var div = avalon.avalonDiv
	            div.innerHTML = test

	            if (div.innerHTML !== test && div.innerHTML.indexOf('&lt;') > -1) {
	                throw new SyntaxError('此定界符不合法')
	            }
	            div.innerHTML = ''
	        }
	        kernel.openTag = openTag
	        kernel.closeTag = closeTag
	        var o = avalon.escapeRegExp(openTag)
	        var c = avalon.escapeRegExp(closeTag)
	        kernel.rexpr = new RegExp(o + '([\\ss\\S]*)' + c)
	        kernel.rexprg = new RegExp(o + '([\\ss\\S]*)' + c, 'g')
	        kernel.rbind = new RegExp(o + '[\\ss\\S]*' + c + '|\\b(?:ms|av)-')
	    }
	}
	kernel.plugins = plugins
	kernel.plugins['interpolate'](['{{', '}}'])

	kernel.debug = true





/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

	
	var number = __webpack_require__(9)
	var escape = __webpack_require__(10)
	var sanitize = __webpack_require__(11)
	var date = __webpack_require__(12)
	var arrayFilters = __webpack_require__(13)
	var eventFilters = __webpack_require__(14)
	var filters = avalon.filters

	function K(a) {
	    return a
	}

	avalon.mix({
	    __read__: function (name) {
	        var fn = filters[name]
	        if (fn) {
	            return fn.get ? fn.get : fn
	        }
	        return K
	    },
	    __write__: function (name) {
	        var fn = filters[name]
	        return fn && fn.set || K
	    }
	})


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
	    camelize: avalon.camelize,
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

	avalon.mix(filters, {
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

	module.exports = avalon

/***/ },
/* 9 */
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
/* 10 */
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
/* 11 */
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
/* 12 */
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
/* 13 */
/***/ function(module, exports) {

	
	function orderBy(array, criteria, reverse) {
	    var type = avalon.type(array)
	    if (type !== 'array' || type !== 'object')
	        throw 'orderBy只能处理对象或数组'
	    var order = (reverse && reverse < 0) ? -1 : 1

	    if (typeof criteria === 'string') {
	        var key = criteria
	        criteria = function (a) {
	            return a && a[key]
	        }
	    }
	    array = convertArray(array)
	    array.forEach(function (el) {
	        el.order = criteria(el.value, el.key)
	    })
	    array.sort(function (left, right) {
	        var a = left.order
	        var b = right.order
	        return a === b ? 0 : a > b ? order : -order
	    })
	    var isArray = type === 'array'
	    var target = isArray ? [] : {}
	    return makeData(target, array, function (el) {
	        if (isArray) {
	            target.push(el.value)
	        } else {
	            target[el.key] = el.value
	        }
	    })
	}
	function filterBy(array, search) {

	    var type = avalon.type(array)

	    if (type !== 'array' && type !== 'object')
	        throw 'filterBy只能处理对象或数组'
	    var args = avalon.slice(arguments, 2)
	    if (typeof search === 'function') {
	        var criteria = search
	    } else if (typeof search === 'string') {
	        args.unshift(new RegExp(avalon.escapeRegExp(search), 'i'))
	        criteria = containKey
	    } else {
	        throw search + '必须是字符串或函数'
	    }

	    array = convertArray(array).filter(function (el) {
	         return !!criteria.apply(el, [el.value].concat(args))
	    })
	    var isArray = type === 'array'
	    var target = isArray ? [] : {}
	    return makeData(target, array, function (el) {
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
	        return makeData(target, array, function (name) {
	            target.push(data.hasOwnProperty(name) ? data[name] : '')
	        })
	    } else {
	        throw 'selectBy只支持对象'
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
	    if (Number.isNaN(limit))
	        return input

	    if (typeof input === 'number')
	        input = input + ''
	    if ((!Array.isArray(input)) && (typeof input !== 'string'))
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

	    return makeData(input, [])
	}

	function makeData(ret, array, callback) {
	    for (var i = 0, n = array.length; i < n; i++) {
	        callback(array[i])
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
/* 14 */
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
/* 15 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * 虚拟DOM的4大构造器
	 */
	var VText = __webpack_require__(16)
	var VElement = __webpack_require__(17)
	var VComment = __webpack_require__(18)
	var VComponent = __webpack_require__(19)
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
/* 16 */
/***/ function(module, exports) {

	var rexpr = avalon.config.rexpr

	function VText(text) {
	    if (typeof text === 'string') {
	        this.type = '#text'
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
	    toDOM: function () {
	        return document.createTextNode(this.nodeValue)
	    },
	    toHTML: function () {
	        return this.nodeValue
	    }
	}

	module.exports = VText

/***/ },
/* 17 */
/***/ function(module, exports) {

	
	function VElement(type, props, children) {
	    if (typeof type === 'object') {
	        for (var i in type) {
	            this[i] = type[i]
	        }
	    } else {
	        this.type = type
	        this.props = props
	        this.children = children
	        this.template = ''
	    }
	}
	function skipFalseAndFunction(a) {
	    return a !== false && typeof a !== 'function'
	}
	VElement.prototype = {
	    constructor: VElement,
	    toDOM: function () {
	        var dom = document.createElement(this.type)
	        for (var i in this.props) {
	            var val = this.props[i]
	            if (skipFalseAndFunction(val)) {
	                dom.setAttribute(i, val + '')
	            }
	        }
	        if (this.skipContent) {
	            switch (this.type) {
	                case 'script':
	                    dom.text = this.template
	                    break
	                case 'style':
	                case 'template':
	                    dom.innerHTML = this.template
	                    break
	                case 'noscript':
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
	            var val = this.props[i]
	            if (skipFalseAndFunction(val)) {
	                arr.push(i + '=' + avalon.quote(this.props[i] + ''))
	            }
	        }
	        arr = arr.length ? ' ' + arr.join(' ') : ''
	        var str = '<' + this.type + arr
	        if (this.isVoidTag) {
	            return str + '/>'
	        }
	        str += '>'
	        if (this.children.length) {
	            str += this.children.map(function (c) {
	                return avalon.vdomAdaptor(c).toHTML()
	            }).join('')
	        } else {
	            str += this.template
	        }
	        return str + '</' + this.type + '>'
	    }
	}

	module.exports = VElement

/***/ },
/* 18 */
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
/* 19 */
/***/ function(module, exports) {

	
	function VComponent(config) {
	    for (var i in config) {
	        this[i] = config[i]
	    }
	    var type = this.__type__ = this.type 
	    
	    this.type = '#component'
	    var me = avalon.components[type]
	    if (me && me.init && arguments.length) {
	        me.init.apply(this, arguments)
	    }
	}

	VComponent.prototype = {
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
	        var ret = ''
	        for (var i = 0; i < this.children.length; i++) {
	            ret += this.children[i].toHTML()
	        }
	        return ret
	    }
	}


	module.exports = VComponent

/***/ },
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */,
/* 25 */,
/* 26 */,
/* 27 */
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
/* 28 */
/***/ function(module, exports) {

	
	var scriptNode = avalon.document.createElement('script')
	var scriptTypes = avalon.oneObject(['', 'text/javascript', 'text/ecmascript',
	    'application/ecmascript', 'application/javascript'])

	function fixScript(wrapper) {
	    var els = wrapper.getElementsByTagName('script')
	    if (els.length) {
	        for (var i = 0, el; el = els[i++]; ) {
	            if (scriptTypes[el.type]) {
	                //以偷龙转凤方式恢复执行脚本功能
	                var neo = scriptNode.cloneNode(false) //FF不能省略参数
	                Array.prototype.forEach.call(el.attributes, function (attr) {
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
	}

	module.exports = fixScript


/***/ },
/* 29 */,
/* 30 */
/***/ function(module, exports) {

	function isVML(src) {
	    var nodeName = src.nodeName
	    return nodeName.toLowerCase() === nodeName && src.scopeName && src.outerText === ''
	}

	module.exports = isVML

/***/ },
/* 31 */,
/* 32 */,
/* 33 */,
/* 34 */,
/* 35 */
/***/ function(module, exports, __webpack_require__) {

	
	var attrUpdate = __webpack_require__(36)

	var attrDir = avalon.directive("attr", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-attr'] = " + avalon.parseExpr(binding) + ";\n"
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



/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

	
	var propMap = __webpack_require__(37)
	var isVML = __webpack_require__(30)
	var rsvg =/^\[object SVG\w*Element\]$/
	var ramp = /&amp;/g

	function attrUpdate(node, vnode) {
	    var attrs = vnode.changeAttr
	    if (!node || node.nodeType !== 1 || vnode.disposed) {
	        return
	    }
	    if (attrs) {
	        for (var attrName in attrs) {
	            var val = attrs[attrName]
	            // switch
	            if (attrName === 'href' || attrName === 'src') {
	                if (!node.hasAttribute) {
	                    val = String(val).replace(ramp, '&') //处理IE67自动转义的问题
	                }
	                node[attrName] = val
	                if (window.chrome && node.tagName === 'EMBED') {
	                    var parent = node.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
	                    var comment = document.createComment('ms-src')
	                    parent.replaceChild(comment, node)
	                    parent.replaceChild(node, comment)
	                }
	            } else if (attrName.indexOf('data-') === 0) {
	                node.setAttribute(attrName, val)

	            } else {
	                var propName = propMap[attrName] || attrName
	                if (typeof node[propName] === 'boolean') {
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
	                    node[propName] = val + ''
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
/* 37 */
/***/ function(module, exports) {

	var bools = ['autofocus,autoplay,async,allowTransparency,checked,controls',
	    'declare,disabled,defer,defaultChecked,defaultSelected,',
	    'isMap,loop,multiple,noHref,noResize,noShade',
	    'open,readOnly,selected'
	].join(',')

	var propMap = {//不规则的属性名映射
	    'accept-charset': 'acceptCharset',
	    'char': 'ch',
	    charoff: 'chOff',
	    'class': 'className',
	    'for': 'htmlFor',
	    'http-equiv': 'httpEquiv'
	}
	/*
	contenteditable不是布尔属性
	http://www.zhangxinxu.com/wordpress/2016/01/contenteditable-plaintext-only/
	contenteditable=''
	contenteditable='events'
	contenteditable='caret'
	contenteditable='plaintext-only'
	contenteditable='true'
	contenteditable='false'
	 */
	bools.replace(/\w+/g, function (name) {
	    propMap[name.toLowerCase()] = name
	})


	var anomaly = ['accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan',
	    'dateTime,defaultValue,contentEditable,frameBorder,longDesc,maxLength,marginWidth,marginHeight',
	    'rowSpan,tabIndex,useMap,vSpace,valueType,vAlign'
	].join(',')
	anomaly.replace(/\w+/g, function (name) {
	    propMap[name.toLowerCase()] = name
	})

	module.exports = propMap


/***/ },
/* 38 */
/***/ function(module, exports) {

	
	avalon.directive("cloak", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-cloak'] = false\n"
	    },
	    diff: function (cur, pre, type, name) {//curNode, preNode
	        if (cur.props[name] !== pre.props[name]) {
	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (node) {
	        node.removeAttribute("av-cloak")
	        node.removeAttribute("ms-cloak")
	        avalon(node).removeClass("av-cloak ms-cloak")
	    }
	})

/***/ },
/* 39 */
/***/ function(module, exports) {

	

	avalon.directive("style", {
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-style'] = " + avalon.parseExpr(binding) + ";\n"
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
/* 40 */
/***/ function(module, exports) {

	
	avalon.directive("controller", {
	    priority: 1,
	    parse: function (binding, num) {
	        var vm = "vm" + num
	        var isObject = /\{.+\}/.test(binding.expr)
	        var a = "\n\n\nvar " + vm + " =  avalon.vmodels[" + avalon.quote(binding.expr) + "]\n"
	        var b = "\n\n\nvar " + vm + " = " + binding.expr + "\n"
	        var str = (isObject ? b : a) +
	                "if(" + vm + "){\n" +
	                "\tif(__vmodel__){\n" +
	                "\t\t__vmodel__ = avalon.mediatorFactory(__vmodel__, " + vm + ")\n" +
	                "\t}else{\n" +
	                "\t\t__vmodel__ = " + vm + "\n" +
	                "\t}\n" +
	                "}\n\n\n"
	        return str
	    },
	    diff: avalon.noop,
	    update:avalon.noop
	})

	//avalon.scan = function (el) {
	//    var v = el.getAttribute("ms-controller") || el.getAttribute("av-controller")
	//    if (v) {
	//        el.removeAttribute("ms-controller")
	//        el.removeAttribute("av-controller")
	//        el.setAttribute("data-controller", v)
	//        avalon(el).removeClass("ms-controller av-controller")
	//    }
	//    if (!v) {
	//        v = el.getAttribute("data-controller")
	//    }
	//    if (v) {
	//        if (typeof el.getAttribute(":template") !== "string") {
	//            el.setAttribute(":template", el.outerHTML)
	//        } else {
	//
	//        }
	//    }
	//    for (var i = 0, child; child = el.childNodes[i++]; ) {
	//        if (child.nodeType === 1) {
	//            avalon.scan(child)
	//        }
	//    }
	//}


/***/ },
/* 41 */
/***/ function(module, exports) {

	
	avalon.directive('expr', {
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
/* 42 */
/***/ function(module, exports, __webpack_require__) {

	var Cache = __webpack_require__(27)
	var textCache = new Cache(256)
	var rexpr = avalon.config.rexpr

	avalon.directive('text', {
	    parse: function (binding, num) {
	        return 'vnode' + num + '.textVm = __vmodel__\n' +
	                'vnode' + num + '.props.wid = 2;\n' +
	                'vnode' + num + '.props["av-text"] =' + avalon.parseExpr(binding) + ';\n'
	    },
	    diff: function (cur, pre) {
	        var curValue = cur.props['av-text']
	        var preValue = pre.props['av-text']
	        if (curValue !== preValue) {
	            var nodes = textCache.get(curValue)
	            if (!Array.isArray(nodes)) {
	                var hasExpr = rexpr.test(curValue)
	                if (hasExpr) {
	                    var child = [{type: '#text', nodeValue: curValue}]
	                    var render = avalon.render(child)
	                    nodes = render(cur.textVm)
	                    cur.props['av-text'] = nodes[0].nodeValue
	                }
	                textCache.put(curValue, nodes)
	            }
	            cur.children = nodes
	            if (cur.props['av-text'] !== preValue) {
	                var list = cur.change || (cur.change = [])
	                avalon.Array.ensure(list, this.update)
	            }
	        }
	    },
	    update: function (node, vnode) {
	        var nodeValue = vnode.props['av-text']
	        if ('textContent' in node) {
	            node.textContent = nodeValue + ''
	        } else {
	            node.innerText = nodeValue + ''
	        }
	    }
	})

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

	var Cache = __webpack_require__(27)
	var textCache = new Cache(128)

	avalon.directive('html', {
	    parse: function (binding, num) {
	        return 'vnode' + num + '.htmlVm = __vmodel__\n' +
	                'vnode' + num + '.props.wid = 2;\n' +
	                'vnode' + num + '.props["av-html"] =' + avalon.parseExpr(binding) + ';\n'
	    },
	    diff: function (cur, pre) {
	        var curValue = cur.props['av-html']
	        var preValue = pre.props['av-html']
	        if (curValue !== preValue) {
	            var nodes = textCache.get(curValue)
	            if (!Array.isArray(nodes)) {
	                var child = avalon.lexer(curValue)
	                var render = avalon.render(child)
	                nodes = render(cur.htmlVm)
	                cur.props['av-html'] = nodes.map(function (el) {
	                    return 'template' in el ? el.template : el.nodeValue
	                })
	                textCache.put(curValue, nodes)
	            }
	            cur.children = nodes
	            if (cur.props['av-html'] !== preValue) {
	                var list = cur.change || (cur.change = [])
	                avalon.Array.ensure(list, this.update)
	            }
	        }
	    },
	    update: function (node, vnode) {
	        if (node.querySelectorAll) {
	            var nodes = node.querySelectorAll("[avalon-events]")
	            avalon.each(nodes, function (el) {
	                avalon.unbind(el)
	            })
	        } else {
	            var nodes = node.getElementsByTagName("*")
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
/* 44 */
/***/ function(module, exports) {

	

	function parseDisplay(nodeName, val) {
	    //用于取得此类标签的默认display值
	    var key = "_" + nodeName
	    if (!parseDisplay[key]) {
	        var node = document.createElement(nodeName)
	        avalon.root.appendChild(node)
	        if (avalon.modern) {
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
	        return "vnode" + num + ".props['av-visible'] = " + avalon.parseExpr(binding) + ";\n"
	    },
	    diff: function (cur, pre) {
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
/* 45 */
/***/ function(module, exports, __webpack_require__) {

	//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
	//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
	var markID = __webpack_require__(6).getLongID

	var directives = avalon.directives
	avalon.directive("class", {
	    parse: function (binding, num) {
	        //必须是布尔对象或字符串数组
	        return "vnode" + num + ".props['" + binding.name + "'] = " + avalon.parseExpr(binding) + ";\n"
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
/* 46 */
/***/ function(module, exports, __webpack_require__) {

	var markID = __webpack_require__(6).getLongID

	var quote = avalon.quote

	//基于事件代理的高性能事件绑定
	var revent = /^av-on-(\w+)/
	var rfilters = /\|.+/g
	var rvar = /([@$]?\w+)/g
	var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
	avalon.directive("on", {
	    priority: 3000,
	    parse: function (binding, num) {
	        var vars = binding.expr.replace(rstring," ").replace(rfilters, "").match(rvar)
	        var canCache = vars.every(function (el) {
	            return el.charAt(0) === "@" || el === "$event"
	        })
	        var vmDefine = "vnode" + num + ".onVm = __vmodel__\n"
	        var pid = quote(binding.name)
	        if (canCache) {
	            var fn = Function("return " + avalon.parseExpr(binding, "on"))()
	            var key = "on:" + binding.expr
	            avalon.caches[key] = fn
	            return vmDefine + "vnode" + num + ".props[" + pid +
	                    "] = avalon.caches[" + quote(key) + "]\n"
	        } else {
	            return vmDefine + "vnode" + num + ".props[" + pid +
	                    "] = " + avalon.parseExpr(binding, "on") + "\n"
	        }
	    },
	    diff: function (cur, pre, type, name) {
	        var fn0 = cur.props[name]
	        var fn1 = pre.props[name]
	        if (fn0 !== fn1) {
	            var match = name.match(revent)
	            type = match[1]

	            var search = type + ":" + markID(fn0)
	            cur.addEvents = cur.addEvents || {}
	            cur.addEvents[search] = fn0

	            if (typeof fn1 === "function") {
	                cur.removeEvents = cur.removeEvents || {}
	                cur.removeEvents[type + ":" + fn1.uuid] = fn1
	            }

	            if (!avalon.__eventVM__[search]) {//注册事件回调
	                avalon.__eventVM__[search] = cur.onVm
	            }
	            delete cur.onVm

	            var list = cur.change || (cur.change = [])
	            avalon.Array.ensure(list, this.update)
	        }
	    },
	    update: function (node, vnode) {
	        var key, type, listener
	        for (key in vnode.removeEvents) {
	            type = key.split(":").shift()
	            listener = vnode.removeEvents[key]
	            avalon.unbind(node, type, listener)
	        }
	        delete vnode.removeEvents
	        for (key in vnode.addEvents) {
	            type = key.split(":").shift()
	            listener = vnode.addEvents[key]
	            avalon.bind(node, type, listener)
	        }
	        delete vnode.addEvents
	    }
	})






/***/ },
/* 47 */,
/* 48 */
/***/ function(module, exports, __webpack_require__) {

	
	var Cache = __webpack_require__(27)
	//缓存求值函数，以便多次利用
	module.exports = new Cache(512)


/***/ },
/* 49 */
/***/ function(module, exports) {

	

	avalon.directive("if", {
	    priority: 5,
	    parse: function (binding, num) {
	        return "vnode" + num + ".props['av-if'] = " + avalon.quote(binding) + ";\n"
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
	                var a = avalon.makeHashCode("if")
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
/* 50 */
/***/ function(module, exports, __webpack_require__) {

	
	var updateEntity = __webpack_require__(51)

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
	var rforPrefix = /av-for\:\s*/
	var rforLeft = /^\s*\(\s*/
	var rforRight = /\s*\)\s*$/
	var rforSplit = /\s*,\s*/
	avalon.directive("for", {
	    parse: function (str, num) {
	        var arr = str.replace(rforPrefix, "").split(" in ")
	        var def = "var loop" + num + " = " + avalon.parseExpr(arr[1]) + "\n"
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
	                    avalon.diff(p.children, c.children)
	                }
	            }
	            //这是新添加的元素
	            for (var i in cache) {
	                p = cache[i]
	                indexes[p.index + "_"] = p
	                avalon.diff(p.children, [])
	            }
	            cur.indexes = indexes
	        }

	        var list = cur.change || (cur.change = [])
	        avalon.Array.ensure(list, this.update)
	        return i + curLoop.length - 1

	    },
	    update: function (startRepeat, vnode, parent) {

	        var repeatVnodes = vnode.repeatVnodes
	        var nodes = vnode.repeatNodes
	        var action = vnode.action
	        var endRepeat = nodes[nodes.length - 1]
	        var vnodes = repeatVnodes.slice(1, -1)

	        if (action === "replace") {
	            var node = startRepeat.nextSibling
	            while (node !== endRepeat) {
	                parent.removeChild(node)
	                node = startRepeat.nextSibling
	            }
	            var fragment = document.createDocumentFragment()
	            vnodes.forEach(function (c) {
	                fragment.appendChild(avalon.vdomAdaptor(c).toDOM())
	            })

	            var entity = avalon.slice(fragment.childNodes)
	            avalon.diff(vnodes, [])
	            parent.insertBefore(fragment, endRepeat)
	            updateEntity(entity, vnodes, parent)
	        } else {
	            var groupText = vnode.signature
	            var indexes = vnode.indexes
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
	                        fragments.push(fragment)//?
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
	                sortedFragments[ i ] = componentToDom(com, emptyFragment.cloneNode(false))
	            }

	            for (i = 0, el; el = sortedFragments[i++]; ) {
	                emptyFragment.appendChild(el)
	            }

	            var entity = avalon.slice(emptyFragment.childNodes)
	            parent.insertBefore(emptyFragment, endRepeat)
	            updateEntity(entity, vnodes, parent)
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
	}

	//从一组节点,取得要循环的部分(第二次生成的虚拟DOM树会走这分支)
	function getForBySignature(nodes, i) {
	    var start = nodes[i], node
	    var endText = start.signature + ":end"
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
/* 51 */
/***/ function(module, exports) {

	/**
	 * ------------------------------------------------------------
	 * patch 对某一个视图根据对应的虚拟DOM树进行全量更新
	 * ------------------------------------------------------------
	 */

	function patch(nodes, vnodes, parent) {
	    var next = nodes[0]
	    if (!next && !parent)
	        return
	    parent = parent || next.parentNode
	    for (var i = 0, vn = vnodes.length; i < vn; i++) {
	        var vnode = vnodes[i]
	        var node = next
	        if (node)
	            next = node.nextSibling

	        if (vnode.directive === "for" && vnode.change) {
	            if (node.nodeType === 1) {
	                var startRepeat = document.createComment(vnode.nodeValue)
	                parent.insertBefore(startRepeat, node)
	                parent.insertBefore(document.createComment("av-for-end:"), node.nextSibling)
	                node = startRepeat
	            }
	            var repeatNodes = [node], cur = node
	            innerLoop:
	                    while (cur && (cur = cur.nextSibling)) {
	                repeatNodes.push(cur)
	                if ((cur.nodeValue || "").indexOf("av-for-end:") === 0) {
	                    next = cur.nextSibling
	                    break innerLoop
	                }
	            }
	            vnode.repeatNodes = repeatNodes
	        }

	        //ms-repeat,ms-if, ms-widget会返回false
	        if (false === execHooks(node, vnode, parent, "change")) {
	            execHooks(node, vnode, parent, "afterChange")
	            continue
	        }

	        if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
	            //处理子节点
	            patch(avalon.slice(node.childNodes), vnode.children, node)
	        }
	        //ms-duplex
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

	module.exports = patch

/***/ },
/* 52 */,
/* 53 */
/***/ function(module, exports, __webpack_require__) {

	
	avalon.lexer = __webpack_require__(54)
	avalon.diff = __webpack_require__(55)
	avalon.batch = __webpack_require__(56)
	// dispatch与patch 为内置模块

	var parseView = __webpack_require__(57)

	function render(vtree) {
	    var num = num || String(new Date - 0).slice(0, 6)
	    var body = parseView(vtree, num) + '\n\nreturn nodes' + num
	    var fn = Function('__vmodel__', body)
	    return fn
	}
	avalon.render = render

	module.exports = avalon


/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

	/**
	 * ------------------------------------------------------------
	 * lexer 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
	 * 此阶段只会生成VElement,VText,VComment
	 * ------------------------------------------------------------
	 */

	var makeHashCode = avalon.makeHashCode
	var vdom = __webpack_require__(15)
	var VText = vdom.VText
	var VComment = vdom.VComment
	var VElement = vdom.VElement


	//匹配只有开标签的无内容元素（Void elements 或 self-contained tags）
	//http://www.colorglare.com/2014/02/03/to-close-or-not-to-close.html
	//http://blog.jobbole.com/61514/

	var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
	var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/


	var rtext = /^[^<]+/
	var rcomment = /^<!--([\w\W]*?)-->/
	var rstring =/(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
	var rfill = /\?\?\d+/g

	var rnumber = /\d+/g
	var rsp = /^\s+$/
	var rspAfterForStart = /^(ms|av)-for\:/
	var rspBeforeForEnd = /^(ms|av)-for-end\:/
	var rleftTrim = /^\s+/
	var rbind = avalon.config.rbind


	var maps = {}
	var number = 1
	function dig(a) {
	    var key = '??' + number++
	    maps[key] = a
	    return key
	}
	function fill(a) {
	    var val = maps[a]
	    return val
	}


	function lexer(text, recursive) {
	    var nodes = []
	    if (recursive && !rbind.test(text)) {
	        return nodes
	    }
	    if (!recursive) {
	        text = text.replace(rstring, dig)
	    }
	    do {
	        var outerHTML = ''
	        var node = false
	        var match = text.match(rtext)
	        if (match) {//尝试匹配文本
	            outerHTML = match[0]
	            node = new VText(outerHTML.replace(rfill, fill))
	        }

	        if (!node) {//尝试匹配注释
	            match = text.match(rcomment)
	            if (match) {
	                outerHTML = match[0]
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
	                outerHTML = match[0]//贪婪匹配 outerHTML,可能匹配过多
	                var type = match[1].toLowerCase()//nodeName

	                outerHTML = clipOuterHTML(outerHTML, type)

	                match = outerHTML.match(rvoidTag) //抽取所有属性

	                var props = {}
	                if (match[2]) {
	                    handleProps(match[2], props)
	                }

	                var innerHTML = outerHTML.slice(match[0].length,
	                        (type.length + 3) * -1) //抽取innerHTML

	                node = {
	                    type: type,
	                    props: props,
	                    template: innerHTML.replace(rfill, fill).trim(),
	                    children: []
	                }
	                node = modifyProps(node, innerHTML, nodes)
	            }
	        }

	        if (!node) {
	            match = text.match(rvoidTag)
	            if (match) {//尝试匹配自闭合标签
	                outerHTML = match[0]
	                type = match[1].toLowerCase()
	                props = {}
	                if (match[2]) {
	                    handleProps(match[2], props)
	                }
	                node = {
	                    type: type,
	                    props: props,
	                    template: '',
	                    children: [],
	                    isVoidTag: true
	                }
	                if (type === 'input' && !node.props.type) {
	                    node.props.type = 'text'
	                }

	            }
	        }

	        if (node) {//从text中移除被匹配的部分
	            nodes.push(node)
	            text = text.slice(outerHTML.length)
	            if (node.type === '#comment' && rspAfterForStart.test(node.nodeValue)) {
	                node.signature = makeHashCode('for')
	                //移除紧挨着<!--av-for:xxxx-->后的空白节点
	                text = text.replace(rleftTrim, '')
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

	//用于创建适配某一种标签的正则表达式
	var openStr = '(?:\\s+[^>=]*?(?:=[^>]+?)?)*>'
	var tagCache = {}// 缓存所有匹配开标签闭标签的正则
	var rchar = /./g
	function clipOuterHTML(matchText, type) {
	    var opens = []
	    var closes = []
	    var ropen = tagCache[type + 'open'] ||
	            (tagCache[type + 'open'] = new RegExp('<' + type + openStr, 'g'))
	    var rclose = tagCache[type + 'close'] ||
	            (tagCache[type + 'close'] = new RegExp('<\/' + type + '>', 'g'))
	    /* jshint ignore:start */
	    matchText.replace(ropen, function (_, b) {
	        //注意,页面有时很长,b的数值就很大,如
	        //000000000<000000011>000000041<000000066>000000096<000000107>
	        opens.push(('0000000000' + b + '<').slice(-10))//取得所有开标签的位置
	        return _.replace(rchar, '1')
	    }).replace(rclose, function (_, b) {
	        closes.push(('0000000000' + b + '>').slice(-10))//取得所有闭标签的位置               
	    })

	    /* jshint ignore:end */
	    //<div><div>01</div><div>02</div></div><div>222</div><div>333</div>
	    //会变成000<005<012>018<025>031>037<045>051<059>
	    //再变成<<><>><><>
	    //最后获取正确的>的索引值,这里为<<><>>的最后一个字符,
	    var pos = opens.concat(closes).sort()
	    var gtlt = pos.join('').replace(rnumber, '')
	    var k = 0, last = 0

	    for (var i = 0, n = gtlt.length; i < n; i++) {
	        var c = gtlt.charAt(i)
	        if (c === '<') {
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
	    return  matchText.slice(0, findex) //取得正确的outerHTML
	}


	function modifyProps(node, innerHTML, nodes) {
	    var type = node.type
	    if (node.props['av-skip']) {
	        node.skipContent = true
	    } else {
	        switch (type) {
	            case 'style':
	            case 'script':
	            case 'noscript':
	            case 'template':
	            case 'textarea':
	                node.skipContent = true
	                if (type === 'textarea') {
	                    node.props.type = 'textarea'
	                }
	                break
	            case 'xmp':
	                node.children.push(new VText(node.template))
	                break
	            case 'option':
	                node.children.push(new VText(trimHTML(node.template)))
	                break
	            default:
	                var childs = lexer(innerHTML, true)
	                if (childs.length) {
	                    avalon.Array.merge(node.children, childs)
	                }
	                break
	        }
	        var forExpr = node.props['ms-for'] || node.props['av-for']
	        if (forExpr) {
	            nodes.push({
	                type: '#comment',
	                nodeValue: 'av-for:' + forExpr,
	                signature: makeHashCode('for')
	            })
	            delete node.props['ms-for']
	            delete node.props['av-for']
	            nodes.push(node)
	            node = {
	                type: '#comment',
	                nodeValue: 'av-for-end:'
	            }
	        }
	    }
	    return node
	}


	var ramp = /&amp;/g
	var rnowhite = /\S+/g
	var rquote = /&quot;/g
	var rnogutter = /\s*=\s*/g
	function handleProps(str, props) {
	    str.replace(rnogutter, '=').replace(rnowhite, function (el) {
	        var arr = el.split('='), value = arr[1] || '',
	                name = arr[0].toLowerCase()
	        if (arr.length === 2) {
	            if (value.indexOf('??') === 0) {
	                value = value.replace(rfill, fill).
	                        slice(1, -1).
	                        replace(ramp, '&').
	                        replace(rquote, '"')
	            }
	        }
	        props[name] = value
	    })
	}

	//form prototype.js
	var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
	function trimHTML(v) {
	    return String(v).replace(rtrimHTML, '').trim()
	}


	module.exports = lexer

/***/ },
/* 55 */
/***/ function(module, exports) {

	/**
	 * ------------------------------------------------------------
	 * diff 对比新旧两个虚拟DOM树,根据directive中的diff方法为新虚拟DOM树
	 * 添加change, afterChange更新钩子
	 * ------------------------------------------------------------
	 */

	var rbinding = /^(?:ms|av)-(\w+)-?(.*)/
	var directives = avalon.directives

	var emptyArr = []
	var emptyObj = {
	    children: [], props: {}
	}

	function diff(current, previous) {
	    for (var i = 0; i < current.length; i++) {
	        var cur = current[i]
	        var pre = previous[i] || emptyObj
	        switch (cur.type) {
	            case '#text':
	                if (!cur.skipContent) {
	                    directives.expr.diff(cur, pre)
	                }
	                break
	            case '#comment':
	                if (cur.directive === 'for') {
	                    i = directives['for'].diff(current, previous, i)
	                } else if (cur.directive === 'if') {
	                    directives['if'].diff(cur, pre)
	                }
	                break
	            default:
	                if (!cur.skipAttrs) {
	                    diffProps(cur, pre)
	                }
	                if (!cur.skipContent) {
	                    diff(cur.children, pre.children || emptyArr)
	                }
	                break

	        }

	    }
	}

	function diffProps(current, previous) {
	    current.change = current.change || []
	    for (var name in current.props) {
	        var match = name.match(rbinding)
	        if (match) {
	            var type = match[1]
	            try {
	                if (directives[type]) {
	                    directives[type].diff(current, previous || emptyObj, type, name)
	                }
	            } catch (e) {
	                avalon.log(current, previous, e, 'diffProps error')
	            }
	        }
	    }

	}

	module.exports = diff

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

	
	/**
	 * ------------------------------------------------------------
	 * batch 同时对N个视图进行全量更新
	 * ------------------------------------------------------------
	 */

	var patch = __webpack_require__(51)

	//如果正在更新一个子树,那么将它放到
	var dirtyTrees = {}
	var isBatchingUpdates = false
	function batchUpdate(id, immediate) {
	    var vm = avalon.vmodels[id]
	    if (!document.nodeName || !vm || !vm.$render)//如果是在mocha等测试环境中立即返回
	        return

	    dirtyTrees[id] = true
	    if (isBatchingUpdates) {
	        return
	    }

	    var dom = vm.$element || document.getElementById(id)
	    //document.all http://www.w3help.org/zh-cn/causes/BX9002

	    if (dom) {
	        flushUpdate(function () {
	            isBatchingUpdates = true
	            var neo = vm.$render(vm)
	            
	            avalon.diff(neo, dom.vnode || [])
	            patch([dom], neo)
	            
	            dom.vnode = neo
	            
	            avalon.log('rerender', new Date - avalon.rerenderStart)

	            isBatchingUpdates = false
	            delete dirtyTrees[id]
	            for (var i in dirtyTrees) {//更新其他子树
	                batchUpdate(i, true)
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

	module.exports = avalon.batch = batchUpdate


/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

	
	var parseExpr = __webpack_require__(58)
	var parseText = __webpack_require__(59)
	var parseBindings = __webpack_require__(60)
	var rexpr = avalon.config.rexpr
	var quote = avalon.quote
	var makeHashCode = avalon.makeHashCode

	function wrap(a, num) {
	    return '(function(){\n\n' + a + '\n\nreturn nodes' + num + '\n})();\n'
	}

	function parseView(arr, num) {
	    num = num || String(new Date - 0).slice(0, 5)

	    var forstack = []
	    var hasIf = false
	    var children = 'nodes' + num
	    var vnode = 'vnode' + num
	    var str = 'var ' + children + ' = []\n'
	    for (var i = 0; i < arr.length; i++) {
	        var el = arr[i]
	        if (el.type === '#text') {
	            str += 'var ' + vnode + ' = {type:"#text", skipContent:true}\n'
	            var hasExpr = rexpr.test(el.nodeValue)

	            if (hasExpr) {
	                var array = parseText(el.nodeValue, false)
	                if (array.length === 1) {
	                    var a = parseExpr(array[0].expr)
	                } else {
	                    a = array.map(function (el) {
	                        return el.type ? 'String(' + parseExpr(el.expr) + ')' : quote(el.expr)
	                    }).join(' + ')

	                }
	                /* jshint ignore:start */

	                str += vnode + '.nodeValue = String(' + a + ')\n'
	                str += vnode + '.skipContent = false\n'
	            } else {
	                str += vnode + '.nodeValue = ' + quote(el.nodeValue) + '\n'
	            }
	            str += children + '.push(' + vnode + ')\n'

	        } else if (el.type === '#comment') {
	            var nodeValue = el.nodeValue
	            if (nodeValue.indexOf('av-for:') === 0) {
	                var signature = el.signature
	                forstack.push(signature)
	                str += children + '.push({' +
	                        '\n\ttype:"#comment",' +
	                        '\n\tdirective:"for",' +
	                        '\n\tskipContent:false,' +
	                        '\n\tsignature:' + quote(signature) + ',' +
	                        '\n\tnodeValue:' + quote(nodeValue)  +
	                        '\n})\n'
	                str += avalon.directives['for'].parse(nodeValue, num)

	            } else if (nodeValue.indexOf('av-for-end:') === 0) {
	                var signature = forstack[forstack.length - 1]

	                str += children + '.push({' +
	                        '\n\ttype:"#comment",' +
	                        '\n\tskipContent:true,' +
	                        '\n\tnodeValue:' + quote(signature) + ',' +
	                        '\n\tkey:traceKey\n})\n'
	                str += '\n})\n' //结束循环
	                if (forstack.length) {
	                    var signature = forstack[forstack.length - 1]
	                    str += children + '.push({' +
	                            '\n\ttype:"#comment",' +
	                            '\n\tskipContent:true,' +
	                            '\n\tsignature:' + quote(signature) + ',' +
	                            '\n\tnodeValue:' + quote(signature + ':end') + ',' +
	                            '\n})\n'

	                    forstack.pop()
	                }
	            } else if (nodeValue.indexOf('av-js:') === 0) {
	                str += parseExpr(nodeValue.replace('av-js:', ''), 'js') + '\n'
	            } else {
	                str += children + '.push(' + quote(el) + ');;;;\n'
	            }
	            continue
	        } else { //处理元素节点
	            var hasIf = el.props['av-if']
	            if (hasIf) { // 优化处理av-if指令
	                str += 'if(!(' + parseExpr(hasIf, 'if') + ')){\n'
	                str += children + '.push({' +
	                        '\n\ttype: "#comment",' +
	                        '\n\tdirective: "if",' +
	                        '\n\tnodeValue: "<!--av-if:-->",' +
	                        '\n\tprops: {"av-if":true} })\n'
	                str += '\n}else{\n\n'

	            }
	            str += 'var ' + vnode + ' = {' +
	                    '\n\ttype: ' + quote(el.type) + ',' +
	                    '\n\tprops: {},' +
	                    '\n\tchildren: [],' +
	                    '\n\tisVoidTag: ' + !!el.isVoidTag + ',' +
	                    '\n\ttemplate: ""}\n'
	            var hasBindings = parseBindings(el.props, num, el)
	            if (hasBindings) {
	                str += hasBindings
	            }

	            if (el.children.length) {
	                str += 'if(!' + vnode + '.props.wid){\n'
	                str += '\t' + vnode + '.children = ' + wrap(parseView(el.children, num), num) + '\n'
	                str += '}\n'
	            } else {
	                str += vnode + '.template= ' + quote(el.template) + '\n'
	            }
	            str += children + '.push(' + vnode + ')\n'

	            if (hasIf) {
	                str += '}\n'
	                hasIf = false
	            }
	        }

	    }
	    return str
	}

	module.exports = parseView

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

	

	//缓存求值函数，以便多次利用
	var evaluatorPool = __webpack_require__(48)
	var ifStatement = 'if(!__elem__ || __elem__.nodeType !== 1){\n\treturn __value__\n}\n'
	var rexpr = avalon.config.rexpr

	var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
	var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
	var rfill = /\?\?\d+/g
	var brackets = /\(([^)]*)\)/
	var rAt = /(^|[^\w\u00c0-\uFFFF_])(@)(?=\w)/g
	function parseExpr(str, category) {
	    var binding = {}
	    if (typeof str === 'object') {
	        binding = str
	        str = binding.expr
	    }
	    category = category || 'other'
	    var input = str.trim()

	    var cacheStr = evaluatorPool.get(category + ':' + input)

	    if (cacheStr) {
	        return cacheStr
	    }

	    var number = 1
	//相同的表达式生成相同的函数
	    var maps = {}
	    function dig(a) {
	        var key = '??' + number++
	        maps[key] = a
	        return key
	    }

	    function fill(a) {
	        return maps[a]
	    }

	    input = input.replace(rregexp, dig).//移除所有正则
	            replace(rstring, dig).//移除所有字符串
	            replace(/\|\|/g, dig).//移除所有短路与
	            replace(/\s*(\.|\|)\s*/g, '$1').//移除. |两端空白
	            split(/\|(?=\w)/) //分离过滤器

	//还原body
	    var body = input.shift().replace(rfill, fill).trim().replace(rAt, '$1__vmodel__.')
	    if (category === 'js') {
	        return evaluatorPool.put(category + ':' + input, body)
	    }

	//处理表达式的过滤器部分
	    var filters = input.map(function (str) {

	        str = str.replace(rfill, fill).replace(rAt, '$1__vmodel__.') //还原
	        var hasBracket = false
	        str = str.replace(brackets, function (a, b) {
	            hasBracket = true
	            return /\S/.test(b) ?
	                    '(__value__,' + b + ');' :
	                    '(__value__);'
	        })
	        if (!hasBracket) {
	            str += '(__value__);'
	        }
	        str = str.replace(/(\w+)/, 'avalon.__read__("$1")')
	        return '__value__ = ' + str
	    })
	    var ret = []
	    if (category === 'on') {
	        filters = filters.map(function (el) {
	            return el.replace('__value__', '$event')
	        })
	        if (filters.length) {
	            filters.push('if($event.$return){\n\treturn;\n}')
	        }
	        ret = ['function self($event){',
	            'try{',
	            '\tvar __vmodel__ = this;',
	            '\t' + body,
	            '}catch(e){',
	            '\tavalon.log(e, ' + quoteError(str) + ')',
	            '}',
	            '}']
	        filters.unshift(2, 0)
	    } else if (category === 'duplex') {
	        var setterFilters = filters.map(function (str) {
	            str = str.replace('__read__', '__write__')
	            return str.replace(');', ',__elem__);')
	        })
	        //setter
	        var setterBody = [
	            'function (__vmodel__, __value__, __elem__){',
	            'if(!__elem__ || __elem__.nodeType !== 1) ',
	            '\treturn',
	            'try{',
	            '\t' + body + ' = __value__',
	            '}catch(e){',
	            '\tavalon.log(e, ' + quoteError(str) + ')',
	            '}',
	            '}']

	        setterBody.splice(3, 0, setterFilters.join('\n'))
	        var fn = Function('return ' + setterBody.join('\n'))()
	        evaluatorPool.put('duplex:' + str.trim() + ':setter', fn)

	        var getterFilters = filters.map(function (str) {
	            return str.replace(');', ',__elem__);')
	        })
	        var getterBody = [
	            'function (__vmodel__, __value__, __elem__){',
	            'try{',
	            'if(arguments.length === 1)',
	            '\treturn ' + body,
	            'if(!__elem__ || __elem__.nodeType !== 1) return ',
	            'return __value__',
	            '}catch(e){',
	            '\tavalon.log(e, ' + quoteError(str) + ')',
	            '}',
	            '}']
	        getterBody.splice(5, 0, getterFilters.join('\n'))
	        fn = Function('return ' + getterBody.join('\n'))()
	        evaluatorPool.put('duplex:' + str.trim(), fn)
	        return
	    } else {
	        ret = [
	            '(function(){',
	            'try{',
	            'var __value__ = ' + body,
	            'return __value__',
	            '}catch(e){',
	            '\tavalon.log(e, ' + quoteError(str) + ')',
	            '\treturn ""',
	            '}',
	            '})()'
	        ]
	        filters.unshift(3, 0)
	    }

	    ret.splice.apply(ret, filters)
	    cacheStr = ret.join('\n')
	    evaluatorPool.put(category + ':' + input, cacheStr)
	    return cacheStr

	}

	function quoteError(str) {
	    return avalon.quote('parse "' + str + '" fail')
	}

	module.exports = avalon.parseExpr = parseExpr



/***/ },
/* 59 */
/***/ function(module, exports) {

	var rline = /\r?\n/g

	function parseText(str) {
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
	            value = value.replace(/^\s+/,'')
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
	                expr: value.replace(rline, ''),
	                type: '{{}}'
	            })
	        }
	        start = stop + avalon.config.closeTag.length
	    } while (1)
	    value = str.slice(start)

	    if (value.replace(/\s+$/,'')) { //}} 右边的文本
	        tokens.push({
	            expr: value.replace(/\s+$/,'')
	        })
	    }
	    return tokens
	}

	module.exports = parseText


/***/ },
/* 60 */
/***/ function(module, exports) {

	var rnovar = /W/
	var quote = avalon.quote
	var directives = avalon.directives
	var rbinding = /^(?:ms|av)-(\w+)-?(.*)/
	var eventMap = avalon.oneObject('animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit')

	function parseBindings(props, num, elem) {
	    var bindings = []
	    var skip = 'ms-skip' in props || 'av-skip' in props
	    var ret = ''
	    for (var i in props) {
	        var value = props[i], match

	        if (!skip && value && (match = i.match(rbinding))) {

	            var type = match[1]
	            var param = match[2] || ''
	            var name = i

	            if (eventMap[type]) {
	                param = type
	                type = 'on'
	            }
	            name = 'av-' + type + (param ? '-' + param : '')
	            if (i !== name) {
	                delete props[i]
	                props[name] = value
	            }
	            if (directives[type]) {
	                var binding = {
	                    type: type,
	                    param: param,
	                    name: name,
	                    expr: value,
	                    priority: directives[type].priority ||
	                            type.charCodeAt(0) * 100 + (Number(param.replace(/\D/g, '')) || 0)
	                }
	                bindings.push(binding)
	            }
	        } else {
	            if (rnovar.test(i)) {//收集非绑定属性
	                ret += 'vnode' + num + '.props[' + quote(i) + '] = ' + quote(value) + '\n'
	            } else {
	                ret += 'vnode' + num + '.props.' + i + ' = ' + quote(value) + '\n'
	            }
	        }
	    }

	    if (!bindings.length) {
	        ret += 'vnode' + num + '.skipAttrs = true\n'
	    } else {
	        bindings.sort(bindingSorter).forEach(function (binding) {
	            ret += directives[binding.type].parse(binding, num, elem)
	        })
	    }
	    return ret

	}

	function bindingSorter(a, b) {
	    return a.priority - b.priority
	}

	module.exports = parseBindings

/***/ },
/* 61 */,
/* 62 */,
/* 63 */
/***/ function(module, exports, __webpack_require__) {

	
	var dispatch = __webpack_require__(64)
	var $watch = dispatch.$watch
	var $emit = dispatch.$emit
	var $$midway = {}
	var $$skipArray = __webpack_require__(65)


	function makeFire($vmodel, heirloom) {
	    heirloom.__vmodel__ = $vmodel
	    var hide = $$midway.hideProperty

	    hide($vmodel, '$events', heirloom)
	    hide($vmodel, '$watch', function () {
	        if (arguments.length === 2) {
	            return $watch.apply($vmodel, arguments)
	        } else {
	            throw '$watch方法参数不对'
	        }
	    })
	    hide($vmodel, '$fire', function (expr, a, b) {
	        var list = $vmodel.$events[expr]
	        $emit(list, $vmodel, expr, a, b)
	    })
	}

	function isSkip(key, value, skipArray) {
	    // 判定此属性能否转换访问器
	    return key.charAt(0) === '$' ||
	            skipArray[key] ||
	            (typeof value === 'function') ||
	            (value && value.nodeName && value.nodeType > 0)
	}


	function modelAdaptor(definition, old, heirloom, options) {
	    //如果数组转换为监控数组
	    if (Array.isArray(definition)) {
	        return $$midway.arrayFactory(definition, old, heirloom, options)
	    } else if (avalon.isPlainObject(definition)) {
	        //如果此属性原来就是一个VM,拆分里面的访问器属性
	        if (Object(old) === old) {
	            var vm = $$midway.slaveFactory(old, definition, heirloom, options)
	            for (var i in definition) {
	                if ($$skipArray[i])
	                    continue
	                vm[i] = definition[i]
	            }
	            return vm
	        } else {
	            vm = $$midway.masterFactory(definition, heirloom, options)
	            return vm
	        }
	    } else {
	        return definition
	    }
	}

	var rtopsub = /([^.]+)\.(.+)/
	function makeAccessor(sid, spath, heirloom) {
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
	            if (val && typeof val === 'object') {
	                val = $$midway.modelAdaptor(val, old, heirloom, {
	                    pathname: spath,
	                    id: sid
	                })
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
	                if (sid.indexOf('.*.') > 0) {//如果是item vm
	                    var arr = sid.match(rtopsub)
	                    var top = avalon.vmodels[ arr[1] ]
	                    if (top) {
	                        var path = arr[2]
	                        $emit(top.$events[ path ], vm, path, val, older)
	                    }
	                }
	                var vid = vm.$id.split('.')[0]
	                avalon.rerenderStart = new Date
	                avalon.batch(vid, true)
	            }
	        },
	        enumerable: true,
	        configurable: true
	    }
	}


	function define(definition) {
	    var $id = definition.$id
	    if (!$id) {
	        avalon.log('warning: vm.$id must be specified')
	    }
	    var vm = $$midway.masterFactory(definition, {}, {
	        pathname: '',
	        id: $id,
	        master: true
	    })

	    if (avalon.vmodels[$id]) {
	        throw Error('warning:[', $id, '] had defined!')
	    }
	    avalon.vmodels[$id] = vm

	    avalon.ready(function () {
	        var elem = document.getElementById($id)
	        if (!elem)
	            return
	        vm.$element = elem
	        var now = new Date - 0
	        var vnode = avalon.lexer(elem.outerHTML)
	        avalon.log('create primitive vtree', new Date - now)
	        now = new Date
	        vm.$render = avalon.render(vnode)
	        avalon.log('create template Function ', new Date - now)
	        avalon.rerenderStart = new Date
	        elem.vnode = vnode
	        avalon.batch($id)

	    })

	    return vm
	}
	var __array__ = {
	    set: function (index, val) {
	        if (((index >>> 0) === index) && this[index] !== val) {
	            if (index > this.length) {
	                throw Error(index + 'set方法的第一个参数不能大于原数组长度')
	            }
	            this.notify('*', val, this[index], true)
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
	    clear: function () {
	        this.removeAll()
	        return this
	    }
	}
	avalon.define = define

	module.exports = {
	    $$midway: $$midway,
	    $$skipArray: $$skipArray,
	    __array__: __array__,
	    isSkip: isSkip,
	    makeFire: makeFire,
	    makeAccessor: makeAccessor,
	    modelAdaptor: modelAdaptor
	}

/***/ },
/* 64 */
/***/ function(module, exports) {

	/*********************************************************************
	 *                           依赖调度系统                              *
	 **********************************************************************/



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


	function $watch(expr, callback) {
	    var vm = adjustVm(this, expr)
	    var hive = vm.$events
	    var list = hive[expr] || (hive[expr] = [])
	    if (vm !== this) {
	        this.$events[expr] = list
	    }
	    avalon.Array.ensure(list, callback)

	    return function () {
	        avalon.Array.remove(list, callback)
	    }
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
	                var callback = list[i]
	                callback.call(vm, a, b, path)
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
/* 65 */
/***/ function(module, exports) {

	/**
	 * 
	$$skipArray:是系统级通用的不可监听属性
	$skipArray: 是当前对象特有的不可监听属性

	 不同点是
	 $$skipArray被hasOwnProperty后返回false
	 $skipArray被hasOwnProperty后返回true
	 */

	module.exports = avalon.oneObject('$id,$render,$element,$watch,$fire,$events,$model,$skipArray,$accessors,$hashcode')

/***/ },
/* 66 */,
/* 67 */,
/* 68 */
/***/ function(module, exports, __webpack_require__) {

	
	var avalon = __webpack_require__(3)
	var browser = __webpack_require__(4)

	avalon.mix(avalon, browser)

	__webpack_require__(69)
	__webpack_require__(6)
	__webpack_require__(7)

	module.exports = avalon

/***/ },
/* 69 */
/***/ function(module, exports) {

	//这里放置存在异议的方法

	var serialize = avalon.inspect
	var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
	var rnative = /\[native code\]/ //判定是否原生函数
	var rarraylike = /(Array|List|Collection|Map|Arguments)\]$/
	var ohasOwn = avalon.ohasOwn
	// avalon.quote


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

	var rfunction = /^\s*\bfunction\b/

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

	var _slice = [].slice

	avalon.slice = function (nodes, start, end) {
	    return _slice.call(nodes, start, end)
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




/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

	
	/*********************************************************************
	 *                          DOM Api                                 *
	 *           shim,class,data,css,val,html,event,ready               *
	 **********************************************************************/

	__webpack_require__(71)
	__webpack_require__(72)
	__webpack_require__(73)
	__webpack_require__(74)
	__webpack_require__(75)
	__webpack_require__(76)
	__webpack_require__(77)
	__webpack_require__(78)

	module.exports = avalon


/***/ },
/* 71 */
/***/ function(module, exports) {

	//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
	if (!avalon.document.contains) {
	    Node.prototype.contains = function (arg) {
	        return !!(this.compareDocumentPosition(arg) & 16)
	    }
	}
	avalon.contains = function (root, el) {
	    try {
	        while ((el = el.parentNode))
	            if (el === root)
	                return true
	        return false
	    } catch (e) {
	        return false
	    }
	}
	function outerHTML() {
	    return new XMLSerializer().serializeToString(this)
	}


	var svgns = 'http://www.w3.org/2000/svg'
	var svg = avalon.document.createElementNS(svgns, 'svg')

	svg.innerHTML = '<circle fill="red" />'

	if (!/^\[object SVG\w*Element\]$/.test(svg.firstChild)) {
	    function createSVG(node, parent) {
	        /* jshint ignore:start */
	        if (node && node.childNodes) {
	            var nodes = node.childNodes
	            for (var i = 0, el; el = nodes[i++]; ) {
	                if (el.nodeType === 1) {
	                    var svg = document.createElementNS(svgns, el.nodeName.toLowerCase())
	                    avalon.each(el.attributes, function (a, attr) {
	                        svg.setAttribute(attr.name, attr.value)
	                    })
	                    createSVG(el, svg)
	                    parent.appendChild(svg)
	                } else {
	                    parent.appendChild(el.cloneNode(true))
	                }
	            }
	        }
	        /* jshint ignore:end */
	    }
	    //IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
	    Object.defineProperties(SVGElement.prototype, {
	        outerHTML: {
	            enumerable: true,
	            configurable: true,
	            get: outerHTML,
	            set: function (html) {
	                var tagName = this.tagName.toLowerCase()
	                var parent = this.parent
	                var parsed = avalon.parseHTML(html)
	                if (tagName === 'svg') {
	                    parent.insertBefore(parsed, this)
	                } else {
	                    var empty = document.createDocumentFragment()
	                    createSVG(parsed, empty)
	                    parent.insertBefore(empty, this)
	                }
	                parent.removeChild(this)
	            }
	        },
	        innerHTML: {
	            enumerable: true,
	            configurable: true,
	            get: function () {
	                var s = this.outerHTML
	                var ropen = new RegExp('<' + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>', 'i')
	                var rclose = new RegExp('<\/' + this.nodeName + '>$', 'i')
	                return s.replace(ropen, '').replace(rclose, '')
	            },
	            set: function (html) {
	                if (avalon.clearHTML) {
	                    avalon.clearHTML(this)
	                    var frag = avalon.parseHTML(html)
	                    createSVG(frag, this)
	                }
	            }
	        }
	    })
	}





/***/ },
/* 72 */
/***/ function(module, exports) {

	var rnowhite = /\S+/g

	'add,remove'.replace(avalon.rword, function (method) {
	    avalon.fn[method + 'Class'] = function (cls) {
	        var el = this[0] || {}
	        //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
	        if (cls && typeof cls === 'string' && el.nodeType === 1) {
	            cls.replace(rnowhite, function (c) {
	                el.classList[method](c)
	            })
	        }
	        return this
	    }
	})

	avalon.fn.mix({
	    hasClass: function (cls) {
	        var el = this[0] || {}
	        //IE10+, chrome8+, firefox3.6+, safari5.1+,opera11.5+支持classList,
	        //chrome24+,firefox26+支持classList2.0
	        return el.nodeType === 1 && el.classList.contains(cls)
	    },
	    toggleClass: function (value, stateVal) {
	        var isBool = typeof stateVal === 'boolean'
	        var me = this
	        String(value).replace(rnowhite, function (c) {
	            var state = isBool ? stateVal : !me.hasClass(c)
	            me[state ? 'addClass' : 'removeClass'](c)
	        })
	        return this
	    }
	})



/***/ },
/* 73 */
/***/ function(module, exports) {

	
	var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
	avalon.parseJSON = JSON.parse

	function parseData(data) {
	    try {
	        if (typeof data === 'object')
	            return data
	        data = data === 'true' ? true :
	                data === 'false' ? false :
	                data === 'null' ? null : +data + '' === data ? +data : rbrace.test(data) ? JSON.parse(data) : data
	    } catch (e) {
	    }
	    return data
	}


	avalon.fn.attr = function (name, value) {
	    if (arguments.length === 2) {
	        this[0].setAttribute(name, value)
	        return this
	    } else {
	        return this[0].getAttribute(name)
	    }
	}

	avalon.fn.data = function (name, value) {
	    name = 'data-' + avalon.hyphen(name || '')
	    switch (arguments.length) {
	        case 2:
	            this.attr(name, value)
	            return this
	        case 1:
	            var val = this.attr(name)
	            return parseData(val)
	        case 0:
	            var ret = {}
	            avalon.each(this[0].attributes, function (i, attr) {
	                if (attr) {
	                    name = attr.name
	                    if (!name.indexOf('data-')) {
	                        name = avalon.camelize(name.slice(5))
	                        ret[name] = parseData(attr.value)
	                    }
	                }
	            })
	            return ret
	    }
	}


	if (avalon.root.dataset) {
	    avalon.fn.data = function (name, val) {
	        name = name && avalon.camelize(name)
	        var dataset = this[0].dataset
	        switch (arguments.length) {
	            case 2:
	                dataset[name] = val
	                return this
	            case 1:
	                val = dataset[name]
	                return parseData(val)
	            case 0:
	                var ret = {}
	                for (name in dataset) {
	                    ret[name] = parseData(dataset[name])
	                }
	                return ret
	        }
	    }
	}



/***/ },
/* 74 */
/***/ function(module, exports) {

	var root = avalon.root
	var window = avalon.window
	var document = avalon.document
	var camelize = avalon.camelize
	var cssHooks = avalon.cssHooks

	var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
	var cssMap = {
	    'float': 'cssFloat'
	}

	avalon.cssNumber = avalon.oneObject('animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom')

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


	avalon.fn.css = function (name, value) {
	    if (avalon.isPlainObject(name)) {
	        for (var i in name) {
	            avalon.css(this, i, name[i])
	        }
	    } else {
	        var ret = avalon.css(this, name, value)
	    }
	    return ret !== void 0 ? ret : this
	}

	avalon.fn.position = function () {
	    var offsetParent, offset,
	            elem = this[0],
	            parentOffset = {
	                top: 0,
	                left: 0
	            }
	    if (!elem) {
	        return parentOffset
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
	}
	avalon.fn.offsetParent = function () {
	    var offsetParent = this[0].offsetParent
	    while (offsetParent && avalon.css(offsetParent, "position") === "static") {
	        offsetParent = offsetParent.offsetParent;
	    }
	    return avalon(offsetParent || root)
	}


	cssHooks["@:set"] = function (node, name, value) {
	    node.style[name] = value
	}

	cssHooks["@:get"] = function (node, name) {
	    if (!node || !node.style) {
	        throw new Error("getComputedStyle要求传入一个节点 " + node)
	    }
	    var ret, computed = getComputedStyle(node)
	    if (computed) {
	        ret = name === "filter" ? computed.getPropertyValue(name) : computed[name]
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

	"top,left".replace(avalon.rword, function (name) {
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
	        var styles = getComputedStyle(node, null)
	        if (rdisplayswap.test(styles["display"])) {
	            var obj = {
	                node: node
	            }
	            for (var name in cssShow) {
	                obj[name] = styles[name]
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
	        return val;
	    }
	    avalon.fn[method] = function (value) { //会忽视其display
	        var node = this[0]
	        if (arguments.length === 0) {
	            if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
	                return node["inner" + name]
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
	    var node = this[0]
	    try {
	        var rect = node.getBoundingClientRect()
	        // Make sure element is not hidden (display: none) or disconnected
	        // https://github.com/jquery/jquery/pull/2043/files#r23981494
	        if (rect.width || rect.height || node.getClientRects().length) {
	            var doc = node.ownerDocument
	            var root = doc.documentElement
	            var win = doc.defaultView
	            return {
	                top: rect.top + win.pageYOffset - root.clientTop,
	                left: rect.left + win.pageXOffset - root.clientLeft
	            }
	        }
	    } catch (e) {
	        return {
	            left: 0,
	            top: 0
	        }
	    }
	}

	avalon.each({
	    scrollLeft: "pageXOffset",
	    scrollTop: "pageYOffset"
	}, function (method, prop) {
	    avalon.fn[method] = function (val) {
	        var node = this[0] || {},
	                win = getWindow(node),
	                top = method === "scrollTop"
	        if (!arguments.length) {
	            return win ? win[prop] : node[method]
	        } else {
	            if (win) {
	                win.scrollTo(!top ? val : win[prop], top ? val : win[prop])
	            } else {
	                node[method] = val
	            }
	        }
	    }
	})

	function getWindow(node) {
	    return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView : false
	}

/***/ },
/* 75 */
/***/ function(module, exports) {

	function getValType(elem) {
	    var ret = elem.tagName.toLowerCase()
	    return ret === 'input' && /checkbox|radio/.test(elem.type) ? 'checked' : ret
	}
	var valHooks = {
	    'select:get': function self(node, ret, index, singleton) {
	        var nodes = node.children, value,
	                getter = valHooks['option:get']
	        index = ret ? index : node.selectedIndex
	        singleton = ret ? singleton : node.type === 'select-one' || index < 0
	        ret = ret || []
	        for (var i = 0, el; el = nodes[i++]; ) {
	            if (!el.disabled) {
	                switch (el.nodeName.toLowerCase()) {
	                    case 'option':
	                        if ((el.selected || el.index === index)) {
	                            value = getter(el)
	                            if (singleton) {
	                                return value
	                            } else {
	                                ret.push(value)
	                            }
	                        }
	                        break
	                    case 'optgroup':
	                        value = self(el, ret, index, singleton)
	                        if (typeof value === 'string') {
	                            return value
	                        }
	                        break
	                }
	            }
	        }
	        return singleton ? null : ret
	    },
	    'select:set': function (node, values, optionSet) {
	        values = [].concat(values) //强制转换为数组
	        for (var i = 0, el; el = node.options[i++]; ) {
	            if ((el.selected = values.indexOf(el.value) > -1)) {
	                optionSet = true
	            }
	        }
	        if (!optionSet) {
	            node.selectedIndex = -1
	        }
	    }
	}

	avalon.fn.val = function (value) {
	    var node = this[0]
	    if (node && node.nodeType === 1) {
	        var get = arguments.length === 0
	        var access = get ? ':get' : ':set'
	        var fn = valHooks[getValType(node) + access]
	        if (fn) {
	            var val = fn(node, value)
	        } else if (get) {
	            return (node.value || '').replace(/\r/g, '')
	        } else {
	            node.value = value
	        }
	    }
	    return get ? val : this
	}

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

	var Cache = __webpack_require__(27)
	var fixScript = __webpack_require__(28)
	var tagHooks = new function () {// jshint ignore:line
	    avalon.mix(this, {
	        option: document.createElement('select'),
	        thead: document.createElement('table'),
	        td: document.createElement('tr'),
	        area: document.createElement('map'),
	        tr: document.createElement('tbody'),
	        col: document.createElement('colgroup'),
	        legend: document.createElement('fieldset'),
	        _default: document.createElement('div'),
	        'g': document.createElementNS('http://www.w3.org/2000/svg', 'svg')
	    })
	    this.optgroup = this.option
	    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
	    this.th = this.td
	}// jshint ignore:line

	var svgHooks = {
	    g: tagHooks.g
	}
	String('circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use').replace(avalon.rword, function (tag) {
	    svgHooks[tag] = tagHooks.g //处理SVG
	})

	var rtagName = /<([\w:]+)/
	var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig

	var rhtml = /<|&#?\w+;/
	var htmlCache = new Cache(128)
	var tempateTag = avalon.document.createElement('template')
	var htmlHook

	if (/HTMLTemplateElement/.test(tempateTag)) {
	    htmlHook = tempateTag
	} else {
	    avalon.mix(tagHooks, svgHooks)
	}

	avalon.parseHTML = function (html) {
	    var fragment = avalon.avalonFragment.cloneNode(false), firstChild
	    if (typeof html !== 'string') {
	        return fragment
	    }
	    if (!rhtml.test(html)) {
	        fragment.appendChild(document.createTextNode(html))
	        return fragment
	    }
	    html = html.replace(rxhtml, '<$1></$2>').trim()
	    var hasCache = htmlCache.get(html)
	    if (hasCache) {
	        return hasCache.cloneNode(true)
	    }
	    var tag = (rtagName.exec(html) || ['', ''])[1].toLowerCase()

	    var wrapper = svgHooks[tag], firstChild
	    if (wrapper) {
	        wrapper.innerHTML = html
	        //使用innerHTML生成的script节点不会发出请求与执行text属性
	        replaceScript(wrapper)
	    } else if (htmlHook) {
	        htmlHook.innerHTML = html
	        wrapper = htmlHook.content
	    } else {
	        wrapper = tagHooks[tag] || tagHooks._default
	        wrapper.innerHTML = html
	        replaceScript(wrapper)
	    }
	    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
	        fragment.appendChild(firstChild)
	    }
	    hasCache.put(html, fragment.cloneNode(true))
	    return fragment
	}

	avalon.innerHTML = function (node, html) {
	    var a = this.parseHTML(html)
	    this.clearHTML(node).appendChild(a)
	}

	avalon.clearHTML = function (node) {
	    avalon.each( node.getElementsByTagName('*'), function(i, el){
	        avalon.unbind(el)
	    })
	    node.textContent = ''
	    while (node.lastChild) {
	        node.removeChild(node.lastChild)
	    }
	    return node
	}

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

	var document = avalon.document
	var window = avalon.window
	var root = avalon.root

	var getShortID = __webpack_require__(6).getShortID
	//http://www.feiesoft.com/html/events.html
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


	avalon.eventHandlers = {}

	avalon.__eventVM__ = {}
	var eventHooks = avalon.eventHooks
	/*绑定事件*/
	avalon.bind = function (elem, type, fn) {
	    if (elem.nodeType === 1) {
	        var value = elem.getAttribute('avalon-events') || ''
	        //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324,
	        //如果是使用bind方法绑定的回调,其uuid格式为_12
	        var uuid = getUid(fn)
	        var key = type + ':' + uuid
	        var hook = eventHooks[type]
	        if (hook) {
	            type = hook.type
	            if (hook.fix) {
	                fn = hook.fix(elem, fn)
	                fn.uuid = uuid + '0'
	            }
	            key = type + ':' + fn.uuid
	        }
	        avalon.eventHandlers[fn.uuid] = fn

	        if (value.indexOf(type + ':') === -1) {//同一种事件只绑定一次
	            if (canBubbleUp[type]) {
	                delegateEvent(type)
	            } else {
	                nativeBind(elem, type, dispatch)
	            }
	        }
	        var keys = value.split('??')
	        if (keys[0] === '') {
	            keys.shift()
	        }
	        if (keys.indexOf(key) === -1) {
	            keys.push(key)
	            keys.sort()
	            elem.setAttribute('avalon-events', keys.join('??'))
	            //将令牌放进avalon-events属性中
	        }

	    } else {
	        nativeBind(elem, type, fn)
	    }
	    return fn //兼容之前的版本
	}

	avalon.unbind = function (elem, type, fn) {
	    if (elem.nodeType === 1) {
	        var value = elem.getAttribute('avalon-events') || ''
	        switch (arguments.length) {
	            case 1:
	                nativeUnBind(elem, type, dispatch)
	                elem.removeAttribute('avalon-events')
	                break
	            case 2:
	                value = value.split('??').filter(function (str) {
	                    return str.indexOf(type + ':') === -1
	                }).join('??')

	                elem.setAttribute('avalon-events', value)
	                break
	            case 3:
	                var search = type + ':' + fn.uuid
	                value = value.split('??').filter(function (str) {
	                    return str !== search
	                }).join('??')
	                elem.setAttribute('avalon-events', value)
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
	    var value = elem.getAttribute('avalon-events')
	    if (value && (elem.disabled !== true || type !== 'click')) {
	        var uuids = []
	        var arr = value.match(reventNames) || []
	        for (var i = 0, el; el = arr[i++]; ) {
	            var v = el.split(':')
	            if (v[0] === type) {
	                uuids.push(v[1])
	            } else {
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
	    // console.log(handlers)
	    var i = 0, j, uuid, handler
	    while ((handler = handlers[i++]) && !event.cancelBubble) {
	        event.currentTarget = handler.elem
	        j = 0
	        while ((uuid = handler.uuids[ j++ ]) &&
	                !event.isImmediatePropagationStopped) {
	            var fn = avalon.eventHandlers[uuid]
	            if (fn) {
	                var vm = avalon.__eventVM__[type + ':' + uuid ]
	                if (vm && vm.$hashcode === false) {
	                    return avalon.unbind(elem, type, fn)
	                }
	                if (/move|scroll/.test(type)) {
	                    var curr = +new Date()
	                    if (curr - last > 16) {
	                        fn.call(elem, event, vm)
	                        last = curr
	                    }
	                } else {
	                    fn.call(handler.elem, event, vm)
	                }
	            }
	        }
	    }
	}


	var nativeBind = function (el, type, fn) {
	    el.addEventListener(type, fn)
	}
	var nativeUnBind = function (el, type, fn) {
	    el.removeEventListener(type, fn)
	}

	function delegateEvent(type) {
	    var value = root.getAttribute('delegate-events') || ''
	    if (value.indexOf(type) === -1) {
	        var arr = value.match(reventNames) || []
	        arr.push(type)
	        root.setAttribute('delegate-events', arr.join('??'))
	        nativeBind(root, type, dispatch)
	    }
	}

	var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
	var rsponsor = /^(ms|webkit|moz)/
	function avEvent(event) {
	    if (event.originalEvent) {
	        return this
	    }
	    for (var i in event) {
	        if (!rsponsor.test(i) && typeof event[i] !== 'function') {
	            this[i] = event[i]
	        }
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

	            e.preventDefault()

	        }
	    },
	    stopPropagation: function () {
	        var e = this.originalEvent
	        this.cancelBubble = true
	        if (e) {
	            e.cancelBubble = true
	            e.stopPropagation()
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

	avalon.fireDom = function (elem, type, opts) {
	    var hackEvent = document.createEvent('Events');
	    hackEvent.initEvent(type, true, true)
	    avalon.mix(hackEvent, opts)
	    elem.dispatchEvent(hackEvent)
	}

	var eventHooks = avalon.eventHooks
	//针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
	if (!('onmouseenter' in root)) {
	    avalon.each({
	        mouseenter: 'mouseover',
	        mouseleave: 'mouseout'
	    }, function (origType, fixType) {
	        eventHooks[origType] = {
	            type: fixType,
	            fn: function (elem, fn) {
	                return function (e) {
	                    var t = e.relatedTarget
	                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
	                        delete e.type
	                        e.type = origType
	                        return fn.call(elem, e)
	                    }
	                }
	            }
	        }
	    })
	}
	//针对IE9+, w3c修正animationend
	avalon.each({
	    AnimationEvent: 'animationend',
	    WebKitAnimationEvent: 'webkitAnimationEnd'
	}, function (construct, fixType) {
	    if (window[construct] && !eventHooks.animationend) {
	        eventHooks.animationend = {
	            type: fixType
	        }
	    }
	})

	if (document.onmousewheel === void 0) {
	    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
	     firefox DOMMouseScroll detail 下3 上-3
	     firefox wheel detlaY 下3 上-3
	     IE9-11 wheel deltaY 下40 上-40
	     chrome wheel deltaY 下100 上-100 */
	    eventHooks.mousewheel = {
	        type: 'wheel',
	        fn: function (elem, fn) {
	            return function (e) {
	                e.wheelDeltaY = e.wheelDelta = e.deltaY > 0 ? -120 : 120
	                e.wheelDeltaX = 0
	                Object.defineProperty(e, 'type', {
	                    value: 'mousewheel'
	                })
	                fn.call(elem, e)
	            }
	        }
	    }
	}

	avalon.fn.bind = function (type, fn, phase) {
	    if (this[0]) { //此方法不会链
	        return avalon.bind(this[0], type, fn, phase)
	    }
	}

	avalon.fn.unbind = function (type, fn, phase) {
	    if (this[0]) {
	        avalon.unbind(this[0], type, fn, phase)
	    }
	    return this
	}

/***/ },
/* 78 */
/***/ function(module, exports) {

	var document = avalon.document
	var window = avalon.window

	var readyList = [], isReady
	var fireReady = function (fn) {
	    isReady = true

	    while (fn = readyList.shift()) {
	        fn(avalon)
	    }
	}

	if (document.readyState === 'complete') {
	    setTimeout(fireReady) //如果在domReady之外加载
	} else {
	    document.addEventListener('DOMContentLoaded', fireReady)
	}

	avalon.bind(window, 'load', fireReady)

	avalon.ready = function (fn) {
	    if (!isReady) {
	        readyList.push(fn)
	    } else {
	        fn(avalon)
	    }
	}



/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

	__webpack_require__(35)
	__webpack_require__(39)
	__webpack_require__(38)
	__webpack_require__(40)
	__webpack_require__(41)
	__webpack_require__(42)
	__webpack_require__(43)

	__webpack_require__(44)
	__webpack_require__(45)
	__webpack_require__(46)
	__webpack_require__(80)
	__webpack_require__(49)
	__webpack_require__(50)

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

	
	//双工绑定

	var W3C = avalon.modern
	var msie = avalon.msie
	var quote = avalon.quote
	var markID = __webpack_require__(6).getLongID
	var document = avalon.document
	var pushArray = avalon.Array.merge
	var evaluatorPool = __webpack_require__(48)

	var rchangeFilter = /\|\s*change\b/
	var rcheckedFilter = /\|\s*checked\b/
	var rcheckedType = /^(?:checkbox|radio)$/
	var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/


	avalon.directive("duplex", {
	    priority: 2000,
	    parse: function (binding, num, elem) {
	        var expr = binding.expr
	        var etype = elem.props.type

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
	        avalon.parseExpr(binding, "duplex")
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
	                node.checked = curValue

	                break
	            case "checkbox":
	                var array = [].concat(curValue) //强制转换为数组
	                curValue = binding.get(node.value)
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
	                pushArray(elem.children, avalon.lexer(elem.template))
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

	function duplexDragEnd(e) {
	    var elem = this
	    setTimeout(function () {
	        duplexValue.call(elem, e)
	    }, 17)
	}


	function duplexValue() { //原来的updateVModel
	    var elem = this, fixCaret
	    var val = elem.value //防止递归调用形成死循环
	    if (elem.composing || val === elem.oldValue)
	        return
	    if (elem.msFocus) {
	        try {
	            var start = elem.selectionStart
	            var end = elem.selectionEnd
	            if (start === end) {
	                var pos = start
	                fixCaret = true
	            }
	        } catch (e) {
	            avalon.log("fixCaret", e)
	        }
	    }
	    var lastValue = elem.duplexData.get(val)
	    try {
	        elem.value = elem.oldValue = lastValue + ""
	        if (fixCaret && !elem.readOnly) {
	            elem.selectionStart = elem.selectionEnd = pos
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



	//处理 货币 http://openexchangerates.github.io/accounting.js/


/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

	
	var share = __webpack_require__(82)
	var isSkip = share.isSkip
	var toJson = share.toJson
	var $$midway = share.$$midway
	var $$skipArray = share.$$skipArray
	delete $$skipArray
	var makeAccessor = share.makeAccessor
	var makeObserver = share.makeObserver
	var modelAccessor = share.modelAccessor
	var modelAdaptor = share.modelAdaptor
	var makeHashCode = avalon.makeHashCode


	//一个vm总是为Observer的实例
	function Observer() {
	}
	function masterFactory(definition, heirloom, options) {

	    var $skipArray = {}
	    if (definition.$skipArray) {//收集所有不可监听属性
	        $skipArray = avalon.oneObject(definition.$skipArray)
	        delete definition.$skipArray
	    }

	    var keys = {}
	    options = options || {}
	    var accessors = {}
	    var hashcode = makeHashCode("$")
	    var pathname = options.pathname || ""
	    options.id = options.id || hashcode
	    options.hashcode = hashcode
	    var key, sid, spath
	    for (key in definition) {
	        if ($$skipArray[key])
	            continue
	        var val = keys[key] = definition[key]
	        if (!isSkip(key, val, $skipArray)) {
	            sid = options.id + "." + key
	            spath = pathname ? pathname + "." + key : key
	            accessors[key] = makeAccessor(sid, spath, heirloom)
	        }
	    }

	    accessors.$model = modelAccessor
	    var $vmodel = new Observer()
	    Object.defineProperties($vmodel, accessors)

	    for (key in keys) {
	        //对普通监控属性或访问器属性进行赋值
	        $vmodel[key] = keys[key]
	        //删除系统属性
	        if (key in $skipArray) {
	            delete keys[key]
	        } else {
	            keys[key] = true
	        }
	    }
	    makeObserver($vmodel, heirloom, keys, accessors, options)

	    return $vmodel
	}
	$$midway.masterFactory = masterFactory

	function slaveFactory(before, after, heirloom, options) {
	    var keys = {}
	    var accessors = {}
	    var pathname = options.pathname
	    var key, sid, spath
	    for (key in after) {
	        if ($$skipArray[key])
	            continue
	        keys[key] = after[key]
	        if (!isSkip(key, after[key], {})) {
	            var accessor = Object.getOwnPropertyDescriptor(before, key)
	            if (accessor && accessor.get) {
	                accessors[key] = accessor
	            } else {
	                sid = options.id + "." + key
	                spath = pathname ? pathname + "." + key : key
	                accessors[key] = makeObservable(sid, spath, heirloom)
	            }
	        }
	    }
	    for (key in before) {
	        delete before[key]
	    }

	    accessors.$model = modelAccessor
	    var $vmodel = before
	    Object.defineProperties($vmodel, accessors)

	    for (key in keys) {
	        if (!accessors[key]) {//添加不可监控的属性
	            $vmodel[key] = keys[key]
	        }
	        keys[key] = true
	    }
	    makeObserver($vmodel, options, heirloom, keys, accessors)

	    return $vmodel
	}

	$$midway.slaveFactory = slaveFactory

	function mediatorFactory(before, after, heirloom) {
	    var keys = {}
	    var accessors = {}

	    //收集所有键值对及访问器属性
	    for (var key in before) {
	        keys[key] = before[key]
	        var accessor = Object.getOwnPropertyDescriptor(before, key)
	        if (accessor.set) {
	            accessors[key] = accessor
	        }
	    }
	    for (var key in after) {
	        keys[key] = after[key]
	        var accessor = Object.getOwnPropertyDescriptor(after, key)
	        if (accessor.set) {
	            accessors[key] = accessor
	        }
	    }

	    var $vmodel = new Observer()
	    Object.defineProperties($vmodel, accessors)

	    for (key in keys) {
	        if (!accessors[key]) {//添加不可监控的属性
	            $vmodel[key] = keys[key]
	        }
	        keys[key] = true
	    }

	    makeObserve($vmodel, heirloom || {}, keys, accessors, {
	        id: before.$id,
	        hashcode: makeHashCode("$"),
	        master: true
	    })

	    return $vmodel
	}

	$$midway.mediatorFactory = avalon.mediatorFactory = mediatorFactory

	var __array__ = share.__array__
	function arrayFactory(array, old, heirloom, options) {
	    if (old && old.splice) {
	        var args = [0, old.length].concat(array)
	        old.splice.apply(old, args)
	        return old
	    } else {
	        for (var i in __array__) {
	            array[i] = __array__[i]
	        }

	        array.notify = function (a, b, c, d) {
	            var vm = heirloom.__vmodel__
	            if (vm) {
	                var path = a === null || a === void 0 ?
	                        options.pathname :
	                        options.pathname + '.' + a
	                vm.$fire(path, b, c)
	                if (!d) {
	                    avalon.rerenderStart = new Date
	                    avalon.batch(vm.$id, true)
	                }
	            }
	        }

	        var hashcode = avalon.makeHashCode('$')
	        options.array = true
	        options.hashcode = hashcode
	        options.id = options.id || hashcode
	        makeObserver(array, options, heirloom)

	        var arrayOptions = {
	            id: array.$id + '.*',
	            master: true
	        }
	        for (var j = 0, n = array.length; j < n; j++) {
	            array[j] = convertItem(array[j], {}, arrayOptions)
	        }
	        return array
	    }
	}
	$$midway.arrayFactory = arrayFactory

	var ap = Array.prototype
	var _splice = ap.splice
	function notifySize(array, size) {
	    if (array.length !== size) {
	        array.notify('length', array.length, size, true)
	    }
	}
	function convertItem(item, a, b) {
	    if (Object(item) === item) {
	        return modelAdaptor(item, 0, a, b)
	    } else {
	        return item
	    }
	}

	__array__.removeAll = function (all) { //移除N个元素
	    var size = this.length
	    if (Array.isArray(all)) {
	        for (var i = this.length - 1; i >= 0; i--) {
	            if (all.indexOf(this[i]) !== -1) {
	                _splice.call(this, i, 1)
	            }
	        }
	    } else if (typeof all === 'function') {
	        for (i = this.length - 1; i >= 0; i--) {
	            var el = this[i]
	            if (all(el, i)) {
	                _splice.call(this, i, 1)
	            }
	        }
	    } else {
	        _splice.call(this, 0, this.length)

	    }

	    notifySize(this, size)
	    this.notify()
	}


	var __method__ = ['push', 'pop', 'shift', 'unshift', 'splice']
	__method__.forEach(function (method) {
	    var original = ap[method]
	    __array__[method] = function (a, b) {
	        // 继续尝试劫持数组元素的属性
	        var args = [], size = this.length
	        var options = {
	            idname: this.$id + '.*',
	            master: true
	        }
	        if (method === 'splice' && Object(this[0]) === this[0]) {
	            var old = this.slice(a, b)
	            var neo = ap.slice.call(arguments, 2)
	            var args = [a, b]
	            for (var j = 0, jn = neo.length; j < jn; j++) {
	                var item = old[j]
	                args[j + 2] = modelAdaptor(neo[j], item, item && item.$events, options)
	            }
	        } else {
	            for (var i = 0, n = arguments.length; i < n; i++) {
	                args[i] = convertItem(arguments[i], {}, options)
	            }
	        }

	        var result = original.apply(this, args)

	        notifySize(this, size)
	        this.notify()

	        return result
	    }
	})

	'sort,reverse'.replace(avalon.rword, function (method) {
	    __array__[method] = function () {
	        ap[method].apply(this, arguments)
	        this.notify()
	        return this
	    }
	})


	module.exports = avalon


/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

	var share = __webpack_require__(63)
	var makeFire = share.makeFire

	function toJson(val) {
	    var xtype = avalon.type(val)
	    if (xtype === 'array') {
	        var array = []
	        for (var i = 0; i < val.length; i++) {
	            array[i] = toJson(val[i])
	        }
	        return array
	    } else if (xtype === 'object') {
	        var obj = {}
	        for (i in val) {
	            if (i === '__proxy__' || i === '__data__' || i === '__const__')
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

	function hideProperty(host, name, value) {
	    Object.defineProperty(host, name, {
	        value: value,
	        writable: true,
	        enumerable: false,
	        configurable: true
	    })
	}

	var modelAccessor = {
	    get: function () {
	        return toJson(this)
	    },
	    set: avalon.noop,
	    enumerable: false,
	    configurable: true
	}

	share.$$midway.hideProperty = hideProperty

	function makeObserver($vmodel, heirloom, keys, accessors, options) {

	    if (options.array) {
	        hideProperty($vmodel, '$model', modelAccessor)
	    } else {
	        function hasOwnKey(key) {
	            return keys[key] === true
	        }
	        hideProperty($vmodel, 'hasOwnProperty', hasOwnKey)
	    }
	    hideProperty($vmodel, '$id', options.id)
	    hideProperty($vmodel, '$hashcode', options.hashcode)
	    if (options.master === true) {
	        hideProperty($vmodel, '$element', null)
	        hideProperty($vmodel, '$render', avalon.noop)
	        makeFire($vmodel, heirloom)
	    }
	}


	var mixin = {
	    toJson: toJson,
	    makeObserver: makeObserver,
	    modelAccessor: modelAccessor
	}
	for (var i in share) {
	    mixin[i] = share[i]
	}

	module.exports = mixin


/***/ }
/******/ ])
});
;