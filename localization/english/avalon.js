//==================================================

// avalon 0.96p   by Situ Zhengmei 2013.9.17
// FAQ:
//    Which license? MIT. ( Comparison between five popular open-source licenses, BSD, Apache, GPL, LGPL, and MIT  http://www.awflasher.com/blog/archives/939 )
//    Dependencies? None, works well together with jQuery, Mass, etc.
//==================================================
(function(DOC) {
    var Registry = {} //expose functions to this object to help accessor to collect dependencies
    var expose = new Date - 0
    var subscribers = "$" + expose
    var otherRequire = window.require
    var otherDefine = window.define
    //These two fields are closely related to calculated properties.
    var stopRepeatAssign = false
    var openComputedCollect = false
    var rword = /[^, ]+/g //split string into small blocks, delimited by space or comma, working together with the replace function to implement forEach for a string.
    var class2type = {}
    var oproto = Object.prototype
    var ohasOwn = oproto.hasOwnProperty
    var prefix = "ms-"
    var W3C = window.dispatchEvent
    var root = DOC.documentElement
    var serialize = oproto.toString
    var aslice = [].slice
    var head = DOC.head || DOC.getElementsByTagName("head")[0] //HEAD element
    var documentFragment = DOC.createDocumentFragment()
    var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",")
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })
    var rwindow = /^[object (Window|DOMWindow|global)]$/
    var rnative = /\[native code\]/
    var rchecktype = /^(?:object|array)$/

    function noop() {
    }

    function log(a) {
        window.console && console.log(W3C ? a : a + "")
    }


    /*********************************************************************
     *                 Namespace                                            *
     **********************************************************************/

    avalon = function(el) { // Create a jQuery style non-new instantiation structure
        return new avalon.init(el)
    }
    avalon.init = function(el) {
        this[0] = this.element = el
    }
    avalon.fn = avalon.prototype = avalon.init.prototype
    //Put in three type detection methods in the very beginning.

    function getType(obj) { //Retrieve the type of the object
        if (obj == null) {
            return String(obj)
        }
        // Early versions of webkit browsers implement deprecated ecma262v4 spec, in which a regular expression literal
        // is treated as a function. In this case perform typeof against a regular expression will result in "function".
        return typeof obj === "object" || typeof obj === "function" ?
                class2type[serialize.call(obj)] || "object" :
                typeof obj
    }
    avalon.type = getType
    avalon.isWindow = function(obj) {
        if (!obj)
            return false
        if (obj === window)
            return true
        // Leverage the fact that in IE6-8 window == document results true while document == window amazingly results false
        // IE9, 10 and other modern browsers should be detected by regular expression.
        return obj == obj.document && obj.document != obj
    }

    function isWindow(obj) {
        return rwindow.test(serialize.call(obj))
    }
    if (isWindow(window)) {
        avalon.isWindow = isWindow
    }
    //Check whether the object is a plain javascript object (Object). That means, it is either a DOM object, a BOM object
    // , nor an instance of a user defined class.
    avalon.isPlainObject = function(obj) {
        if (getType(obj) !== "object" || obj.nodeType || this.isWindow(obj)) {
            return false
        }
        try {
            if (obj.constructor && !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                return false
            }
        } catch (e) {
            return false
        }
        return true
    }
    if (rnative.test(Object.getPrototypeOf)) {
        avalon.isPlainObject = function(obj) {
            return obj && typeof obj === "object" && Object.getPrototypeOf(obj) === oproto
        }
    }
    avalon.mix = avalon.fn.mix = function() {
        var options, name, src, copy, copyIsArray, clone,
                target = arguments[0] || {},
                i = 1,
                length = arguments.length,
                deep = false

        // If the first argument is boolean, check whether deep copy is needed.
        if (typeof target === "boolean") {
            deep = target
            target = arguments[1] || {}
            i = 2
        }

        //Ensure the target is a complex data structure.
        if (typeof target !== "object" && getType(target) !== "function") {
            target = {}
        }

        //If there is only one argument, the new member(s) should be added to the object on which "mix" lays.
        if (length === i) {
            target = this
            --i
        }

        for (; i < length; i++) {
            //process non-empty arguments only
            if ((options = arguments[i]) != null) {
                for (name in options) {
                    src = target[name]
                    copy = options[name]

                    // prevent recursive reference
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
    var eventMap = {}

    function resetNumber(a, n, end) {//simulate slice and splice
        if ((a === +a) && !(a % 1)) { //if it is an integer
            if (a < 0) {
                a = a * -1 >= n ? 0 : a + n
            } else {
                a = a > n ? n : a
            }
        } else {
            a = end ? n : 0
        }
        return a
    }

    function oneObject(array, val) {
        if (typeof array === "string") {
            array = array.match(rword) || []
        }
        var result = {},
                value = val !== void 0 ? val : 1
        for (var i = 0, n = array.length; i < n; i++) {
            result[array[i]] = value
        }
        return result
    }
    avalon.mix({
        rword: rword,
        subscribers: subscribers,
        ui: {},
        log: log,
        slice: W3C ? function(nodes, start, end) {
            return aslice.call(nodes, start, end)
        } : function(nodes, start, end) {
            var ret = [],
                    n = nodes.length;
            start = resetNumber(start, n)
            end = resetNumber(end, n, 1)
            for (var i = start; i < end; ++i) {
                ret[i - start] = nodes[i]
            }
            return ret
        },
        noop: noop,
        error: function(str, e) { //str may result in garbled characters if not wrapped by the Error object
            throw new (e || Error)(str)
        },
        oneObject: oneObject,
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
        range: function(start, end, step) {// Generate an integer array
            step || (step = 1)
            if (end == null) {
                end = start || 0
                start = 0
            }
            var index = -1,
                    length = Math.max(0, Math.ceil((end - start) / step)),
                    result = Array(length)
            while (++index < length) {
                result[index] = start
                start += step
            }
            return result
        },
        bind: function(el, type, fn, phase) { // Event binding
            function callback(e) {
                var ex = e.target ? e : fixEvent(e || window.event)
                var ret = fn.call(el, e)
                if (ret === false) {
                    ex.preventDefault()
                    ex.stopPropagation()
                }
                return ret
            }
            if (W3C) { //addEventListener ignores "return false". We have to put in our own fix.
                el.addEventListener(eventMap[type] || type, callback, !!phase)
            } else {
                try {
                    el.attachEvent("on" + type, callback)
                } catch (e) {
                }
            }
            return callback
        },
        unbind: W3C ? function(el, type, fn, phase) { //unbind event
            el.removeEventListener(eventMap[type] || type, fn || noop, !!phase)
        } : function(el, type, fn) {
            el.detachEvent("on" + type, fn || noop)
        },
        css: function(node, name, value) {
            if (node instanceof avalon) {
                var that = node
                node = node[0]
            }
            var prop = /[_-]/.test(name) ? camelize(name) : name
            name = cssName(prop) || prop
            if (value === void 0 || typeof value === "boolean") { //Retrieve css style
                var fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
                var val = fn(node, name)
                return value === true ? parseFloat(val) || 0 : val
            } else { //Set css style
                var type = typeof value
                if (type === "number" && !isFinite(value + "")) {
                    return
                }
                if (isFinite(value) && !cssNumber[prop]) {
                    value += "px"
                }
                fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
                fn(node, name, value)
                return that
            }
        }
    })

    //Choose the fastest asynchronous callback approach for different browsers respectively
    var BrowserMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (BrowserMutationObserver) { //chrome18+, safari6+, firefox14+,ie11+,opera15
        avalon.nextTick = function(callback) { //2-3ms
            var input = DOC.createElement("input")
            var observer = new BrowserMutationObserver(function(mutations) {
                mutations.forEach(function() {
                    callback()
                })
            })
            observer.observe(input, {
                attributes: true
            })
            input.setAttribute("value", Math.random())
        }
    } else if (window.VBArray) {
        //Usually it takes only 1ms in IE, without any side effect and no request sent, while setImmediate takes around 140ms if it is run just once. (same as setTimeout)
        avalon.nextTick = function(callback) {
            var node = DOC.createElement("script")
            node.onreadystatechange = function() {
                callback() //Triggered during interactive phase
                node.onreadystatechange = null
                root.removeChild(node)
                node = null
            }
            root.appendChild(node)
        }
    } else {
        avalon.nextTick = function(callback) {
            setTimeout(callback, 0)
        }
    }

    var VMODELS = avalon.vmodels = {}


    //Only nodes collection, pure array, arguments, and plain JS object having nonnegative integer length can pass
    function isArrayLike(obj) {
        if (obj && typeof obj === "object") {
            var n = obj.length
            if (+n === n && !(n % 1) && n >= 0) { //Check whether the length is a nonnegative integer
                try {
                    if ({}.propertyIsEnumerable.call(obj, 'length') === false) { //If it is a primitive object
                        return Array.isArray(obj) || /^\s?function/.test(obj.item || obj.callee)
                    }
                    return true;
                } catch (e) { //throw exception for NodeList in IE
                    return true
                }
            }
        }
        return false
    }

    function generateID() {
        //Generate UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    avalon.each = function(obj, fn) {
        if (obj) { //You can't pass in a null or undefined object
            var i = 0
            if (isArrayLike(obj)) {
                for (var n = obj.length; i < n; i++) {
                    fn(i, obj[i])
                }
            } else {
                for (i in obj) {
                    if (obj.hasOwnProperty(i)) {
                        fn(i, obj[i])
                    }
                }
            }
        }
    }

    /*********************************************************************
     *                           ecma262 v5 syntax patch                 *
     **********************************************************************/
    if (!"Situ Zhengmei".trim) {
        String.prototype.trim = function() {
            return this.replace(/^[\s\xA0]+/, "").replace(/[\s\xA0]+$/, '')
        }
    }
    for (var i in {
        toString: 1
    }) {
        DONT_ENUM = false
    }
    if (!Object.keys) {
        Object.keys = function(obj) { //ecma262v5 15.2.3.14
            var result = []
            for (var key in obj)
                if (obj.hasOwnProperty(key)) {
                    result.push(key)
                }
            if (DONT_ENUM && obj) {
                for (var i = 0; key = DONT_ENUM[i++]; ) {
                    if (obj.hasOwnProperty(key)) {
                        result.push(key)
                    }
                }
            }
            return result
        }
    }
    if (!Array.isArray) {
        Array.isArray = function(a) {
            return a && getType(a) === "array"
        }
    }

    if (!noop.bind) {
        Function.prototype.bind = function(scope) {
            if (arguments.length < 2 && scope === void 0)
                return this
            var fn = this,
                    argv = arguments
            return function() {
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
        return Function("fn,scope", fun)
    }
    if (!rnative.test([].map)) {
        avalon.mix(Array.prototype, {
            //Positioning. Return the index of the first element equals to the given item argument in the array
            indexOf: function(item, index) {
                var n = this.length,
                        i = ~~index
                if (i < 0)
                    i += n
                for (; i < n; i++)
                    if (this[i] === item)
                        return i
                return -1
            },
            //Backward positioning. Same as above but starts from the last element.
            lastIndexOf: function(item, index) {
                var n = this.length,
                        i = index == null ? n - 1 : index
                if (i < 0)
                    i = Math.max(0, n + i)
                for (; i >= 0; i--)
                    if (this[i] === item)
                        return i
                return -1
            },
            //Array iteration. Process each element in the array one by one with the given function. Same as the each() function in Prototype.js
            forEach: iterator('', '_', ''),
            //Array filtering. Check each element in the array with the given function. Return an array of elements that make the function return true.
            filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
            //Array collecting. Produce a new array of values by mapping each element in the original array through a transformation function. Same as the collect() function in Prototype.js
            map: iterator('r=[],', 'r[i]=_', 'return r'),
            //Returns true if at least one element in the array makes the testing function return true. Same as the any() function in Prototype.js
            some: iterator('', 'if(_)return true', 'return false'),
            //Returns true only when all elements in the array make the testing function returns true. Same as the all() function in Prototype.js
            every: iterator('', 'if(!_)return false', 'return true')
        })
    }
    if (!root.contains) { //safari5+ puts the contains() method on Element.prototype instead of Node.prototype.
        Node.prototype.contains = function(arg) {
            return !!(this.compareDocumentPosition(arg) & 16)
        }
    }
    /*********************************************************************
     *                      Configure                                 *
     **********************************************************************/

    function kernel(settings) {
        for (var p in settings) {
            if (!ohasOwn.call(settings, p))
                continue
            var val = settings[p]
            if (typeof kernel.plugins[p] === "function") {
                kernel.plugins[p](val)
            } else {
                kernel[p] = val
            }
        }
        return this
    }
    var openTag, closeTag, rexpr, rexprg, rbind, rregexp = /[-.*+?^${}()|[\]\/\\]/g

    function escapeRegExp(target) {
        //http://stevenlevithan.com/regex/xregexp/
        //Safely format a string to regular expression sourcecode.
        return (target + "").replace(rregexp, "\\$&")
    }
    var plugins = {
        alias: function(val) {
            var map = kernel.alias
            for (var c in val) {
                if (ohasOwn.call(val, c)) {
                    var prevValue = map[c]
                    var currValue = val[c]
                    if (prevValue) {
                        avalon.error("Caution: " + c + " has been rewriten")
                    }
                    map[c] = currValue
                }
            }
        },
        loader: function(bool) {
            if (bool) {
                window.define = innerRequire.define
                window.require = innerRequire
            } else {
                window.define = otherDefine
                window.require = otherRequire
            }
        },
        interpolate: function(array) {
            if (Array.isArray(array) && array[0] && array[1] && array[0] !== array[1]) {
                openTag = array[0]
                closeTag = array[1]
                var o = escapeRegExp(openTag),
                        c = escapeRegExp(closeTag)
                rexpr = new RegExp(o + "(.*?)" + c)
                rexprg = new RegExp(o + "(.*?)" + c, "g")
                rbind = new RegExp(o + ".*?" + c + "|\\sms-")
            }
        }
    }

    kernel.plugins = plugins

    kernel.plugins['interpolate'](["{{", "}}"])
    kernel.alias = {}
    avalon.config = kernel

    /*********************************************************************
     *      Prototype methods of the mini jQuery object                  *
     **********************************************************************/

    function hyphen(target) {
        //Convert to hyphen separated style
        return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
    }

    function camelize(target) {
        //Convert to camel case
        if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target // check early to improve performance of getStyle() and so on
        }
        return target.replace(/[-_][^-_]/g, function(match) {
            return match.charAt(1).toUpperCase()
        })
    }
    var rparse = /^(?:null|false|true|NaN|\{.*\}|\[.*\])$/
    var rnospaces = /\S+/g

    avalon.fn.mix({
        hasClass: function(cls) {
            var el = this[0] || {}
            if (el.nodeType === 1) {
                return !!el.className && (" " + el.className + " ").indexOf(" " + cls + " ") > -1
            }
        },
        addClass: function(cls) {
            var node = this[0]
            if (cls && typeof cls === "string" && node && node.nodeType === 1) {
                if (!node.className) {
                    node.className = cls
                } else {
                    var a = (node.className + " " + cls).match(rnospaces)
                    a.sort()
                    for (var j = a.length - 1; j > 0; --j)
                        if (a[j] === a[j - 1])
                            a.splice(j, 1)
                    node.className = a.join(" ")
                }
            }
            return this
        },
        removeClass: function(cls) {
            var node = this[0]
            if (cls && typeof cls > "o" && node && node.nodeType === 1 && node.className) {
                var classNames = (cls || "").match(rnospaces) || []
                var cl = classNames.length
                var set = " " + node.className.match(rnospaces).join(" ") + " "
                for (var c = 0; c < cl; c++) {
                    set = set.replace(" " + classNames[c] + " ", " ")
                }
                node.className = set.slice(1, set.length - 1)
            }
            return this
        },
        toggleClass: function(value, stateVal) {
            var state = stateVal,
                    className, i = 0
            var classNames = value.match(rnospaces) || []
            var isBool = typeof stateVal === "boolean"
            while ((className = classNames[i++])) {
                state = isBool ? state : !this.hasClass(className)
                this[state ? "addClass" : "removeClass"](className)
            }
            return this
        },
        attr: function(name, value) {
            if (arguments.length === 2) {
                this[0].setAttribute(name, value)
                return this
            } else {
                return this[0].getAttribute(name)
            }
        },
        data: function(name, value) {
            name = "data-" + hyphen(name || "")
            switch (arguments.length) {
                case 2:
                    this.attr(name, value)
                    return this
                case 1:
                    var val = this.attr(name)
                    return parseData(val)
                case 0:
                    var attrs = this[0].attributes,
                            ret = {}
                    for (var i = 0, attr; attr = attrs[i++]; ) {
                        name = attr.name
                        if (!name.indexOf("data-")) {
                            name = camelize(name.slice(5))
                            ret[name] = parseData(attr.value)
                        }
                    }
                    return ret
            }
        },
        removeData: function(name) {
            name = "data-" + hyphen(name)
            this[0].removeAttribute(name)
            return this
        },
        css: function(name, value) {
            return avalon.css(this, name, value)
        },
        position: function() {
            var offsetParent, offset,
                    elem = this[0],
                    parentOffset = {
                top: 0,
                left: 0
            };
            if (!elem) {
                return;
            }
            if (this.css("position") === "fixed") {
                offset = elem.getBoundingClientRect();
            } else {
                offsetParent = this.offsetParent(); //Obtain the real offsetParent
                offset = this.offset(); // Obtain the right offsetParent
                if (offsetParent[0].tagName !== "HTML") {
                    parentOffset = offsetParent.offset();
                }
                parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true);
                parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true);
            }
            return {
                top: offset.top - parentOffset.top - avalon.css(elem, "marginTop", true),
                left: offset.left - parentOffset.left - avalon.css(elem, "marginLeft", true)
            };
        },
        offsetParent: function() {
            var offsetParent = this[0].offsetParent || root;
            while (offsetParent && (offsetParent.tagName !== "HTML") && avalon.css(offsetParent, "position") === "static") {
                offsetParent = offsetParent.offsetParent;
            }
            return avalon(offsetParent || root);
        },
        bind: function(type, fn, phase) {
            if (this[0]) {
                return avalon.bind(this[0], type, fn, phase)
            }
        },
        unbind: function(type, fn, phase) {
            if (this[0]) {
                avalon.unbind(this[0], type, fn, phase)
            }
            return this
        },
        val: function(value) {
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

    function parseData(val) {
        var _eval = false
        if (rparse.test(val) || +val + "" === val) {
            _eval = true
        }
        try {
            return _eval ? eval("0," + val) : val
        } catch (e) {
            return val
        }
    }
    //Generate avalon.fn.scrollLeft, avalon.fn.scrollTop methods
    avalon.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node),
                    top = method === "scrollTop";
            if (!arguments.length) {
                return win ? (prop in win) ? win[prop] : document.documentElement[method] : node[method];
            } else {
                if (win) {
                    win.scrollTo(!top ? val : avalon(win).scrollLeft(), top ? val : avalon(win).scrollTop())
                } else {
                    node[method] = val;
                }
            }
        }
    })

    function getWindow(node) {
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView || node.parentWindow : false;
    }
    //============================= css related =======================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
    var cssMap = {
        "float": 'cssFloat' in root.style ? 'cssFloat' : 'styleFloat',
        background: "backgroundColor"
    }
    var cssNumber = oneObject("columnCount,order,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

    function cssName(name, host, camelCase) {
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
    cssHooks["@:set"] = function(node, name, value) {
        try { //node.style.width = NaN;node.style.width = "xxxxxxx";node.style.width = undefine will throw exception in legacy IEs
            node.style[name] = value
        } catch (e) {
        }
    }
    if (window.getComputedStyle) {
        cssHooks["@:get"] = function(node, name) {
            var ret, styles = window.getComputedStyle(node, null)
            if (styles) {
                ret = name === "filter" ? styles.getPropertyValue(name) : styles[name]
                if (ret === "") {
                    ret = node.style[name] //We need to retrieve inline styles manually in other browsers
                }
            }
            return ret
        }
        cssHooks["opacity:get"] = function(node) {
            var ret = cssHooks["@:get"](node, "opacity")
            return ret === "" ? "1" : ret
        }
    } else {
        var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
        var rposition = /^(top|right|bottom|left)$/
        var ie8 = !!window.XDomainRequest
        var salpha = "DXImageTransform.Microsoft.Alpha"
        var border = {
            thin: ie8 ? '1px' : '2px',
            medium: ie8 ? '3px' : '4px',
            thick: ie8 ? '5px' : '6px'
        }
        cssHooks["@:get"] = function(node, name) {
            //retrieve the original value but it might includes units such as em, pc, mm, pt, or %.
            var currentStyle = node.currentStyle
            var ret = currentStyle[name]
            if ((rnumnonpx.test(ret) && !rposition.test(ret))) {
                //(1) Store the original style.left, runtimeStyle.left
                var style = node.style,
                        left = style.left,
                        rsLeft = node.runtimeStyle.left
                //(2) The style.left = xxx in point (3) below will affect currentStyle.left.
                // so we save currentStyle.left in runtimeStyle.left
                // runtimeStyle.left has the highest precedence so that it won't be affectted by style.left
                node.runtimeStyle.left = currentStyle.left

                //(3) Set the precise value into style.left, then acquire the result in "px" through
                // the private property style.pixelLeft in IE.
                // The fontSize branch see http://bugs.jquery.com/ticket/760
                style.left = name === 'fontSize' ? '1em' : (ret || 0)
                ret = style.pixelLeft + "px"
                //(4) Restore style.left, runtimeStyle.left
                style.left = left
                node.runtimeStyle.left = rsLeft
            }
            if (ret === "medium") {
                name = name.replace("Width", "Style")
                //border width default to medium, even though it is 0
                if (currentStyle[name] === "none") {
                    ret = "0px"
                }
            }
            return ret === "" ? "auto" : border[ret] || ret
        }
        cssHooks["opacity:set"] = function(node, name, value) {
            node.style.filter = 'alpha(opacity=' + value * 100 + ')'
            node.style.zoom = 1
        }
        cssHooks["opacity:get"] = function(node) {
            //This is the quickest way to obtain the opacity in IE, no regular expression needed.
            var alpha = node.filters.alpha || node.filters[salpha],
                    op = alpha ? alpha.opacity : 100
            return (op / 100) + "" //Make sure return a String
        }
    }

    "top,left".replace(rword, function(name) {
        cssHooks[name + ":get"] = function(node) {
            var computed = cssHooks["@:get"](node, name)
            return /px$/.test(computed) ? computed :
                    avalon(node).position()[name] + "px"
        }
    })
    "Width,Height".replace(rword, function(name) {
        var method = name.toLowerCase(),
                clientProp = "client" + name,
                scrollProp = "scroll" + name,
                offsetProp = "offset" + name
        avalon.fn[method] = function(value) {
            var node = this[0]
            if (arguments.length === 0) {
                if (node.setTimeout) { //Get the window size, can be replaced by node.innerWidth/innerHeight in IE9+
                    return node["inner" + name] || node.document.documentElement[clientProp]
                }
                if (node.nodeType === 9) { //Get the page size
                    var doc = node.documentElement
                    //FF chrome    html.scrollHeight< body.scrollHeight
                    //IE standard mode: html.scrollHeight> body.scrollHeight
                    //IE quirk mode: html.scrollHeight (the maximum value is slightly bigger than the window viewport?)
                    return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
                }
                return parseFloat(this.css(method)) || 0
            } else {
                return this.css(method, value)
            }
        }
    })
    avalon.fn.offset = function() { //Get the position offset to the top-left conner of the page
        var node = this[0],
                doc = node && node.ownerDocument
        var pos = {
            left: 0,
            top: 0
        }
        if (!doc) {
            return pos
        }
        //http://hkom.blog1.fc2.com/?mode=m&no=750 offset of body does not include margin
        //We can obtain the element rect relative to the client through getBoundingClientRect.
        //http://msdn.microsoft.com/en-us/library/ms536433.aspx
        var box = node.getBoundingClientRect(),
                //chrome1+, firefox3+, ie4+, opera(yes) safari4+
                win = doc.defaultView || doc.parentWindow,
                root = (navigator.vendor || doc.compatMode === "BackCompat") ? doc.body : doc.documentElement,
                clientTop = root.clientTop >> 0,
                clientLeft = root.clientLeft >> 0,
                scrollTop = win.pageYOffset || root.scrollTop,
                scrollLeft = win.pageXOffset || root.scrollLeft
        // Add scroll distance into left and top
        // Some IE version may add a border of 2px to some html elements, we have to manually remove it.
        // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
        pos.top = box.top + scrollTop - clientTop
        pos.left = box.left + scrollLeft - clientLeft
        return pos
    }

    //=============================val relative=======================

    function getValType(el) {
        var ret = el.tagName.toLowerCase()
        return ret === "input" && /checkbox|radio/.test(el.type) ? "checked" : ret
    }
    var valHooks = {
        "option:get": function(node) {
            // In IE9-10, if the value of a option element is undefined and you assigned a string with leading or tailing
            // whitespace to its innerText property, when you get el.text the browser will return a trimmed version of
            // the string and mock the value attribute with the trimmed string plus some leading and tailing whitespace.
            if (node.hasAttribute) {
                return node.hasAttribute("value") ? node.value : node.text
            }
            var val = node.attributes.value //"specified" is not reliable because it always returns true in modern browsers, we need hasAttribute here.
            return val === void 0 ? node.text : val.specified ? node.value : node.text
        },
        "select:get": function(node, value) {
            var option, options = node.options,
                    index = node.selectedIndex,
                    getter = valHooks["option:get"],
                    one = node.type === "select-one" || index < 0,
                    values = one ? null : [],
                    max = one ? index + 1 : options.length,
                    i = index < 0 ? max : one ? index : 0
            for (; i < max; i++) {
                option = options[i]
                //Old IEs' selected will not be changed after reset, need to check by i == index instead
                //We filtered all disabled options elements. But in Safari5, when you set a select element as disabled, all its children will be disabled .
                //Hence when we find a disabled option, we need to check whether it is set disabled explicitly and check the disabled state of its parent
                if ((option.selected || i === index) && !option.disabled) {
                    value = getter(option)
                    if (one) {
                        return value
                    }
                    //Collect all the selected values and return them in an array
                    values.push(value)
                }
            }
            return values
        },
        "select:set": function(node, values) {
            values = [].concat(values) //Convert to array
            var getter = valHooks["option:get"]
            for (var i = 0, el; el = node.options[i++]; ) {
                el.selected = !!~values.indexOf(getter(el))
            }
            if (!values.length) {
                node.selectedIndex = -1
            }
        }
    }

    /*********************************************************************
     *                          Array Helper                          *
     **********************************************************************/
    avalon.Array = {
        sortBy: function(target, fn, scope, trend) {
            //Sort by the specific criterion, usually used on arrays
            //Default in ascendant order
            trend === typeof trend === "boolean" ? trend : false
            var array = target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                }
            }).sort(function(left, right) {
                var a = left.re,
                        b = right.re
                var ret = a < b ? -1 : a > b ? 1 : 0
                return trend ? ret : ret * -1
            })
            return avalon.Array.pluck(array, 'el')
        },
        pluck: function(target, name) {
            //Obtain the specific property on each element in an object array and return them as an array
            return target.filter(function(item) {
                return item[name] !== void 0
            })
        },
        ensure: function(target) {
            //Push element(s) into an array only when it is not already in the array
            var args = aslice.call(arguments, 1)
            args.forEach(function(el) {
                if (!~target.indexOf(el)) {
                    target.push(el)
                }
            })
            return target
        },
        removeAt: function(target, index) {
            //remove an element of the specific index in the array, returns true if the removal successes, false otherwise
            return !!target.splice(index, 1).length
        },
        remove: function(target, item) {
            //Remove the first matched element in an array, returns true if the removal successes, false otherwise
            var index = target.indexOf(item)
            if (~index)
                return avalon.Array.removeAt(target, index)
            return false
        }
    }
    /************************************************************************
     *                                parseHTML                              *
     ************************************************************************/
    var rtagName = /<([\w:]+)/,
            //acquire the tagName
            rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
            rcreate = W3C ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig,
            scriptTypes = oneObject("text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript", "text/vbscript"),
            //Tags may be nested
            rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/
    //helper variables for parseHTML
    var tagHooks = {
        area: [1, "<map>"],
        param: [1, "<object>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</table>"],
        legend: [1, "<fieldset>"],
        option: [1, "<select multiple='multiple'>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>"],
        td: [3, "<table><tbody><tr>"],
        //When using innerHTML to generate nodes in IE6-8, no-scope elements and new HTML5 tags cannot be created directly
        _default: W3C ? [0, ""] : [1, "X<div>"] //Closing div tag is not mandatory
    }
    tagHooks.optgroup = tagHooks.option
    tagHooks.tbody = tagHooks.tfoot = tagHooks.colgroup = tagHooks.caption = tagHooks.thead
    tagHooks.th = tagHooks.td
    avalon.clearChild = function(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
        return node
    }
    avalon.parseHTML = function(html) {
        html = html.replace(rxhtml, "<$1></$2>").trim()
        var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
                //acquire the tag name
                wrap = tagHooks[tag] || tagHooks._default,
                fragment = documentFragment.cloneNode(false),
                wrapper = domParser,
                firstChild
        if (!W3C) { //IE fix
            html = html.replace(rcreate, "<br class=fix_noscope>$1") //Add a patch before "link", "style", and "script" tags
        }
        wrapper.innerHTML = wrap[1] + html + (wrap[2] || "")
        var els = wrapper.getElementsByTagName("script")
        if (els.length) { //script nodes generated by innerHTML will not send out request or execute the text property
            var script = DOC.createElement("script"),
                    neo
            for (var i = 0, el; el = els[i++]; ) {
                if (!el.type || scriptTypes[el.type]) { //if the MIME of a script tag allow it to be executed
                    neo = script.cloneNode(false) //Cannot omit parameters in FF
                    for (var j = 0, attr; attr = el.attributes[j++]; ) {
                        if (attr.specified) { //Copy the property
                            neo[attr.name] = attr.value
                        }
                    }
                    neo.text = el.text //Must be specified as it is not in the attributes iteration
                    el.parentNode.replaceChild(neo, el) //replace the node
                }
            }
        }
        //remove tags we added to satisfy nesting matches
        for (i = wrap[0]; i--; wrapper = wrapper.lastChild) {
        }
        if (!W3C) { //fix IE
            for (els = wrapper["getElementsByTagName"]("br"), i = 0; el = els[i++]; ) {
                if (el.className && el.className === "fix_noscope") {
                    el.parentNode.removeChild(el)
                }
            }
        }
        while (firstChild = wrapper.firstChild) { //move the nodes in wrapper to document fragment
            fragment.appendChild(firstChild)
        }
        return fragment
    }
    avalon.innerHTML = function(node, html) {
        if (!W3C && (!rcreate.test(html) && !rnest.test(html))) {
            try {
                node.innerHTML = html;
                return
            } catch (e) {
            }
        }
        var a = this.parseHTML(html)
        this.clearChild(node).appendChild(a)
    }
    /*********************************************************************
     *                           Define                                 *
     **********************************************************************/

    avalon.define = function(name, factory) {
        var args = aslice.call(arguments)
        if (typeof name !== "string") {
            name = generateID()
            args.unshift(name)
        }
        if (typeof args[1] !== "function") {
            avalon.error("factory must be a function.")
        }
        factory = args[1]
        var scope = {
            $watch: noop
        }
        factory(scope) //acquire all definitions
        var model = modelFactory(scope) //transform the scope into model
        stopRepeatAssign = true
        factory(model)
        stopRepeatAssign = false
        model.$id = name
        return VMODELS[name] = model
    }
    var Observable = {
        $watch: function(type, callback) {
            if (typeof callback === "function") {
                var callbacks = this.$events[type]
                if (callbacks) {
                    callbacks.push(callback)
                } else {
                    this.$events[type] = [callback]
                }
            } else { //Resume watching modification of the first layer of simple properties
                this.$events = this.$watch.backup
            }
            return this
        },
        $unwatch: function(type, callback) {
            var n = arguments.length
            if (n === 0) { // Make all $watch callbacks on this VM stop listening
                this.$watch.backup = this.$events
                this.$events = {}
            } else if (n === 1) {
                this.$events[type] = []
            } else {
                var callbacks = this.$events[type] || []
                var i = callbacks.length
                while (~--i < 0) {
                    if (callbacks[i] === callback) {
                        return callbacks.splice(i, 1)
                    }
                }
            }
            return this
        },
        $fire: function(type) {
            var callbacks = this.$events[type] || []
            var all = this.$events.$all || []
            var args = aslice.call(arguments, 1)

            for (var i = 0, callback; callback = callbacks[i++]; ) {
                callback.apply(this, args)
            }
            for (var i = 0, callback; callback = all[i++]; ) {
                callback.apply(this, args)
            }
        }
    }

    function updateViewModel(a, b, valueType) {
        //a is the original VM, b is the new array or object
        if (valueType === "array") {
            var an = a.length,
                    bn = b.length
            if (an > bn) {
                a.splice(bn, an - bn)
            } else if (bn > an) {
                a.push.apply(a, b.slice(an))
            }
            var n = Math.min(an, bn)
            for (var i = 0; i < n; i++) {
                a.set(i, b[i])
            }
            return a
        } else {
            var added = [],
                    removed = [],
                    updated = [],
                    astr = [],
                    bstr = [],
                    iterators = a[subscribers]
            var amodel = a.$model
            //obtain the key-value pairs to be removed
            for (var i in amodel) {
                if (!b || !b.hasOwnProperty(i)) {
                    removed.push(i)
                    delete amodel[i]
                }
            }
            //obtain the key-value pairs to be added and their order
            for (var i in b) {
                if (b.hasOwnProperty(i) && i !== "hasOwnProperty") {
                    if (!a.hasOwnProperty(i)) {
                        added.push(i)
                    }
                    bstr.push(i)
                }
            }
            //obtains the key-value pairs to be updated and their order
            for (var i in amodel) {
                if (amodel.hasOwnProperty(i)) {
                    astr.push(i)
                    if (amodel[i] !== b[i]) {
                        updated.push(i)
                    }
                }
            }

            iterators.forEach(function(fn) {
                fn("remove", removed)
            })

            iterators.forEach(function(fn) {
                fn("add", b)
            })
            if (updated.length) {

                updated.forEach(function(i) {
                    var valueType = getType(b[i])
                    if (rchecktype.test(valueType)) {
                        updateViewModel(a[i], b[i], valueType)
                    } else {
                        a[i] = b[i]
                    }
                })
            }
            if (astr.join(";") !== bstr.join(";")) {

                iterators.forEach(function(fn) {
                    fn("sort", bstr.slice(0), astr)
                })
            }
            var events = a.$events //wait for all $watch callbacks to be bound before removal
            if (added.length || removed.length) {
                var scope = a.$model
                //Remove key-value pairs that have already been deleted
                for (var i = 0, name; name = removed[i++]; ) {
                    delete scope[name]
                    delete events[name]
                    delete a.$accessor[name]
                }
                for (i = 0, name; name = added[i++]; ) {
                    scope[name] = b[name]
                }
                a = modelFactory(scope, scope, {}, a.$accessor)
            }
            a[subscribers] = iterators //replace the subscribers list
            iterators.forEach(function(fn) {
                fn.host = a  //replace the host (VM) of the view refreshing function in the subscribers list
            })
            a.$events = events //replace the original $watch callback
            return a
        }
    }
    var isEqual = function(x, y) {
        if (x === y) {
            return x instanceof Date ? x - 0 === y - 0 : !0
        }
        return x !== x && y !== y
    }
    var unwatchOne = oneObject("$id,$skipArray,$watch,$unwatch,$fire,$events,$model,$accessor," + subscribers)

    function modelFactory(scope, model, watchMore, oldAccessores) {
        if (Array.isArray(scope)) {
            var collection = Collection(scope)
            collection._add(scope)
            return collection
        }
        var skipArray = scope.$skipArray, //properties to be skipped watching
                vmodel = {}, //The object to be returned
                accessores = {}, //internal object used in converting
                callSetters = [],
                callGetters = [],
                VBPublics = Object.keys(unwatchOne) //used in IE6-8
        model = model || {} //the $model property on vmodel
        watchMore = watchMore || {} //properties starts with $ but forced to be watched
        skipArray = Array.isArray(skipArray) ? skipArray.concat(VBPublics) : VBPublics

        function loop(name, val) {
            if (!unwatchOne[name]) {
                model[name] = val
            }
            var valueType = getType(val)
            if (valueType === "function") {
                VBPublics.push(name) //function doesn't need to be converted
            } else {
                if (skipArray.indexOf(name) !== -1 || (name.charAt(0) === "$" && !watchMore[name])) {
                    return VBPublics.push(name)
                }
                var accessor, oldArgs
                if (valueType === "object" && typeof val.get === "function" && Object.keys(val).length <= 2) {
                    var setter = val.set
                    var getter = val.get
                    accessor = function(neo) { //create a calculated property. Its update is triggered by other watched properties
                        var value = accessor.value,
                                preValue = value
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //prevent redundant assignment
                            }
                            if (typeof setter === "function") {
                                var backup = vmodel.$events[name]
                                vmodel.$events[name] = [] // clear callbacks. Prevent $fire being triggered multiple times by internal bubbling
                                setter.call(vmodel, neo)
                                vmodel.$events[name] = backup
                            }
                            if (!isEqual(oldArgs, neo)) { //Check if the passed-in argument are same as last time
                                oldArgs = neo
                                value = accessor.value = model[name] = getter.call(vmodel)
                                notifySubscribers(accessor) //notify top level to update
                                vmodel.$fire && vmodel.$fire(name, value, preValue)
                            }
                        } else {
                            if (openComputedCollect) { //collect view-refreshing functions
                                collectSubscribers(accessor)
                            }
                            neo = accessor.value = model[name] = getter.call(vmodel)
                            if (!isEqual(value, neo)) {
                                oldArgs = void 0
                                vmodel.$fire && vmodel.$fire(name, neo, value)
                            }
                            return neo
                        }
                    }
                    callGetters.push(accessor)
                } else {
                    accessor = function(neo) { //create a calculated property. Its update is triggered by other watched properties
                        var value = accessor.value,
                                preValue = value,
                                complexValue
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //prevent redundant assignment
                            }
                            if (!isEqual(value, neo)) {
                                if (rchecktype.test(valueType)) {
                                    if ("value" in accessor) { //if has been replaced already
                                        value = updateViewModel(value, neo, valueType)
                                    } else { //pass through directly if it is a VM already, perform convertion otherwise
                                        value = neo.$model ? neo : modelFactory(neo, neo)
                                    }
                                    complexValue = value.$model
                                } else { //for other data types
                                    value = neo
                                }
                                accessor.value = value
                                model[name] = complexValue ? complexValue : value //update $model
                                notifySubscribers(accessor) //notify top level to update
                                if (!complexValue) {
                                    vmodel.$fire && vmodel.$fire(name, value, preValue)
                                }
                            }
                        } else {
                            collectSubscribers(accessor) //Collect view-refreshing functions
                            return value
                        }
                    }
                    callSetters.push(name)
                }
                accessor[subscribers] = [] //Array for subscribers
                accessores[name] = {
                    set: accessor,
                    get: accessor,
                    enumerable: true
                }
            }
        }
        for (var i in scope) {
            loop(i, scope[i])
        }
        if (oldAccessores) {
            for (var i in oldAccessores) {
                accessores[i] = oldAccessores[i]
            }
        }
        vmodel = defineProperties(vmodel, accessores, VBPublics) //Create an empty ViewModel
        VBPublics.forEach(function(name) {
            if (!unwatchOne[name]) { //Assign non-watchable properties (e.g. function) first
                vmodel[name] = scope[name]
            }
        })
        callSetters.forEach(function(prop) { //Then assign watched properties
            vmodel[prop] = scope[prop]
        })
        callGetters.forEach(function(fn) { //In the end force properties to be calculated and update their own value
            Registry[expose] = fn
            fn()
            collectSubscribers(fn)
            delete Registry[expose]
        })
        vmodel.$model = model
        vmodel.$events = {}
        vmodel.$id = generateID()
        vmodel.$accessor = accessores
        vmodel[subscribers] = []
        for (var i in Observable) {
            var fn = Observable[i]
            if (!W3C) { //A patch only for IE678 only since in VB object methods 'this' does not refer to the caller object itself, we need to bind it first.
                fn = fn.bind(vmodel)
            }
            vmodel[i] = fn
        }
        vmodel.hasOwnProperty = function(name) {
            return name in vmodel.$model
        }
        return vmodel
    }
    var defineProperty = Object.defineProperty
    //if the browser doesn't support Object.defineProperties in ecma262v5 or buggy (e.g. IE8)
    //For standard browsers, implemented by __defineGetter__ and __defineSetter__
    try {
        defineProperty({}, "_", {
            value: "x"
        })
        var defineProperties = Object.defineProperties
    } catch (e) {
        if ("__defineGetter__" in avalon) {
            defineProperty = function(obj, prop, desc) {
                if ('value' in desc) {
                    obj[prop] = desc.value
                }
                if ('get' in desc) {
                    obj.__defineGetter__(prop, desc.get)
                }
                if ('set' in desc) {
                    obj.__defineSetter__(prop, desc.set)
                }
                return obj
            }
            defineProperties = function(obj, descs) {
                for (var prop in descs) {
                    if (descs.hasOwnProperty(prop)) {
                        defineProperty(obj, prop, descs[prop])
                    }
                }
                return obj
            }
        }
    }
    //For IE6-8, implemented by set/get statements in VB
    if (!defineProperties && window.VBArray) {
        window.execScript([
            "Function parseVB(code)",
            "\tExecuteGlobal(code)",
            "End Function"
        ].join("\n"), "VBScript")

        function VBMediator(description, name, value) {
            var fn = description[name] && description[name].set
            if (arguments.length === 3) {
                fn(value)
            } else {
                return fn()
            }
        }
        defineProperties = function(publics, description, array) {
            publics = array.slice(0)
            publics.push("hasOwnProperty")
            var className = "VBClass" + setTimeout("1"),
                    owner = {}, buffer = []
            buffer.push(
                    "Class " + className,
                    "\tPrivate [__data__], [__proxy__]",
                    "\tPublic Default Function [__const__](d, p)",
                    "\t\tSet [__data__] = d: set [__proxy__] = p",
                    "\t\tSet [__const__] = Me", //Chained invocation
                    "\tEnd Function")
            publics.forEach(function(name) { //insert public properties, here is the last chance for it
                if (owner[name] !== true) {
                    owner[name] = true //Because properties in VBScript object cannot be added or removed freely like those in JS
                    buffer.push("\tPublic [" + name + "]") //You can put them to skipArray beforehand
                }
            })
            for (var name in description) {
                owner[name] = true
                buffer.push(
                        //use both set and let because we have no idea what the client passing in
                        "\tPublic Property Let [" + name + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Set [" + name + "](val)", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Get [" + name + "]", //getter
                        "\tOn Error Resume Next", //must try the set statement first, or arrays will be mistakenly returned as String
                        "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Property")
            }
            buffer.push("End Class") //Finished class definition
            buffer.push(
                    "Function " + className + "Factory(a, b)", //Create a new instance and pass in two crucial arguments
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function")
            window.parseVB(buffer.join("\r\n")) //Create a VB class factory first
            return window[className + "Factory"](description, VBMediator) //get its product
        }
    }

    function registerSubscriber(updateView, element) {
        avalon.nextTick(function() {
            updateView.element = element
            Registry[expose] = updateView //Expose this function to make collectSubscribers easier
            openComputedCollect = true
            updateView()
            openComputedCollect = false
            delete Registry[expose]
        })
    }

    function collectSubscribers(accessor) { //Collect subscribers depends on this accessor
        if (Registry[expose]) {
            var list = accessor[subscribers]
            list && avalon.Array.ensure(list, Registry[expose]) //only push the element when it is not in the array already
        }
    }


    function notifySubscribers(accessor, el) { //Notify the subscribers depending on the accessor to refresh themselves
        var list = accessor[subscribers]
        if (list && list.length) {
            var args = aslice.call(arguments, 1)
            var safelist = list.concat()
            for (var i = 0, fn; fn = safelist[i++]; ) {
                el = fn.element
                if (el && (!el.noRemove) && (el.sourceIndex === 0 || el.parentNode === null)) {
                    avalon.Array.remove(list, fn)
                    log(fn + "")
                } else {
                    fn.apply(0, args) //Force self-recalculation
                }
            }
        }
    }
    /*********************************************************************
     *                           Scan                                     *
     **********************************************************************/
    avalon.scan = function(elem, vmodel) {
        elem = elem || root
        var vmodels = vmodel ? [].concat(vmodel) : []
        scanTag(elem, vmodels)
    }


    function scanNodes(parent, vmodels) {
        var nodes = []
        for (var i = 0, node; node = parent.childNodes[i++]; ) {
            nodes.push(node)
        }
        for (var i = 0; node = nodes[i++]; ) {
            if (node.nodeType === 1) {
                scanTag(node, vmodels) //Scan element nodes
            } else if (node.nodeType === 3) {
                scanText(node, vmodels) //Scan text nodes
            }
        }
    }

    var stopScan = oneObject("area,base,basefont,br,col,hr,img,input,link,meta,param,embed,wbr,script,style,textarea")


    function scanTag(elem, vmodels) {
        vmodels = vmodels || []
        //Scanning order:  ms-skip --> ms-important --> ms-controller --> ms-if --> ...
        var a = elem.getAttribute(prefix + "skip")
        var b = elem.getAttribute(prefix + "important")
        var c = elem.getAttribute(prefix + "controller")
        if (typeof a === "string") {
            return
        } else if (b) {
            if (!VMODELS[b]) {
                return
            }
            vmodels = [VMODELS[b]] //Parent VM not included
            elem.removeAttribute(prefix + "important")
        } else if (c) {
            var newVmodel = VMODELS[c] //Child VM depends on parent VM. It makes no sense to scan the child VM when the parent VM is absent
            if (!newVmodel) {
                return
            }
            vmodels = [newVmodel].concat(vmodels)
            elem.removeAttribute(prefix + "controller")
        }
        scanAttr(elem, vmodels, function() {  //Scan attributes
            if (!stopScan[elem.tagName.toLowerCase()] && rbind.test(elem.innerHTML)) {
                scanNodes(elem, vmodels)  //Scan enclosing elements
            }
        })

    }

    function scanText(textNode, vmodels) {
        var bindings = extractTextBindings(textNode)
        if (bindings.length) {
            executeBindings(bindings, vmodels)
        }
    }

    var rfilters = /\|\s*(\w+)\s*(\([^)]*\))?/g

    function scanExpr(str) {
        var tokens = [],
                value, start = 0,
                stop
        if (rexpr.test(str)) {
            do {
                stop = str.indexOf(openTag, start)
                if (stop === -1) {
                    break
                }
                value = str.slice(start, stop)
                if (value) { // Text on the left of {{
                    tokens.push({
                        value: value,
                        expr: false
                    })
                }
                start = stop + openTag.length
                stop = str.indexOf(closeTag, start)
                if (stop === -1) {
                    break
                }
                value = str.slice(start, stop)
                if (value) { //Expression between{{ }}
                    var leach = []
                    if (value.indexOf("|") > 0) { // Extract filters, be aware to remove short circuits
                        value = value.replace(rfilters, function(c, d, e) {
                            leach.push(d + (e || ""))
                            return ""
                        })
                    }
                    tokens.push({
                        value: value,
                        expr: true,
                        filters: leach.length ? leach : void 0
                    })
                }
                start = stop + closeTag.length
            } while (1)
            value = str.slice(start)
            if (value) { //Text on the right of }}
                tokens.push({
                    value: value,
                    expr: false
                })
            }
        }
        return tokens
    }


    function scanAttr(el, vmodels, callback) {
        var bindings = [],
                ifBinding
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                if (attr.name.indexOf(prefix) !== -1) {
                    //If named with the specified prefix
                    var array = attr.name.split("-")
                    var type = array[1]
                    if (typeof bindingHandlers[type] === "function") {
                        var binding = {
                            type: type,
                            param: array.slice(2).join("-"),
                            element: el,
                            remove: true,
                            node: attr,
                            value: attr.nodeValue
                        }
                        if (attr.name === "ms-if") {
                            ifBinding = binding
                        } else {
                            bindings.push(binding)
                        }
                    }
                }
            }
        }
        if (ifBinding) {
            //The "if" binding has the highest precedence, if the expression bound to "if" evaluated as false,
            // we skip processing binding properties on the current element and stop scanning child nodes
            bindingHandlers["if"](ifBinding, vmodels, function() {
                executeBindings(bindings, vmodels)
                callback()
            })
        } else {
            executeBindings(bindings, vmodels)
            callback()
        }
    }

    function executeBindings(bindings, vmodels) {
        bindings.forEach(function(data) {
            bindingHandlers[data.type](data, vmodels)
            if (data.remove) { //Remove binding attributes to prevent the element being parsed again
                data.element.removeAttributeNode(data.node)
            }
            data.remove = true
        })
        bindings.length = 0
    }

    function extractTextBindings(textNode) {
        var bindings = [],
                tokens = scanExpr(textNode.nodeValue)
        if (tokens.length) {
            while (tokens.length) { //Convert text into text node and replace the original text node with it
                var token = tokens.shift()
                var node = DOC.createTextNode(token.value)
                if (token.expr) {
                    var filters = token.filters
                    var binding = {
                        type: "text",
                        node: node,
                        param: "",
                        element: textNode.parentNode,
                        value: token.value,
                        filters: filters
                    }
                    if (filters && filters.indexOf("html") !== -1) {
                        avalon.Array.remove(filters, "html")
                        binding.type = "html"
                        binding.replaceNodes = [node]
                    }
                    bindings.push(binding) //Collect text contains inline expression
                }
                documentFragment.appendChild(node)
            }
            textNode.parentNode.replaceChild(documentFragment, textNode)
        }
        return bindings
    }

    /*********************************************************************
     *                          Parse                                    *
     **********************************************************************/

    var keywords =
            // keywords
            'break,case,catch,continue,debugger,default,delete,do,else,false' + ',finally,for,function,if,in,instanceof,new,null,return,switch,this' + ',throw,true,try,typeof,var,void,while,with'
            // reserved words
            + ',abstract,boolean,byte,char,class,const,double,enum,export,extends' + ',final,float,goto,implements,import,int,interface,long,native' + ',package,private,protected,public,short,static,super,synchronized' + ',throws,transient,volatile'

            // ECMA 5 - use strict
            + ',arguments,let,yield'

            + ',undefined'
    var rrexpstr = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g
    var rsplit = /[^\w$]+/g
    var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
    var rnumber = /\b\d[^,]*/g
    var rcomma = /^,+|,+$/g
    var getVariables = function(code) {
        code = code
                .replace(rrexpstr, '')
                .replace(rsplit, ',')
                .replace(rkeywords, '')
                .replace(rnumber, '')
                .replace(rcomma, '')

        return code ? code.split(/,+/) : []
    }

    //Add assignment statement

    function addAssign(vars, scope, name) {
        var ret = [],
                prefix = " = " + name + "."
        for (var i = vars.length; name = vars[--i]; ) {
            name = vars[i]
            if (scope.hasOwnProperty(name)) {
                ret.push(name + prefix + name)
                vars.splice(i, 1)
            }
        }
        return ret

    }

    function uniqArray(arr, vm) {
        var length = arr.length
        if (length <= 1) {
            return arr
        } else if (length === 2) {
            return arr[0] !== arr[1] ? arr : [arr[0]]
        }
        var uniq = {}
        return arr.filter(function(el) {
            var key = vm ? el && el.$id : el
            if (!uniq[key]) {
                uniq[key] = 1
                return true
            }
            return false
        })
    }
    //Obtain the evaluation function and its arguments

    function parseExpr(code, scopes, data, four) {
        if (four === "setget") {
            var fn = Function("a", "b", "if(arguments.length === 2){\n\ta." + code + " = b;\n }else{\n\treturn a." + code + ";\n}")
            args = scopes
        } else {
            var vars = getVariables(code),
                    assigns = [],
                    names = [],
                    args = [],
                    prefix = ""
            //args is a object array, names are arguments of the evaluation function to be generated
            vars = uniqArray(vars), scopes = uniqArray(scopes, 1)

            for (var i = 0, n = scopes.length; i < n; i++) {
                if (vars.length) {
                    var name = "vm" + expose + "_" + i
                    names.push(name)
                    args.push(scopes[i])
                    assigns.push.apply(assigns, addAssign(vars, scopes[i], name))
                }
            }
            var prefix = assigns.join(", ")

            if (prefix) {
                prefix = "var " + prefix
            }
            if (data.type === "on") {
                code = code.replace("(", ".call(this,")
                if (four === "$event") {
                    names.push(four)
                }
            }
            if (data.filters) {
                code = "\nvar ret" + expose + " = " + code
                var textBuffer = [],
                        fargs
                textBuffer.push(code, "\r\n")
                for (var i = 0, fname; fname = data.filters[i++]; ) {
                    var start = fname.indexOf("(")
                    if (start !== -1) {
                        fargs = fname.slice(start + 1, fname.lastIndexOf(")")).trim()
                        fargs = "," + fargs
                        fname = fname.slice(0, start).trim()
                    } else {
                        fargs = ""
                    }
                    textBuffer.push(" if(filters", expose, ".", fname, "){\n\ttry{\nret", expose,
                            " = filters", expose, ".", fname, "(ret", expose, fargs, ")\n\t}catch(e){} \n}\n")
                }
                code = textBuffer.join("")
                code += "\nreturn ret" + expose
                names.push("filters" + expose)
                args.push(avalon.filters)
                delete data.filters //release memory
            } else {
                code = "\nreturn " + code + ";" //Function("return ") is not working on the whole IE family, we need Function("return;") here
            }
            try {
                fn = Function.apply(Function, names.concat("'use strict';\n" + prefix + code))
            } catch (e) {

            }
        }
        try {
            if (data.type !== "on" && four !== "setget") {
                fn.apply(fn, args)
            }
            return [fn, args]
        } catch (e) {
            delete data.remove
        } finally {
            textBuffer = names = null //release memory
        }
    }
    avalon.parseExpr = parseExpr

    function updateViewFactory(expr, scopes, data, callback, tokens) {
        var array, updateView
        if (!tokens) {
            array = parseExpr(expr, scopes, data)
            if (array) {
                var fn = array[0],
                        args = array[1]
                updateView = function() {
                    callback(fn.apply(fn, args), data.element)
                }
            }
        } else {
            array = tokens.map(function(token) {
                return token.expr ? parseExpr(token.value, scopes, data) || "" : token.value
            })
            updateView = (function(a, b) {
                return function() {
                    var ret = "",
                            fn
                    for (var i = 0, el; el = a[i++]; ) {
                        if (typeof el === "string") {
                            ret += el
                        } else {
                            fn = el[0]
                            ret += fn.apply(fn, el[1])
                        }
                    }
                    return b(ret, data.element)
                }
            })(array, callback)
        }
        if (updateView) {
            updateView.toString = function() {
                return data.type + " binding to eval(" + expr + ")"
            } //To make debugging easier
            //It is a very important spot here. We check whether the element inside view-refreshing function is actually in the DOM tree to decide
            //whether we need to take it out from the subscriber list
            registerSubscriber(updateView, data.element)
        }
    }

    avalon.updateViewFactory = updateViewFactory
    /*********************************************************************
     *                         Bind                                    *
     **********************************************************************/
    //Link the partial refresh area in the view and the ViewModel together with the binding function, generate updateView function
    //it internally holds the compiled compileFn function, forming a two-way binding. It is the top level of a two-way binding chain

    //stuff relates to visible binding
    var cacheDisplay = oneObject("a,abbr,b,span,strong,em,font,i,kbd", "inline")
    avalon.mix(cacheDisplay, oneObject("div,h1,h2,h3,h4,h5,h6,section,p", "block"))

    function parseDisplay(nodeName, val) {
        //obtain the default "display" value of these tags
        nodeName = nodeName.toLowerCase()
        if (!cacheDisplay[nodeName]) {
            var node = DOC.createElement(nodeName)
            root.appendChild(node)
            if (window.getComputedStyle) {
                val = window.getComputedStyle(node, null).display
            } else {
                val = node.currentStyle.display
            }
            root.removeChild(node)
            cacheDisplay[nodeName] = val
        }
        return cacheDisplay[nodeName]
    }
    var supportDisplay = (function(td) {
        return window.getComputedStyle ?
                window.getComputedStyle(td, null).display === "table-cell" : true
    })(DOC.createElement("td"))
    var domParser = DOC.createElement("div")
    domParser.setAttribute("className", "t")
    var fuckIEAttr = domParser.className === "t"
    var propMap = {
        "class": "className",
        "for": "htmlFor"
    }
    var rdash = /\(([^)]*)\)/
    var bindingHandlers = avalon.bindingHandlers = {
        "if": function(data, vmodels, callback) {
            callback = callback || avalon.noop
            var placehoder = DOC.createComment("@"),
                    elem = data.element,
                    parent
            if (!data._if) {
                data._if = 1
                if (root.contains(elem)) {
                    ifcall()
                } else {
                    var id = setInterval(function() {
                        if (root.contains(elem)) {
                            clearInterval(id)
                            ifcall()
                        }
                    }, 20)
                }
            }

            function ifcall() {
                parent = elem.parentNode
                updateViewFactory(data.value, vmodels, data, function(val) {
                    if (val) { //Add. Insert it into the DOM tree if it is not in the tree.
                        if (!root.contains(elem)) {
                            parent.replaceChild(elem, placehoder)
                            elem.noRemove = 0
                        }
                        avalon.nextTick(callback)
                    } else { //Remove. Remove it from the DOM tree if it is still in the tree
                        if (root.contains(elem)) {
                            parent.replaceChild(placehoder, elem)
                            elem.noRemove = 1
                        }
                    }
                })
            }
        },
        // ms-attr-class="xxx" vm.xxx="aaa bbb ccc" Set the "className" of the element to aaa bbb ccc
        // ms-attr-class="xxx" vm.xxx=false Clear all classNames of the element
        // ms-attr-name="yyy"  vm.yyy="ooo" Set the "name" property of the element
        attr: function(data, vmodels) {
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                var attrName = data.param
                var toRemove = (val === false) || (val === null) || (val === void 0)
                if (toRemove)
                    elem.removeAttribute(attrName)
                if (fuckIEAttr && attrName in propMap) {
                    attrName = propMap[attrName]
                    if (toRemove) {
                        elem.removeAttribute(attrName)
                    } else {
                        elem[attrName] = val
                    }
                } else if (!toRemove) {
                    elem.setAttribute(attrName, val)
                }
            })
        },
        on: function(data, vmodels) {
            data.type = "on"
            var value = data.value,
                    four = "$event",
                    elem = data.element,
                    type = data.param,
                    callback
            if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
                var matched = (value.match(rdash) || ["", ""])[1].trim()
                if (matched === "" || matched === "$event") { // aaa() aaa($event) is treated as aaa
                    four = void 0
                    value = value.replace(rdash, "")
                }
            } else {
                four = void 0
            }
            var array = parseExpr(value, vmodels, data, four)
            if (array) {
                var fn = array[0],
                        args = array[1]
                if (!four) {
                    callback = fn.apply(fn, args)
                } else {
                    callback = function(e) {
                        fn.apply(this, args.concat(e))
                    }
                }
                if (!elem.$vmodels) {
                    elem.$vmodel = vmodels[0]
                    elem.$vmodels = vmodels
                }
                if (type && typeof callback === "function") {
                    avalon.bind(elem, type, callback)
                }
            }

        },
        data: function(data, vmodels) {
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                var key = "data-" + data.param
                elem.setAttribute(key, val)
            })
        },
        //Extract inline expressions in innerText, replace them with the evaluated value
        //For example <div>{{firstName}} + java</div>, given that model.firstName is "ruby", will result in
        //<div>ruby + java</div>
        text: function(data, vmodels) {
            var node = data.node
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                if (node.nodeType === 2) { //it is a node, that means ms-text is used on the element
                    if ("textContent" in elem) {
                        elem.textContent = val
                    } else {
                        elem.innerText = val
                    }
                } else {
                    node.nodeValue = val
                }
            })
        },
        //show or hide the element
        visible: function(data, vmodels) {
            var elem = data.element
            if (!supportDisplay && !root.contains(elem)) {//damn the firefox family!
                var display = parseDisplay(elem.tagName)
            }
            display = display || avalon(elem).css("display")
            display = display === "none" ? parseDisplay(elem.tagName) : display
            updateViewFactory(data.value, vmodels, data, function(val) {
                elem.style.display = val ? display : "none"
            })
        },
        //This is a sample for binding string properties, it helps you to add inline expression in the title, alt, src, href, include, and css properties.
        //<a ms-href="{{url.hostname}}/{{url.pathname}}.html">
        href: function(data, vmodels) {
            var text = data.value.trim(),
                    simple = true,
                    method = data.type
            if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
                simple = false
                if (rexpr.test(text) && RegExp.rightContext === "" && RegExp.leftContext === "") {
                    simple = true
                    text = RegExp.$1
                }
            }
            updateViewFactory(text, vmodels, data, function(val, elem) {
                if (method === "css") {
                    avalon(elem).css(data.param, val)
                } else if (method === "include" && val) {
                    if (data.param === "src") {
                        var xhr = new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
                        xhr.onreadystatechange = function() {
                            if (xhr.readyState === 4) {
                                var s = xhr.status
                                if (s >= 200 && s < 300 || s === 304 || s === 1223) {
                                    avalon.innerHTML(elem, xhr.responseText)
                                    avalon.scan(elem, vmodels)
                                }
                            }
                        }
                        xhr.open("GET", val, true)
                        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                        xhr.send(null)
                    } else {
                        var el = DOC.getElementById(val)
                        avalon.nextTick(function() {
                            el && avalon.innerHTML(elem, el.innerHTML)
                            avalon.scan(elem, vmodels)
                        })
                    }
                } else {
                    elem[method] = val
                }
            }, simple ? null : scanExpr(data.value))
        },
        //This is a sample for binding boolean properties, boolean property requires its value to be a boolean inline expression as whole, surrounded by {{ }}
        //In IE we cannot obtain the original string value of a boolean property, it has been converted to a boolean, hence we have to introduce an extra ms-disabled property
        disabled: function(data, vmodels) {
            var name = data.type,
                    propName = name === "readonly" ? "readOnly" : name
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                elem[propName] = !!val
            })
        },
        //ms-bind="name:callback", binds a property, invoke callback when the value of the property is changed. "this" in the callback refers to the bound element
        bind: function(data, vmodels) {
            var array = data.value.match(/([$\w]+)\s*\:\s*([$\w]+)/)
            delete data.remove
            if (array && array[1] && array[2]) {
                var fn = array[2],
                        elem = data.element
                for (var i = 0, scope; scope = vmodels[i++]; ) {
                    if (scope.hasOwnProperty(fn)) {
                        fn = scope[fn]
                        break
                    }
                }
                if (typeof fn === "function") {
                    fn.call(elem)
                    scope.$watch(array[1], function(neo, old) {
                        fn.call(elem, neo, old)
                    })
                    data.remove = true
                }
            }

        },
        html: function(data, vmodels) {
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                val = val == null ? "" : val + ""
                if (data.replaceNodes) {
                    var f = avalon.parseHTML(val)
                    var replaceNodes = avalon.slice(f.childNodes)
                    elem.insertBefore(f, data.replaceNodes[0])
                    for (var i = 0, node; node = data.replaceNodes[i++]; ) {
                        elem.removeChild(node)
                    }
                    data.replaceNodes = replaceNodes
                } else {
                    avalon.innerHTML(elem, val)
                }
            })
        },
        //https://github.com/RubyLouvre/avalon/issues/27
        "with": function(data, vmodels) {
            bindingHandlers.each(data, vmodels, true)
        },
        ui: function(data, vmodels, opts) {
            var uiName = data.value.trim() //get the name of the UI control
            var elem = data.element //get the bound element
            var id = (elem.getAttribute("data-id") || "").trim()
            if (!id) { //get the VM ID of this UI control
                id = uiName + setTimeout("1") //Generate a random id if it does not exist
                elem.setAttribute("data-id", id)
            }
            elem[id + "vmodels"] = vmodels // store it temporary
            if (typeof avalon.ui[uiName] === "function") {
                var optsName = data.param //
                if (optsName) {
                    for (var i = 0, vm; vm = vmodels[i++]; ) {
                        if (vm.hasOwnProperty(optsName)) {
                            opts = vm.$model[optsName]
                            break
                        }
                    }
                }
                avalon.ui[uiName](elem, id, vmodels, opts || {})
                elem[id + "vmodels"] = void 0
            } else {
                delete data.remove
            }
        }
    }

    //============================================================================
    //Switch className based on the VM property value or expression result, e.g. ms-class="xxx yyy zzz:flag"
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
    "class,hover,active".replace(rword, function(method) {
        bindingHandlers[method] = function(data, vmodels) {
            var oldStyle = data.param,
                    elem = data.element,
                    $elem = avalon(elem),
                    toggle
            if (!oldStyle || isFinite(oldStyle)) {
                var text = data.value
                var noExpr = text.replace(rexprg, function(a) {
                    return Math.pow(10, a.length - 1) //Insert the N-1 power of 10 into the inline expression as a placeholder
                })
                var colonIndex = noExpr.indexOf(":") //get the position of the first colon
                if (colonIndex === -1) { // Situations like ms-class="aaa bbb ccc"
                    var className = text,
                            rightExpr
                } else { // Situations like ms-class-1="ui-state-active:checked"
                    className = text.slice(0, colonIndex)
                    rightExpr = text.slice(colonIndex + 1)
                    var array = parseExpr(rightExpr, vmodels, {})
                    if (!Array.isArray(array)) {
                        log("'" + (rightExpr || "").trim() + "' not found in the VM")
                        return false
                    }
                    var callback = array[0],
                            args = array[1]
                }
                var hasExpr = rexpr.test(className) //Situations like ms-class="width{{w}}"

                updateViewFactory("", vmodels, data, function(cls) {
                    toggle = callback ? !!callback.apply(elem, args) : true
                    className = hasExpr ? cls : className
                    if (method === "class") {
                        $elem.toggleClass(className, toggle)
                    }
                }, (hasExpr ? scanExpr(className) : null))

                if (method === "hover" || method === "active") {
                    if (method === "hover") {//switch className on mouse Enter or Leave
                        var event1 = "mouseenter"
                        var event2 = "mouseleave"
                    } else {//switch className on mouse Down or Up
                        elem.tabIndex = elem.tabIndex || -1
                        event1 = "mousedown", event2 = "mouseup"
                    }

                    $elem.bind(event1, function() {
                        toggle && $elem.addClass(className)
                    })
                    $elem.bind(event2, function() {
                        toggle && $elem.removeClass(className)
                    })
                }

            } else if (method === "class") {
                updateViewFactory(data.value, vmodels, data, function(val) {
                    $elem.toggleClass(oldStyle, !!val)
                })
            }
        }
    })

    //============================= boolean property binding =======================
    //Binders for boolean properties similar to "disabled"

    "checked,readonly,selected".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled
    })
    bindingHandlers.enabled = function(data, vmodels) {
        updateViewFactory(data.value, vmodels, data, function(val, elem) {
            elem.disabled = !val
        })
    }
    //============================= string property binding =======================
    //Binders for string properties similar to "href"
    //binding the original "src" property is not recommended because it may result in emitting unexpected requests, use ms-src instead.
    "title,alt,src,value,css,include".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href
    })
    //============================= model binding =======================
    //Bind fields in the model with the value of input or textarea
    var modelBinding = bindingHandlers.duplex = bindingHandlers.model = function(data, vmodels) {
        var elem = data.element,
                tagName = elem.tagName
        if (data.type === "model") {
            log("ms-model has been deprecated. Use ms-duplex instead.")
        }
        if (typeof modelBinding[tagName] === "function") {
            var array = parseExpr(data.value, vmodels, data, "setget")
            if (array) {
                var val = data.value.split("."),
                        first = val[0],
                        second = val[1]
                for (var vm, i = vmodels.length - 1; vm = vmodels[i--]; ) {
                    if (vm.hasOwnProperty(first)) {
                        if (second && vm[first]) {
                            if (vm[first].hasOwnProperty(second)) {
                                break
                            }
                        } else {
                            break
                        }
                    }
                }
                if (!elem.name) { // If the user omitted the "name" attribute, the browser will assign an empty string to it
                    elem.name = generateID()
                }
                var updateView = modelBinding[tagName](elem, array[0], vm, data.param)
                registerSubscriber(updateView, elem)
            }
        }

    }
    //When the model binding is set up on an input tag, the target model field will be bound with the value of the element
    //in both ways. Changing the field will cause the value to be changed and vise versa. By default we bind the input event
    modelBinding.INPUT = function(element, fn, scope, fixType) {
        var type = element.type,
                $elem = avalon(element)
        if (type === "checkbox" && fixType === "radio") {
            type = "radio"
        }
        //Change the model field when the value of the element is changed
        var updateModel = function() {
            if ($elem.data("observe") !== false) {
                fn(scope, element.value)
            }
        }
        //Change the value of the element when the model field changed
        var updateView = function() { //Execute updateView first
            var neo = fn(scope)
            if (neo !== element.value) {
                element.value = neo
            }
        }

        //https://developer.mozilla.org/en-US/docs/Web/HTML/Element/Input
        if (/^(password|textarea|text|url|email|date|month|time|week|number)$/.test(type)) {
            var event = element.attributes["data-event"] || {}
            event = event.value
            if (event === "change") {
                avalon.bind(element, event, updateModel)
            } else {
                if (window.addEventListener) { //execute for W3C first
                    element.addEventListener("input", updateModel)
                } else {
                    element.attachEvent("onpropertychange", function(e) {
                        if (e.propertyName === "value") {
                            updateModel()
                        }
                    })
                }
                if (DOC.documentMode >= 9) { //IE9 10
                    $elem.bind("keydown", function(e) {
                        var key = e.keyCode
                        if (key === 8 || key === 46) {
                            updateModel() //handle the backspace and delete key
                        }
                    })
                    $elem.bind("cut", updateModel) //handle paste
                }
            }
        } else if (type === "radio") {
            updateView = function() {
                element.checked = fixType === "text" ? fn(scope) === element.value : !!fn(scope)
            }
            updateModel = function() {
                if ($elem.data("observe") !== false) {
                    if (fixType === "text") {
                        if (element.checked) {
                            fn(scope, element.value)
                        }
                    } else {
                        var val = !element.beforeChecked
                        fn(scope, val)
                        element.beforeChecked = element.checked = val
                    }
                }
            }

            function beforeChecked() {
                element.beforeChecked = element.checked
            }
            if (element.onbeforeactivate === null) {
                $elem.bind("beforeactivate", beforeChecked)
            } else {
                $elem.bind("mouseover", beforeChecked)
            }
            $elem.bind("click", updateModel)
        } else if (type === "checkbox") {
            updateModel = function() {
                if ($elem.data("observe") !== false) {
                    var method = element.checked ? "ensure" : "remove"
                    avalon.Array[method](fn(scope), element.value)
                }
            }
            updateView = function() {
                var array = [].concat(fn(scope)) //Forcing convert to array
                try {
                    element.checked = array.indexOf(element.value) >= 0
                } catch (e) {
                    log("The prop in <input type='checkbox' ms-duplex='prop' /> should be an array")
                }
            }
            $elem.bind("click", updateModel) //IE6-8
        }
        return updateView
    }
    modelBinding.SELECT = function(element, fn, scope, oldValue) {
        var $elem = avalon(element)
        function updateModel() {
            if ($elem.data("observe") !== false) {
                var neo = $elem.val()
                if (neo + "" !== oldValue) {
                    fn(scope, neo)
                    oldValue = neo + ""
                }
            }
        }

        function updateView() {
            var neo = fn(scope)
            if (neo + "" !== oldValue) {
                $elem.val(neo)
                oldValue = neo + ""
            }
        }
        $elem.bind("change", updateModel)
        return updateView
    }
    modelBinding.TEXTAREA = modelBinding.INPUT
    //============================= event binding =======================

    var eventName = {
        AnimationEvent: 'animationend',
        WebKitAnimationEvent: 'webkitAnimationEnd'
    }
    for (var name in eventName) {
        try {
            DOC.createEvent(name)
            eventMap.animationend = eventName[name]
            break
        } catch (e) {
        }
    }

    function fixEvent(event) {
        var target = event.target = event.srcElement
        event.which = event.charCode != null ? event.charCode : event.keyCode
        if (/mouse|click/.test(event.type)) {
            var doc = target.ownerDocument || DOC
            var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
            event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
            event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        }
        event.preventDefault = function() { //prevent default behaviour
            event.returnValue = false
        }
        event.stopPropagation = function() { //stop the event from propagating through the DOM tree
            event.cancelBubble = true
        }
        return event
    }
    "dblclick,mouseout,click,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,keypress,keydown,keyup,blur,focus,change,animationend".
            replace(rword, function(name) {
        bindingHandlers[name] = function(data) {
            data.param = name
            bindingHandlers.on.apply(0, arguments)
        }
    })
    if (!("onmouseenter" in root)) {
        var oldBind = avalon.bind
        var events = {
            mouseenter: "mouseover",
            mouseleave: "mouseout"
        }
        avalon.bind = function(elem, type, fn) {
            if (events[type]) {
                return oldBind(elem, events[type], function(e) {
                    var t = e.relatedTarget
                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                        delete e.type
                        e.type = type
                        return fn.call(elem, e)
                    }
                })
            } else {
                return oldBind(elem, type, fn)
            }
        }
    }
    /*********************************************************************
     *       Watched array closely related to the "each" binding         *
     **********************************************************************/

    function convert(val) {
        var type = getType(val)
        if (rchecktype.test(type)) {
            val = val.$id ? val : modelFactory(val, val, type)
        }
        return val
    }

    //To obtain the index of el in the array

    function getVMIndex(el, array, start) {
        for (var i = start, n = array.length; i < n; i++) {
            var b = array[i]
            var check = b && b.$model ? b.$model : b
            if (isEqual(el, check)) {
                return i
            }
        }
        return -1
    }

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array[subscribers] = []
        array.$model = model
        array.$events = {} //"this" in VB object method does not refer to the caller object itself, we need to bind it first.
        array._splice = array.splice
        for (var i in Observable) {
            array[i] = Observable[i]
        }
        var dynamic = modelFactory({
            length: model.length
        })
        dynamic.$watch("length", function(a, b) {
            array.$fire("length", a, b)
        })

        array._add = function(arr, pos) {
            pos = typeof pos === "number" ? pos : this.length;
            var added = []
            for (var i = 0, n = arr.length; i < n; i++) {
                added[i] = convert(arr[i])
            }
            this._splice.apply(this, [pos, 0].concat(added))
            notifySubscribers(this, "add", added, pos)
            if (!this.stopFireLength) {
                return dynamic.length = this.length
            }
        }

        array._del = function(pos, n) {
            var ret = this._splice(pos, n)
            if (ret.length) {
                notifySubscribers(this, "del", pos, n)
                if (!this.stopFireLength) {
                    dynamic.length = this.length
                }
            }
            return ret
        }
        array.push = function() {
            model.push.apply(model, arguments)
            return this._add(arguments) //return the length
        }
        array.unshift = function() {
            model.unshift.apply(model, arguments)
            var ret = this._add(arguments, 0) //return the length
            notifySubscribers(this, "index", arguments.length)
            return ret
        }
        array.shift = function() {
            model.shift()
            var el = this._del(0, 1)
            notifySubscribers(this, "index", 0)
            return el[0] //return the removed element
        }
        array.pop = function() {
            var el = model.pop()
            this._del(this.length - 1, 1)
            return el[0] //return the removed element
        }

        array.splice = function(a, b) {
            //The first argument must present and greater than -1, it is the start point for adding or deleting element
            a = resetNumber(a, this.length)
            var removed = model.splice.apply(model, arguments),
                    ret = []
            this.stopFireLength = true //ensure $watch("length",fn) will be triggered just once in this method
            if (removed.length) {
                ret = this._del(a, removed.length)
                if (arguments.length <= 2) { //if no adding operation has been made, we have to reset the index manually
                    notifySubscribers(this, "index", 0)
                }
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
            }
            this.stopFireLength = false
            dynamic.length = this.length
            return ret //return the removed element
        }
        "sort,reverse".replace(rword, function(method) {
            array[method] = function() {
                model[method].apply(model, arguments)
                var sorted = false
                for (var i = 0, n = this.length; i < n; i++) {
                    var a = model[i]
                    var b = this[i]
                    var b = b && b.$model ? b.$model : b
                    if (!isEqual(a, b)) {
                        sorted = true
                        var index = getVMIndex(a, this, i)
                        var remove = this._splice(index, 1)[0]
                        array._splice(i, 0, remove)
                        notifySubscribers(this, "move", index, i)
                    }
                }
                if (sorted) {
                    notifySubscribers(this, "index", 0)
                }
                return this
            }
        })
        array.contains = function(el) {
            return this.indexOf(el) !== -1
        }
        array.size = function() { //obtain the length of array, this function is synchronized with the view, while the "length" property is not.
            return dynamic.length
        }
        array.remove = function(el) { //Remove the first matching element
            var index = this.indexOf(el)
            if (index >= 0) {
                return this.removeAt(index)
            }
        }
        array.removeAt = function(index) { //Remove the element at the given index
            this.splice(index, 1)
        }
        array.clear = function() {
            this.$model.length = this.length = dynamic.length = 0 //Clear the array
            notifySubscribers(this, "clear")
            return this
        }
        array.removeAll = function(all) { //Remove multiple elements
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    array.remove(el)
                })
            } else if (typeof all === "function") {
                for (var i = this.length - 1; i >= 0; i--) {
                    var el = this[i]
                    if (all(el, i)) {
                        this.splice(i, 1)
                    }
                }
            } else {
                this.clear()
            }
        }
        array.ensure = function(el) {
            if (!this.contains(el)) { //Only perform "push" when el is not in the array
                this.push(el)
            }
            return this
        }
        array.set = function(index, val) {
            if (index >= 0 && index < this.length) {
                var valueType = getType(val)
                if (rchecktype.test(valueType)) {
                    if (val.$model) {
                        val = val.$model
                    }
                    updateViewModel(this[index], val, valueType)
                } else if (this[index] !== val) {
                    this[index] = val
                    notifySubscribers(this, "set", index, val)
                }
            }
            return this
        }
        return array
    }

    //====================== each binding  =================================
    var withMapper = {}
    bindingHandlers["each"] = function(data, vmodels) {
        var parent = data.element,
                list, updateView
        var array = parseExpr(data.value, vmodels, data)
        if (typeof array === "object") {
            list = array[0].apply(array[0], array[1])
        }
        var view = documentFragment.cloneNode(false)
        while (parent.firstChild) {
            view.appendChild(parent.firstChild)
        }
        data.template = view
        data.vmodels = vmodels
        if (typeof list !== "object") {
            return list
        }
        //Because eachIterator and withIterator is complicate and memory consuming functions, we create a singleton here
        //and internally invoke it with a virtual proxy named "iterator"
        if (Array.isArray(list)) {
            data.mapper = []
            updateView = function(method, pos, el) {
                eachIterator(method, pos, el, data, updateView.host)
            }
        } else {

            data.markstone = {}
            updateView = function(method, pos, el) {
                withIterator(method, pos, el, data, updateView.host)
            }

        }
        updateView.host = list
        list[subscribers] && list[subscribers].push(updateView)
        updateView("add", list, 0)
    }

    function eachIterator(method, pos, el, data, list) {
        var group = data.group
        var parent = data.element
        var mapper = data.mapper
        if (method == "del" || method == "move") {
            var locatedNode = getLocatedNode(parent, group, pos)
        }
        switch (method) {
            case "add":
                // To be consistent with the add method of withIterator, we swapped the second and third argument here
                var arr = pos,
                        pos = el,
                        transation = documentFragment.cloneNode(false)
                for (var i = 0, n = arr.length; i < n; i++) {
                    var ii = i + pos
                    var proxy = createEachProxy(ii, arr[i], list, data.param)
                    var tview = data.template.cloneNode(true)
                    mapper.splice(ii, 0, proxy)
                    var base = typeof arr[i] === "object" ? [proxy, arr[i]] : [proxy]
                    scanNodes(tview, base.concat(data.vmodels))
                    if (typeof group !== "number") {
                        data.group = tview.childNodes.length // records the number of child nodes in each template
                    }
                    transation.appendChild(tview)
                }
                //obtain the insert position. IE6-10 require the second argument of insertBefore must be a node or null. Undefined is not allowed.
                locatedNode = getLocatedNode(parent, group, pos)
                parent.insertBefore(transation, locatedNode)
                break
            case "del":
                mapper.splice(pos, el) // remove the child VM
                removeView(locatedNode, group, el)
                break
            case "index":
                while (el = mapper[pos]) {
                    el.$index = pos++
                }
                break
            case "clear":
                mapper.length = 0
                avalon.clearChild(parent)
                break
            case "move":
                var t = mapper.splice(pos, 1)[0]
                if (t) {
                    mapper.splice(el, 0, t)
                    var moveNode = removeView(locatedNode, group)
                    locatedNode = getLocatedNode(parent, group, el)
                    parent.insertBefore(moveNode, locatedNode)
                }
                break
            case "set":
                var model = mapper[pos]
                if (model) {
                    var n = model.$itemName
                    model[n] = el
                }
                break
        }
    }

    function withIterator(method, object, val, data, host, transation) {
        var group = data.group
        var parent = data.element
        var markstone = data.markstone
        var ret = []
        transation = transation || documentFragment.cloneNode(false)
        switch (method) {
            case "append":
                var key = object
                var mapper = withMapper[host.$id] || (withMapper[host.$id] = {})
                if (!mapper[key]) {
                    var proxy = createWithProxy(key, val)
                    mapper[key] = proxy
                    if (val && val.$model) {
                        proxy.$events = host.$events
                        proxy[subscribers] = host[subscribers]
                    }
                    host.$watch(key, function(neo) {
                        proxy.$val = neo
                    })
                }
                var tview = data.template.cloneNode(true)
                scanNodes(tview, [mapper[key], val].concat(data.vmodels))
                if (typeof group !== "number") {
                    data.group = tview.childNodes.length
                }
                markstone[key] = tview.firstChild
                transation.appendChild(tview)
                break
            case "sort":
                for (var i = 0, name; name = object[i++]; ) {
                    var node = markstone[name]
                    var view = removeView(node, group) // move out from the DOM tree first
                    transation.appendChild(view)
                }
                parent.appendChild(transation) //Then append it to the end
            case "add":
                for (var i in object) {
                    if (object.hasOwnProperty(i) && i !== "hasOwnProperty") {
                        if (!markstone.hasOwnProperty(i)) { //this is the new one
                            withIterator("append", i, object[i], data, host, transation)
                            ret.push(i)
                        }
                    }
                }
                parent.appendChild(transation) // then append to the end
                return ret
            case "remove":
                var removeNodes = []
                for (var i = 0, name; name = object[i++]; ) {
                    var node = markstone[name]
                    if (node) {
                        markstone[name] = withMapper[host.$id][name] = 0 //Remove keys no longer existing
                        removeNodes.push(node)
                        gatherRemovedNodes(removeNodes, node, group)
                    }
                }
                for (i = 0; node = removeNodes[i++]; ) {
                    parent.removeChild(node)
                }
                return ret
        }
    }
    //Collect the nodes to be removed, the first node must be pushed first
    function gatherRemovedNodes(array, node, length) {
        for (var i = 1; i < length; i++) {
            node = node.nextSibling
            array.push(node)
        }
        return array
    }
    // Get the located node for positioning. For elements that bound with the ms-each or ms-with property, its whole innerHTML will be treated as a template
    // remove from the DOM tree. Then we clone the template based on size of the array (ms-each) or object properties (ms-with). We scan each copies and
    // put them back into the parent element.
    // Now the child elements are made up of a number of cloned parts, the first node of each part is the located node.
    // It helps us to identify each part and move or delete elements of a part as whole

    function getLocatedNode(parent, group, pos) {
        return parent.childNodes[group * pos] || null
    }

    function removeView(node, group, n) {
        n = n || 1
        var removeNodes = gatherRemovedNodes([node], node, group * n)
        var view = documentFragment.cloneNode(false)
        for (var i = 0, node; node = removeNodes[i++]; ) {
            view.appendChild(node) //generally we can remove a node by appending it to a documentFragment
        }
        return view
    }
    //Create a ViewModel for a child view
    function createWithProxy(key, val) {
        return modelFactory({
            $key: key,
            $val: val
        }, 0, {
            $val: 1
        })
    }
    var watchEachOne = oneObject("$index,$remove,$first,$last")
    // Create a proxy object, we can access the element index ($index), flag of being the first element ($first) or the last ($last)
    function createEachProxy(index, item, list, param) {
        param = param || "el"
        var source = {}
        source.$index = index
        source.$itemName = param
        source[param] = {
            get: function() {
                return item
            },
            set: function(val) {
                item = val
            }
        }
        source.$first = {
            get: function() {
                return this.$index === 0
            }
        }
        source.$last = {
            get: function() { //Sometimes the client is a plain array
                var n = typeof list.size === "function" ? list.size() : list.length
                return this.$index === n - 1
            }
        }
        source.$remove = function() {
            return list.removeAt(this.$index)
        }
        return modelFactory(source, 0, watchEachOne)
    }

    /*********************************************************************
     *                            Filters                              *
     **********************************************************************/
    var filters = avalon.filters = {
        uppercase: function(str) {
            return str.toUpperCase()
        },
        lowercase: function(str) {
            return str.toLowerCase()
        },
        truncate: function(target, length, truncation) {
            //length,the length of the new string; truncation, The suffix string to be put in the end of the new string
            length = length || 30
            truncation = truncation === void(0) ? "..." : truncation
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target)
        },
        camelize: camelize,
        escape: function(html) {
            //escape html tags in the string. For example turning < into &lt;
            return String(html)
                    .replace(/&(?!\w+;)/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
        },
        currency: function(number, symbol) {
            symbol = symbol || "$"
            return symbol + avalon.filters.number(number)
        },
        number: function(number, decimals, dec_point, thousands_sep) {
            //fully compatible with number_format in PHP
            //number    required, the number to be formatted
            //decimals  optional, number of decimal digits
            //dec_point optional, the string used as decimal point (default to "." )
            //thousands_sep	optional, the character used as thousands separator (default to ","). If you want to specify this argument, You have to set all the previous arguments explicitly
            // http://kevin.vanzonneveld.net
            number = (number + "").replace(/[^0-9+\-Ee.]/g, '')
            var n = !isFinite(+number) ? 0 : +number,
                    prec = !isFinite(+decimals) ? 0 : Math.abs(decimals),
                    sep = thousands_sep || ",",
                    dec = dec_point || ".",
                    s = '',
                    toFixedFix = function(n, prec) {
                var k = Math.pow(10, prec)
                return '' + Math.round(n * k) / k
            }
            // Fix for IE parseFloat(0.55).toFixed(0) = 0
            s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
            if (s[0].length > 3) {
                s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
            }
            if ((s[1] || '').length < prec) {
                s[1] = s[1] || ''
                s[1] += new Array(prec - s[1].length + 1).join('0')
            }
            return s.join(dec)
        }
    }
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
    new function() {
        function toInt(str) {
            return parseInt(str, 10)
        }

        function padNumber(num, digits, trim) {
            var neg = ''
            if (num < 0) {
                neg = '-'
                num = -num
            }
            num = '' + num
            while (num.length < digits)
                num = '0' + num
            if (trim)
                num = num.substr(num.length - digits)
            return neg + num
        }

        function dateGetter(name, size, offset, trim) {
            return function(date) {
                var value = date['get' + name]()
                if (offset > 0 || value > -offset)
                    value += offset
                if (value === 0 && offset === -12) {
                    value = 12
                }
                return padNumber(value, size, trim)
            }
        }

        function dateStrGetter(name, shortForm) {
            return function(date, formats) {
                var value = date['get' + name]()
                var get = (shortForm ? ('SHORT' + name) : name).toUpperCase()
                return formats[get][value]
            }
        }

        function timeZoneGetter(date) {
            var zone = -1 * date.getTimezoneOffset()
            var paddedZone = (zone >= 0) ? "+" : ""
            paddedZone += padNumber(Math[zone > 0 ? 'floor' : 'ceil'](zone / 60), 2) + padNumber(Math.abs(zone % 60), 2)
            return paddedZone
        }
        //get am or pm

        function ampmGetter(date, formats) {
            return date.getHours() < 12 ? formats.AMPMS[0] : formats.AMPMS[1]
        }
        var DATE_FORMATS = {
            yyyy: dateGetter('FullYear', 4),
            yy: dateGetter('FullYear', 2, 0, true),
            y: dateGetter('FullYear', 1),
            MMMM: dateStrGetter('Month'),
            MMM: dateStrGetter('Month', true),
            MM: dateGetter('Month', 2, 1),
            M: dateGetter('Month', 1, 1),
            dd: dateGetter('Date', 2),
            d: dateGetter('Date', 1),
            HH: dateGetter('Hours', 2),
            H: dateGetter('Hours', 1),
            hh: dateGetter('Hours', 2, -12),
            h: dateGetter('Hours', 1, -12),
            mm: dateGetter('Minutes', 2),
            m: dateGetter('Minutes', 1),
            ss: dateGetter('Seconds', 2),
            s: dateGetter('Seconds', 1),
            sss: dateGetter('Milliseconds', 3),
            EEEE: dateStrGetter('Day'),
            EEE: dateStrGetter('Day', true),
            a: ampmGetter,
            Z: timeZoneGetter
        }
        var DATE_FORMATS_SPLIT = /((?:[^yMdHhmsaZE']+)|(?:'(?:[^']|'')*')|(?:E+|y+|M+|d+|H+|h+|m+|s+|a|Z))(.*)/,
                NUMBER_STRING = /^\d+$/
        var R_ISO8601_STR = /^(\d{4})-?(\d\d)-?(\d\d)(?:T(\d\d)(?::?(\d\d)(?::?(\d\d)(?:\.(\d+))?)?)?(Z|([+-])(\d\d):?(\d\d))?)?$/
        // 1        2       3         4          5          6          7          8  9     10      11

        function jsonStringToDate(string) {
            var match
            if (match = string.match(R_ISO8601_STR)) {
                var date = new Date(0),
                        tzHour = 0,
                        tzMin = 0,
                        dateSetter = match[8] ? date.setUTCFullYear : date.setFullYear,
                        timeSetter = match[8] ? date.setUTCHours : date.setHours
                if (match[9]) {
                    tzHour = toInt(match[9] + match[10])
                    tzMin = toInt(match[9] + match[11])
                }
                dateSetter.call(date, toInt(match[1]), toInt(match[2]) - 1, toInt(match[3]))
                var h = toInt(match[4] || 0) - tzHour;
                var m = toInt(match[5] || 0) - tzMin
                var s = toInt(match[6] || 0);
                var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000);
                timeSetter.call(date, h, m, s, ms);
                return date
            }
            return string
        }
        filters.date = function(date, format) {
            var locate = filters.date.locate,
                    text = "",
                    parts = [],
                    fn, match
            format = format || "mediumDate"
            format = locate[format] || format
            if (typeof date === "string") {
                if (NUMBER_STRING.test(date)) {
                    date = toInt(date)
                } else {
                    date = jsonStringToDate(date)
                }
                date = new Date(date)
            }
            if (typeof date === "number") {
                date = new Date(date)
            }
            if (getType(date) !== "date") {
                return
            }
            while (format) {
                match = DATE_FORMATS_SPLIT.exec(format)
                if (match) {
                    parts = parts.concat(match.slice(1))
                    format = parts.pop()
                } else {
                    parts.push(format)
                    format = null
                }
            }
            parts.forEach(function(value) {
                fn = DATE_FORMATS[value]
                text += fn ? fn(date, locate) : value.replace(/(^'|'$)/g, '').replace(/''/g, "'")
            })
            return text
        }
        var locate = {
            AMPMS: {
                0: "AM",
                1: "PM"
            },
            DAY: {
                0: "Sunday",
                1: "Monday",
                2: "Tuesday",
                3: "Wednesday",
                4: "Thursday",
                5: "Friday",
                6: "Saturday"
            },
            MONTH: {
                0: "January",
                1: "Febrary",
                2: "March",
                3: "April",
                4: "May",
                5: "June",
                6: "July",
                7: "August",
                8: "September",
                9: "October",
                10: "November",
                11: "December"
            },
            SHORTDAY: {
                "0": "Sun",
                "1": "Mon",
                "2": "Tue",
                "3": "Wed",
                "4": "Thu",
                "5": "Fri",
                "6": "Sat"
            },
            fullDate: "d/M/y EEEE",
            longDate: "d/M/y",
            medium: "d/M/yyyy ah:mm:ss",
            mediumDate: "d/M/yyyy",
            mediumTime: "ah:mm:ss",
            "short": "d/M/yy ah:mm",
            shortDate: "d/M/yy",
            shortTime: "ah:mm"
        }
        locate.SHORTMONTH = locate.MONTH
        filters.date.locate = locate
    }
    /*********************************************************************
     *                      AMD Loader                                *
     **********************************************************************/

    var innerRequire
    var modules = avalon.modules = {
        "ready!": {
            exports: avalon
        },
        "avalon": {
            exports: avalon,
            state: 2
        }
    }


    new function() {
        var loadings = [] //Modules in loading
        var factorys = [] //Modules need to bind id with factory (In standard browser, when a "script" node get parsed earlier, its onload callback get executed earlier)
        var basepath

        function cleanUrl(url) {
            return (url || "").replace(/[?#].*/, "")
        }

        plugins.js = function(url, shim) {
            var id = cleanUrl(url)
            if (!modules[id]) { //if not loaded before
                modules[id] = {
                    id: id,
                    parent: parent,
                    exports: {}
                }
                if (shim) { //shim mechanism
                    innerRequire(shim.deps || "", function() {
                        loadJS(url, id, function() {
                            modules[id].state = 2
                            if (shim.exports)
                                modules[id].exports = typeof shim.exports === "function" ?
                                        shim.exports() : window[shim.exports]
                            innerRequire.checkDeps()
                        })
                    })
                } else {
                    loadJS(url, id)
                }
            }
            return id
        }
        plugins.css = function(url) {
            var id = url.replace(/(#.+|\W)/g, "") ////remove hash and all special characters in href
            if (!DOC.getElementById(id)) {
                var node = DOC.createElement("link")
                node.rel = "stylesheet"
                node.href = url
                node.id = id
                head.insertBefore(node, head.firstChild)
            }
        }
        plugins.css.ext = ".css"
        plugins.js.ext = ".js"
        var cur = getCurrentScript(true)
        if (!cur) { //workaround for the lack of stack for Error in windows safari
            cur = avalon.slice(document.scripts).pop().src
        }
        var url = cleanUrl(cur)
        basepath = kernel.base = url.slice(0, url.lastIndexOf("/") + 1)

        function getCurrentScript(base) {
            // See https://github.com/samyk/jiagra/blob/master/jiagra.js
            var stack
            try {
                a.b.c() //Force to throw exception so that we can capture the e.stack
            } catch (e) { //The error object in safari only has line, sourceId, and sourceURL
                stack = e.stack
                if (!stack && window.opera) {
                    //opera 9 doesn't have e.stack, it have e.Backtrace but you cannot get it directly.
                    // You'll need to extract it by converting the exception object into string
                    stack = (String(e).match(/of linked script \S+/g) || []).join(" ")
                }
            }
            if (stack) {
                /**The last line of e.stack in supported browsers are as following, respectively
                 *chrome23:
                 * at http://113.93.50.63/data.js:4:1
                 *firefox17:
                 *@http://113.93.50.63/query.js:4
                 *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
                 *@http://113.93.50.63/data.js:4
                 *IE10:
                 *  at Global code (http://113.93.50.63/data.js:4:1)
                 *  //firefox4+ We can use document.currentScript to get it
                 */
                stack = stack.split(/[@ ]/g).pop() //get content after the last space or @ in the last line
                stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, "") //remove line breaks
                return stack.replace(/(:\d+)?:\d+$/i, "") //remove line number and column number of the error position (if exists)
            }
            var nodes = (base ? DOC : head).getElementsByTagName("script") //Only search inside head tag
            for (var i = nodes.length, node; node = nodes[--i]; ) {
                if ((base || node.className === subscribers) && node.readyState === "interactive") {
                    return node.className = node.src
                }
            }
        }

        function checkCycle(deps, nick) {
            //Check whether there are recursive dependencies
            for (var id in deps) {
                if (deps[id] === "Situ Zhengmei" && modules[id].state !== 2 && (id === nick || checkCycle(modules[id].deps, nick))) {
                    return true
                }
            }
        }

        function checkDeps() {
            //Check if all the dependencies of the current JS module are fully loaded, if yes install itself
            loop: for (var i = loadings.length, id; id = loadings[--i]; ) {

                var obj = modules[id],
                        deps = obj.deps
                for (var key in deps) {
                    if (ohasOwn.call(deps, key) && modules[key].state !== 2) {
                        continue loop
                    }
                }
                //Check if deps is an empty object or all statuses of the depended modules equal to 2
                if (obj.state !== 2) {
                    loadings.splice(i, 1) //Remove it before installing, so in IE if we refresh the page manually after the DOM tree is established, the module will not execute multiple times
                    fireFactory(obj.id, obj.args, obj.factory)
                    checkDeps() // if success, run it again, in case that some modules didn't get itself fully installed
                }
            }
        }

        function checkFail(node, onError, fuckIE) {
            var id = cleanUrl(node.src) //Dead link checking
            node.onload = node.onreadystatechange = node.onerror = null
            if (onError || (fuckIE && !modules[id].state)) {
                setTimeout(function() {
                    head.removeChild(node)
                    node = null // handle the cycling reference issue in old IEs
                })
                log("Failed to load " + id + ". Caused by " + onError + " " + (!modules[id].state))
            } else {
                return true
            }
        }

        function loadResources(url, parent, ret, shim) {
            //1. process the mass|ready identifier
            if (url === "ready!" || (modules[url] && modules[url].state === 2)) {
                return url
            }
            //2. convert to full path
            if (kernel.alias[url]) { //alias processing
                url = kernel.alias[url]
                if (typeof url === "object") {
                    shim = url
                    url = url.src
                }
            }
            //3. process text! and css! resources
            var plugin
            url = url.replace(/^\w+!/, function(a) {
                plugin = a.slice(0, -1)
                return ""
            })
            plugin = plugin || "js"
            plugin = plugins[plugin] || noop
            //4. complete the full path
            if (/^(\w+)(\d)?:.*/.test(url)) {
                ret = url
            } else {
                parent = parent.substr(0, parent.lastIndexOf('/'))
                var tmp = url.charAt(0)
                if (tmp !== "." && tmp !== "/") { //relative to the root path
                    ret = basepath + url
                } else if (url.slice(0, 2) === "./") { //relative to sibling path
                    ret = parent + url.slice(1)
                } else if (url.slice(0, 2) === "..") { //relative to parent path
                    var arr = parent.replace(/\/$/, "").split("/")
                    tmp = url.replace(/\.\.\//g, function() {
                        arr.pop()
                        return ""
                    })
                    ret = arr.join("/") + "/" + tmp
                } else if (tmp === "/") {
                    ret = parent + url //relative to sliding path
                } else {
                    avalon.error("Module identifier pattern violation: " + url)
                }
            }
            //5. complete the extension name
            url = cleanUrl(ret)
            var ext = plugin.ext
            if (ext) {
                if (url.slice(0 - ext.length) !== ext) {
                    ret += ext
                }
            }
            //6. handling cache
            if (kernel.nocache) {
                ret += (ret.indexOf("?") === -1 ? "?" : "&") + (new Date - 0)
            }
            return plugin(ret, shim)
        }

        function loadJS(url, id, callback) {
            //load the target module through "script" node
            var node = DOC.createElement("script")
            node.className = subscribers //let getCurrentScript only process "script" node with class name "subscribers"
            node[W3C ? "onload" : "onreadystatechange"] = function() {
                if (W3C || /loaded|complete/i.test(node.readyState)) {
                    //mass Framework will clean up its callbacks in _checkFail, try the best to release the memory
                    //even though there is no way to GC the DOM0 style event bindings in IE6
                    var factory = factorys.pop()
                    factory && factory.delay(id)
                    if (callback) {
                        callback()
                    }
                    if (checkFail(node, false, !W3C)) {
                        log("Successfully loaded " + url)
                    }
                }
            }
            node.onerror = function() {
                checkFail(node, true)
            }
            node.src = url //insert before the first node in the head section, prevent an error in IE6 of using appendChild before the closing head tag
            head.insertBefore(node, head.firstChild) //The second argument cannot be null in Chrome
            log("Preparing to load " + url) //More importantly, in IE6 the search scope of getCurrentScript can be narrowed
        }

        innerRequire = avalon.require = function(list, factory, parent) {
            //check if all the dependencies status are of value 2
            var deps = {},
                    // Used to store the return values from depended modules
                    args = [],
                    // Number of modules to be installed
                    dn = 0,
                    // Number of modules installed
                    cn = 0,
                    id = parent || "callback" + setTimeout("1")
            parent = parent || basepath
            String(list).replace(rword, function(el) {
                var url = loadResources(el, parent)
                if (url) {
                    dn++
                    if (modules[url] && modules[url].state === 2) {
                        cn++
                    }
                    if (!deps[url]) {
                        args.push(url)
                        deps[url] = "Situ Zhengmei" //Remove redundancy
                    }
                }
            })
            modules[id] = { //Create an object to keep track of loading status and other information of a module
                id: id,
                factory: factory,
                deps: deps,
                args: args,
                state: 1
            }
            if (dn === cn) { //if the number of modules to be installed equals to the number installed
                fireFactory(id, args, factory) //install into the framework
            } else {
                //Put into the checking list, queue for processing by checkDeps
                loadings.unshift(id)
            }
            checkDeps()
        }

        /**
         * Define module
         * @param {String} id ? module ID
         * @param {Array} deps ? dependency list
         * @param {Function} factory module factory
         * @api public
         */
        innerRequire.define = function(id, deps, factory) { //module name, dependencies list, module body
            var args = aslice.call(arguments)

            if (typeof id === "string") {
                var _id = args.shift()
            }
            if (typeof args[0] === "boolean") { //Used in file merging, skip patch modules in standard browsers
                if (args[0]) {
                    return
                }
                args.shift()
            }
            if (typeof args[0] === "function") {
                args.unshift([])
            }
            //In production environment with merged resources we can retrieve the module ID directly,
            //otherwise we have to use the "src" value of the "script" node under parsing at the moment
            //Now except safari, for all other browsers we can obtain the current "script" node through getCurrentScript directly
            //For safari we can achieve it through the "onload + delay closure" combination
            var name = modules[_id] && modules[_id].state >= 1 ? _id : cleanUrl(getCurrentScript())
            if (!modules[name] && _id) {
                modules[name] = {
                    id: name,
                    factory: factory,
                    state: 1
                }
            }
            factory = args[1]
            factory.id = _id //used in debug
            factory.delay = function(d) {
                args.push(d)
                var isCycle = true
                try {
                    isCycle = checkCycle(modules[d].deps, d)
                } catch (e) {
                }
                if (isCycle) {
                    avalon.error("The " + d + " module has recursive dependency with some loaded modules.")
                }
                delete factory.delay //release the memory
                innerRequire.apply(null, args) //0,1,2 --> 1,2,0
            }

            if (name) {
                factory.delay(name, args)
            } else { //First In First Out
                factorys.push(factory)
            }
        }
        innerRequire.define.amd = modules

        function fireFactory(id, deps, factory) {
            for (var i = 0, array = [], d; d = deps[i++]; ) {
                array.push(modules[d].exports)
            }
            var module = Object(modules[id]),
                    ret = factory.apply(window, array)
            module.state = 2
            if (ret !== void 0) {
                modules[id].exports = ret
            }
            return ret
        }
        innerRequire.config = kernel
        innerRequire.checkDeps = checkDeps
    }
    /*********************************************************************
     *                           DOMReady                               *
     **********************************************************************/
    var ready = W3C ? "DOMContentLoaded" : "readystatechange"

    function fireReady() {
        if (document.body) {// In IE8, doScrollCheck in iframe may be malfunctioning
            modules["ready!"].state = 2
            innerRequire.checkDeps()
            fireReady = noop //lazy function, prevent _checkDeps being called twice in IE9
        }
    }

    function doScrollCheck() {
        try { //In IE, we can use doScrollCheck to check if the DOM tree is completely built
            root.doScroll("left")
            fireReady()
        } catch (e) {
            setTimeout(doScrollCheck)
        }
    }

    if (DOC.readyState === "complete") {
        fireReady() // If loaded outside domReady
    } else if (W3C) {
        DOC.addEventListener(ready, function() {
            fireReady()
        })
    } else {
        DOC.attachEvent("onreadystatechange", function() {
            if (DOC.readyState === "complete") {
                fireReady()
            }
        })
        if (root.doScroll) {
            doScrollCheck()
        }
    }
    avalon.ready = function(fn) {
        innerRequire("ready!", fn)
    }
    avalon.config({
        loader: true
    })
    avalon.ready(function() {
        avalon.scan(document.body)
    })
})(document)

