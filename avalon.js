//==================================================
// avalon 0.971   by 司徒正美 2013.10.21
// 疑问:
//    什么协议? MIT, (五种开源协议的比较(BSD,Apache,GPL,LGPL,MIThttp://www.awflasher.com/blog/archives/939)
//    依赖情况? 没有任何依赖，可自由搭配jQuery, mass等使用,并不会引发冲突问题
//==================================================
(function(DOC) {
    var Registry = {} //将函数曝光到此对象上，方便访问器收集依赖
    var expose = new Date - 0
    var subscribers = "$" + expose
    var otherRequire = window.require
    var otherDefine = window.define
    //这两个都与计算属性息息相关
    var stopRepeatAssign = false
    var openComputedCollect = false
    var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    var class2type = {}
    var oproto = Object.prototype
    var ohasOwn = oproto.hasOwnProperty
    var prefix = "ms-"
    var W3C = window.dispatchEvent
    var root = DOC.documentElement
    var serialize = oproto.toString
    var aslice = [].slice
    var head = DOC.head || DOC.getElementsByTagName("head")[0] //HEAD元素
    var documentFragment = DOC.createDocumentFragment()
    var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",")
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })

    var rnative = /\[native code\]/
    var rchecktype = /^(?:object|array)$/
    var rwindow = /^[object (Window|DOMWindow|global)]$/

    function noop() {
    }

    function log(a) {
        window.console && console.log(W3C ? a : a + "")
    }


    /*********************************************************************
     *                 命名空间                                            *
     **********************************************************************/
    avalon = function(el) { //创建jQuery式的无new 实例化结构
        return new avalon.init(el)
    }
    avalon.init = function(el) {
        this[0] = this.element = el
    }
    avalon.fn = avalon.prototype = avalon.init.prototype
    //率先添加三个判定类型的方法

    function getType(obj) { //取得类型
        if (obj == null) {
            return String(obj)
        }
        // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
        return typeof obj === "object" || typeof obj === "function" ?
                class2type[serialize.call(obj)] || "object" :
                typeof obj
    }
    avalon.type = getType

    avalon.isWindow = function(obj) {
        if (!obj)
            return false
        // 利用IE678 window == document为true,document == window竟然为false的神奇特性
        // 标准浏览器及IE9，IE19等使用 正则检测
        return obj == obj.document && obj.document != obj
    }

    function isWindow(obj) {
        return rwindow.test(serialize.call(obj))
    }
    if (isWindow(window)) {
        avalon.isWindow = isWindow
    }
    //判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例。
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

        // 如果第一个参数为布尔,判定是否深拷贝
        if (typeof target === "boolean") {
            deep = target
            target = arguments[1] || {}
            i++
        }

        //确保接受方为一个复杂的数据类型
        if (typeof target !== "object" && getType(target) !== "function") {
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
                    copy = options[name]

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
    var eventMap = avalon.eventMap = {}

    function resetNumber(a, n, end) { //用于模拟slice, splice的效果
        if ((a === +a) && !(a % 1)) { //如果是整数
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
        error: function(str, e) { //如果不用Error对象封装一下，str在控制台下可能会乱码
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
        range: function(start, end, step) { // 用于生成整数数组
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
        bind: function(el, type, fn, phase) { // 绑定事件
            function callback(e) {
                var ex = e.target ? e : fixEvent(e || window.event)
                var ret = fn.call(el, ex)
                if (ret === false) {
                    ex.preventDefault()
                    ex.stopPropagation()
                }
                return ret
            }
            if (W3C) { //addEventListener对return false不做处理，需要自己fix
                el.addEventListener(eventMap[type] || type, callback, !!phase)
            } else {
                try {
                    el.attachEvent("on" + type, callback)
                } catch (e) {
                }
            }
            return callback
        },
        unbind: W3C ? function(el, type, fn, phase) { //卸载事件
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
            name = avalon.cssName(prop) || prop
            if (value === void 0 || typeof value === "boolean") { //获取样式
                var fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
                var val = fn(node, name)
                return value === true ? parseFloat(val) || 0 : val
            } else if (value === "") { //请除样式
                node.style[name] = ""
            } else {//设置样式
                if (value == null || value !== value) {
                    return;
                }
                if (isFinite(value) && !avalon.cssNumber[prop]) {
                    value += "px"
                }
                fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
                fn(node, name, value)
            }
            return that
        }
    })

    //视浏览器情况采用最快的异步回调
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
    } else if (window.VBArray) { //IE下这个通常只要1ms,而且没有副作用，不会发现请求，setImmediate如果只执行一次，与setTimeout一样要140ms上下
        avalon.nextTick = function(callback) {
            var node = DOC.createElement("script")
            node.onreadystatechange = function() {
                callback() //在interactive阶段就触发
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

    //只让节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象通过

    function isArrayLike(obj) {
        if (obj && typeof obj === "object") {
            var n = obj.length
            if (+n === n && !(n % 1) && n >= 0) { //检测length属性是否为非负整数
                try {
                    if ({}.propertyIsEnumerable.call(obj, 'length') === false) { //如果是原生对象
                        return Array.isArray(obj) || /^\s?function/.test(obj.item || obj.callee)
                    }
                    return true;
                } catch (e) { //IE的NodeList直接抛错
                    return true
                }
            }
        }
        return false
    }

    function generateID() {
        //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    avalon.each = function(obj, fn) {
        if (obj) { //不能传个null, undefined进来
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
     *                           ecma262 v5语法补丁                   *
     **********************************************************************/
    if (!"司徒正美".trim) {
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
            //定位操作，返回数组中第一个等于给定参数的元素的索引值。
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
            //定位引操作，同上，不过是从后遍历。
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
            //迭代操作，将数组的元素挨个儿传入一个函数中执行。Ptototype.js的对应名字为each。
            forEach: iterator('', '_', ''),
            //迭代类 在数组中的每个项上运行一个函数，如果此函数的值为真，则此元素作为新数组的元素收集起来，并返回新数组
            filter: iterator('r=[],j=0,', 'if(_)r[j++]=this[i]', 'return r'),
            //收集操作，将数组的元素挨个儿传入一个函数中执行，然后把它们的返回值组成一个新数组返回。Ptototype.js的对应名字为collect。
            map: iterator('r=[],', 'r[i]=_', 'return r'),
            //只要数组中有一个元素满足条件（放进给定函数返回true），那么它就返回true。Ptototype.js的对应名字为any。
            some: iterator('', 'if(_)return true', 'return false'),
            //只有数组中的元素都满足条件（放进给定函数返回true），它才返回true。Ptototype.js的对应名字为all。
            every: iterator('', 'if(!_)return false', 'return true')
        })
    }
    if (!root.contains) { //safari5+是把contains方法放在Element.prototype上而不是Node.prototype
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
        //将字符串安全格式化为正则表达式的源码
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
                        avalon.error("注意 " + c + " 已经重写过")
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
     *                      迷你jQuery对象的原型方法                    *
     **********************************************************************/

    function hyphen(target) {
        //转换为连字符线风格
        return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
    }

    function camelize(target) {
        //转换为驼峰风格
        if (target.indexOf("-") < 0 && target.indexOf("_") < 0) {
            return target //提前判断，提高getStyle等的效率
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
                offset = elem.getBoundingClientRect()
            } else {
                offsetParent = this.offsetParent() //得到真正的offsetParent
                offset = this.offset() // 得到正确的offsetParent
                if (offsetParent[0].tagName !== "HTML") {
                    parentOffset = offsetParent.offset()
                }
                parentOffset.top += avalon.css(offsetParent[0], "borderTopWidth", true)
                parentOffset.left += avalon.css(offsetParent[0], "borderLeftWidth", true)
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
            return avalon(offsetParent || root)
        },
        bind: function(type, fn, phase) {
            if (this[0]) { //此方法不会链
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
    //生成avalon.fn.scrollLeft, avalon.fn.scrollTop方法
    avalon.each({
        scrollLeft: "pageXOffset",
        scrollTop: "pageYOffset"
    }, function(method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node),
                    top = method === "scrollTop";
            if (!arguments.length) {
                return win ? (prop in win) ? win[prop] : root[method] : node[method];
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
    //=============================css相关=======================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
    var cssMap = {
        "float": 'cssFloat' in root.style ? 'cssFloat' : 'styleFloat',
        background: "backgroundColor"
    }
    avalon.cssNumber = oneObject("columnCount,order,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

    avalon.cssName = function(name, host, camelCase) {
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
        try { //node.style.width = NaN;node.style.width = "xxxxxxx";node.style.width = undefine 在旧式IE下会抛异常
            // Support: 在Chrome, Safari下用空字符串去掉 !important;
            node.style[name] = "";
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
                    ret = node.style[name] //其他浏览器需要我们手动取内联样式
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
        cssHooks["opacity:set"] = function(node, name, value) {
            node.style.filter = 'alpha(opacity=' + value * 100 + ')'
            node.style.zoom = 1
        }
        cssHooks["opacity:get"] = function(node) {
            //这是最快的获取IE透明值的方式，不需要动用正则了！
            var alpha = node.filters.alpha || node.filters[salpha],
                    op = alpha ? alpha.opacity : 100
            return (op / 100) + "" //确保返回的是字符串
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
                if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                    return node["inner" + name] || node.document.documentElement[clientProp]
                }
                if (node.nodeType === 9) { //取得页面尺寸
                    var doc = node.documentElement
                    //FF chrome    html.scrollHeight< body.scrollHeight
                    //IE 标准模式 : html.scrollHeight> body.scrollHeight
                    //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
                    return Math.max(node.body[scrollProp], doc[scrollProp], node.body[offsetProp], doc[offsetProp], doc[clientProp])
                }
                return parseFloat(this.css(method)) || 0
            } else {
                return this.css(method, value)
            }
        }

    })
    avalon.fn.offset = function() { //取得距离页面左右角的坐标
        var node = this[0],
                doc = node && node.ownerDocument
        var pos = {
            left: 0,
            top: 0
        }
        if (!doc) {
            return pos
        }
        //http://hkom.blog1.fc2.com/?mode=m&no=750 body的偏移量是不包含margin的
        //我们可以通过getBoundingClientRect来获得元素相对于client的rect.
        //http://msdn.microsoft.com/en-us/library/ms536433.aspx
        var box = node.getBoundingClientRect(),
                //chrome1+, firefox3+, ie4+, opera(yes) safari4+    
                win = doc.defaultView || doc.parentWindow,
                root = (navigator.vendor || doc.compatMode === "BackCompat") ? doc.body : doc.documentElement,
                clientTop = root.clientTop >> 0,
                clientLeft = root.clientLeft >> 0,
                scrollTop = win.pageYOffset || root.scrollTop,
                scrollLeft = win.pageXOffset || root.scrollLeft
        // 把滚动距离加到left,top中去。
        // IE一些版本中会自动为HTML元素加上2px的border，我们需要去掉它
        // http://msdn.microsoft.com/en-us/library/ms533564(VS.85).aspx
        pos.top = box.top + scrollTop - clientTop
        pos.left = box.left + scrollLeft - clientLeft
        return pos
    }

    //=============================val相关=======================

    function getValType(el) {
        var ret = el.tagName.toLowerCase()
        return ret === "input" && /checkbox|radio/.test(el.type) ? "checked" : ret
    }
    var valHooks = {
        "option:get": function(node) {
            // IE 9-10下如果option元素没有定义value而在设置innerText时没有把两边的空白去掉，那么
            // 取el.text，浏览器会进行trim, 并且伪造一个value值，此值会在刚才trim的结果两边添加了一些空白
            if (node.hasAttribute) {
                return node.hasAttribute("value") ? node.value : node.text
            }
            var val = node.attributes.value //specified 在较新的浏览器总是返回true, 因此不可靠，需要用hasAttribute
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
                //旧式IE在reset后不会改变selected，需要改用i === index判定
                //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
                //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
                if ((option.selected || i === index) && !option.disabled) {
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
        "select:set": function(node, values) {
            values = [].concat(values) //强制转换为数组
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
        ensure: function(target) {
            //只有当前数组不存在此元素时只添加它
            var args = aslice.call(arguments, 1)
            args.forEach(function(el) {
                if (!~target.indexOf(el)) {
                    target.push(el)
                }
            })
            return target
        },
        removeAt: function(target, index) {
            //移除数组中指定位置的元素，返回布尔表示成功与否。
            return !!target.splice(index, 1).length
        },
        remove: function(target, item) {
            //移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否。
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
            //取得其tagName
            rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
            rcreate = W3C ? /[^\d\D]/ : /(<(?:script|link|style|meta|noscript))/ig,
            scriptTypes = oneObject("text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript", "text/vbscript"),
            //需要处理套嵌关系的标签
            rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/
    //parseHTML的辅助变量
    var tagHooks = {
        area: [1, "<map>"],
        param: [1, "<object>"],
        col: [2, "<table><tbody></tbody><colgroup>", "</table>"],
        legend: [1, "<fieldset>"],
        option: [1, "<select multiple='multiple'>"],
        thead: [1, "<table>", "</table>"],
        tr: [2, "<table><tbody>"],
        td: [3, "<table><tbody><tr>"],
        //IE6-8在用innerHTML生成节点时，不能直接创建no-scope元素与HTML5的新标签
        _default: W3C ? [0, ""] : [1, "X<div>"] //div可以不用闭合
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
                //取得其标签名
                wrap = tagHooks[tag] || tagHooks._default,
                fragment = documentFragment.cloneNode(false),
                wrapper = domParser,
                firstChild
        if (!W3C) { //fix IE
            html = html.replace(rcreate, "<br class=fix_noscope>$1") //在link style script等标签之前添加一个补丁
        }
        wrapper.innerHTML = wrap[1] + html + (wrap[2] || "")
        var els = wrapper.getElementsByTagName("script")
        if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
            var script = DOC.createElement("script"),
                    neo
            for (var i = 0, el; el = els[i++]; ) {
                if (!el.type || scriptTypes[el.type]) { //如果script节点的MIME能让其执行脚本
                    neo = script.cloneNode(false) //FF不能省略参数
                    for (var j = 0, attr; attr = el.attributes[j++]; ) {
                        if (attr.specified) { //复制其属性
                            neo[attr.name] = attr.value
                        }
                    }
                    neo.text = el.text //必须指定,因为无法在attributes中遍历出来
                    el.parentNode.replaceChild(neo, el) //替换节点
                }
            }
        }
        //移除我们为了符合套嵌关系而添加的标签
        for (i = wrap[0]; i--; wrapper = wrapper.lastChild) {
        }
        if (!W3C) { //fix IE
            for (els = wrapper["getElementsByTagName"]("br"), i = 0; el = els[i++]; ) {
                if (el.className && el.className === "fix_noscope") {
                    el.parentNode.removeChild(el)
                }
            }
        }
        while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
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
            avalon.error("factory必须是函数")
        }
        factory = args[1]
        var scope = {
            $watch: noop
        }
        factory(scope) //得到所有定义
        var model = modelFactory(scope) //偷天换日，将scope换为model
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
            } else { //重新开始监听此VM的第一重简单属性的变动
                this.$events = this.$watch.backup
            }
            return this
        },
        $unwatch: function(type, callback) {
            var n = arguments.length
            if (n === 0) { //让此VM的所有$watch回调无效化
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
        //a为原来的VM， b为新数组或新对象
        if (valueType === "array") {
            var bb = b.concat()
            a.clear()
            a.push.apply(a, bb)
            return a
        } else {
            var added = [],
                    removed = [],
                    updated = [],
                    astr = [],
                    bstr = [],
                    iterators = a[subscribers]
            var amodel = a.$model
            //得到要移除的键值对
            for (var i in amodel) {
                if (!b || !b.hasOwnProperty(i)) {
                    removed.push(i)
                    delete amodel[i]
                }
            }
            // 得到要添加的键值对及其顺序
            for (var i in b) {
                if (b.hasOwnProperty(i) && i !== "hasOwnProperty") {
                    if (!a.hasOwnProperty(i)) {
                        added.push(i)
                    }
                    bstr.push(i)
                }
            }
            //得到其更键的键值对及其顺序
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
                    fn("sort", bstr, astr)
                })
            }
            var events = a.$events //待到$watch回调都绑定好再移除
            if (added.length || removed.length) {
                var scope = a.$model
                //移除已经删掉的键值对
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
            a[subscribers] = iterators //替换订阅者列表
            iterators.forEach(function(fn) {
                fn.host = a //替换订阅者列表中的视图刷新函数中的宿主（VM）
            })
            a.$events = events //替换原先绑定好的$watch回调
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
        var skipArray = scope.$skipArray, //要忽略监控的属性名列表
                vmodel = {}, //要返回的对象
                accessores = {}, //内部用于转换的对象
                callSetters = [],
                callGetters = [],
                VBPublics = Object.keys(unwatchOne) //用于IE6-8
        model = model || {} //这是vmodel上的$model属性
        watchMore = watchMore || {} //以$开头但要强制监听的属性
        skipArray = Array.isArray(skipArray) ? skipArray.concat(VBPublics) : VBPublics

        function loop(name, val) {
            if (!unwatchOne[name]) {
                model[name] = val
            }
            var valueType = getType(val)
            if (valueType === "function") {
                VBPublics.push(name) //函数无需要转换
            } else {
                if (skipArray.indexOf(name) !== -1 || (name.charAt(0) === "$" && !watchMore[name])) {
                    return VBPublics.push(name)
                }
                var accessor, oldArgs
                if (valueType === "object" && typeof val.get === "function" && Object.keys(val).length <= 2) {
                    var setter = val.set
                    var getter = val.get
                    accessor = function(neo) { //创建计算属性，因变量，基本上由其他监控属性触发其改变
                        var value = accessor.value,
                                preValue = value
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //阻止重复赋值
                            }
                            if (typeof setter === "function") {
                                var backup = vmodel.$events[name]
                                vmodel.$events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                                setter.call(vmodel, neo)
                                vmodel.$events[name] = backup
                            }
                            if (!isEqual(oldArgs, neo)) { //只检测用户的传参是否与上次是否一致
                                oldArgs = neo
                                value = accessor.value = model[name] = getter.call(vmodel)
                                notifySubscribers(accessor) //通知顶层改变
                                vmodel.$fire && vmodel.$fire(name, value, preValue)
                            }
                        } else {
                            if (openComputedCollect) { // 收集视图刷新函数
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
                    accessor = function(neo) { //创建监控属性或数组，自变量，由用户触发其改变
                        var value = accessor.value,
                                preValue = value,
                                complexValue
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //阻止重复赋值
                            }
                            if (!isEqual(value, neo)) {
                                if (rchecktype.test(valueType)) {
                                    if ("value" in accessor) { //如果已经转换过
                                        value = updateViewModel(value, neo, valueType)
                                        vmodel.$fire && vmodel.$fire(name, value, preValue)
                                    } else { //如果本来就是VM就直接输出，否则要转换
                                        value = neo.$model ? neo : modelFactory(neo, neo)
                                    }
                                    accessor[subscribers] = value[subscribers]
                                    complexValue = value.$model
                                } else { //如果是其他数据类型
                                    value = neo
                                }
                                accessor.value = value
                                model[name] = complexValue ? complexValue : value //更新$model中的值
                                notifySubscribers(accessor) //通知顶层改变
                                if (!complexValue) {
                                    vmodel.$fire && vmodel.$fire(name, value, preValue)
                                }
                            }
                        } else {
                            collectSubscribers(accessor) //收集视图函数
                            return value
                        }
                    }
                    callSetters.push(name)
                }
                accessor[subscribers] = [] //订阅者数组
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
        vmodel = defineProperties(vmodel, accessores, VBPublics) //生成一个空的ViewModel
        VBPublics.forEach(function(name) {
            if (!unwatchOne[name]) { //先为函数等不被监控的属性赋值
                vmodel[name] = scope[name]
            }
        })
        callSetters.forEach(function(prop) { //再为监控属性赋值
            vmodel[prop] = scope[prop]
        })
        callGetters.forEach(function(fn) { //最后强逼计算属性 计算自己的值
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
            if (!W3C) { //只有在IE678才加此补丁，因为VB对象的方法里的this并不指向自身，需要用bind处理一下
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
    //如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
    //标准浏览器使用__defineGetter__, __defineSetter__实现
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
    //IE6-8使用VBScript类的set get语句实现
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
                    "\t\tSet [__const__] = Me", //链式调用
                    "\tEnd Function")
            publics.forEach(function(name) { //添加公共属性,如果此时不加以后就没机会了
                if (owner[name] !== true) {
                    owner[name] = true //因为VBScript对象不能像JS那样随意增删属性
                    buffer.push("\tPublic [" + name + "]") //你可以预先放到skipArray中
                }
            })
            for (var name in description) {
                owner[name] = true
                buffer.push(
                        //由于不知对方会传入什么,因此set, let都用上
                        "\tPublic Property Let [" + name + "](val"+expose+")", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val"+expose+")",
                        "\tEnd Property",
                        "\tPublic Property Set [" + name + "](val"+expose+")", //setter
                        "\t\tCall [__proxy__]([__data__], \"" + name + "\", val"+expose+")",
                        "\tEnd Property",
                        "\tPublic Property Get [" + name + "]", //getter
                        "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                        "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tIf Err.Number <> 0 Then",
                        "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                        "\tEnd If",
                        "\tOn Error Goto 0",
                        "\tEnd Property")
            }
            buffer.push("End Class") //类定义完毕
            buffer.push(
                    "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                    "\tDim o",
                    "\tSet o = (New " + className + ")(a, b)",
                    "\tSet " + className + "Factory = o",
                    "End Function")
            window.parseVB(buffer.join("\r\n")) //先创建一个VB类工厂
            return window[className + "Factory"](description, VBMediator) //得到其产品
        }
    }

    function registerSubscriber(updateView, data) {
        updateView.element = data.element
        updateView.state = data.state
        Registry[expose] = updateView //暴光此函数,方便collectSubscribers收集
        openComputedCollect = true
        updateView()
        openComputedCollect = false
        delete Registry[expose]
    }

    function collectSubscribers(accessor) { //收集依赖于这个访问器的订阅者
        if (Registry[expose]) {
            var list = accessor[subscribers]
            list && avalon.Array.ensure(list, Registry[expose]) //只有数组不存在此元素才push进去
        }
    }


    function notifySubscribers(accessor) { //通知依赖于这个访问器的订阅者更新自身
        var list = accessor[subscribers]
        if (list && list.length) {
            var args = aslice.call(arguments, 1)
            var safelist = list.concat()
            for (var i = 0, fn; fn = safelist[i++]; ) {
                var el = fn.element,
                        state = fn.state,
                        remove
                if (el && (!state || state.sourceIndex !== 0)) {
                    if (typeof el.sourceIndex == "number") {
                        remove = el.sourceIndex === 0
                    } else {
                        try {
                            remove = !root.contains(el)
                        } catch (e) { //旧式IE的contains不支持传入文本节点
                            remove = true
                            while (el == el.parentNode) {
                                if (el === root) {
                                    remove = false
                                    break
                                }
                            }
                        }
                    }
                }
                if (remove) {
                    avalon.Array.remove(list, fn)
                } else {
                    fn.apply(0, args) //强制重新计算自身
                }

            }
        }
    }
    /*********************************************************************
     *                           Scan                                     *
     **********************************************************************/
    avalon.scan = function(elem, vmodel, state) {
        elem = elem || root
        var vmodels = vmodel ? [].concat(vmodel) : []
        scanTag(elem, vmodels, state)
    }


    function scanNodes(parent, vmodels, state) {
        var nodes = []
        for (var i = 0, node; node = parent.childNodes[i++]; ) {
            nodes.push(node)
        }
        for (var i = 0; node = nodes[i++]; ) {
            if (node.nodeType === 1) {
                scanTag(node, vmodels, state) //扫描元素节点
            } else if (node.nodeType === 3) {
                scanText(node, vmodels, state) //扫描文本节点
            }
        }
    }

    var stopScan = oneObject("area,base,basefont,br,col,hr,img,input,link,meta,param,embed,wbr,script,style,textarea")


    function scanTag(elem, vmodels, state, node) {
        vmodels = vmodels || []
        //扫描顺序  ms-skip --> ms-important --> ms-controller --> ms-if --> ...
        var a = elem.getAttribute(prefix + "skip")
        var b = elem.getAttributeNode(prefix + "important")
        var c = elem.getAttributeNode(prefix + "controller")
        if (typeof a === "string") {
            return
        } else if (node = b || c) {
            var newVmodel = VMODELS[node.value]
            if (!newVmodel) {
                return
            }
            //ms-important不包含父VM，ms-controller相反
            vmodels = node === b ? [newVmodel] : [newVmodel].concat(vmodels)
            elem.removeAttribute(node.name)//removeAttributeNode不会刷新[ms-controller]样式规则
        }
        scanAttr(elem, vmodels, function(status) { //扫描特性节点
            if (!stopScan[elem.tagName.toLowerCase()] && rbind.test(elem.innerHTML)) {
                scanNodes(elem, vmodels, status) //扫描子孙元素
            }
        }, state)

    }

    function scanText(textNode, vmodels, state) {
        var bindings = extractTextBindings(textNode)
        if (bindings.length) {
            executeBindings(bindings, vmodels, state)
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
                if (value) { // {{ 左边的文本
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
                if (value) { //{{ }} 之间的表达式
                    var leach = []
                    if (value.indexOf("|") > 0) { // 抽取过滤器 注意排除短路与
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
            if (value) { //}} 右边的文本
                tokens.push({
                    value: value,
                    expr: false
                })
            }
        }
        return tokens
    }

    function scanAttr(el, vmodels, callback, state, ifBinding) {
        var bindings = []
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                if (attr.name.indexOf(prefix) !== -1) {
                    //如果是以指定前缀命名的
                    var array = attr.name.split("-")
                    var type = array[1]
                    if (typeof bindingHandlers[type] === "function") {
                        (function(node) {
                            var binding = {
                                type: type,
                                param: array.slice(2).join("-"),
                                element: el,
                                remove: true,
                                node: node,
                                value: node.nodeValue
                            }
                            if (node.name === "ms-if") {
                                ifBinding = binding
                            } else {
                                bindings.push(binding)
                            }
                        })(attr)
                    }
                }
            }
        }
        bindings.sort(function(a, b) {
            return a.node.name > b.node.name
        })
        if (ifBinding) {
            // 优先处理if绑定， 如果if绑定的表达式为假，那么就不处理同级的绑定属性及扫描子孙节点
            ifBinding.state = {}
            bindingHandlers["if"](ifBinding, vmodels, function() {
                executeBindings(bindings, vmodels, ifBinding.state)
                callback(ifBinding.state)
            })
        } else {
            executeBindings(bindings, vmodels, state)
            callback(state)
        }
    }

    function executeBindings(bindings, vmodels, state) {
        bindings.forEach(function(data) {
            data.state = state
            bindingHandlers[data.type](data, vmodels)
            if (data.remove) { //移除数据绑定，防止被二次解析
                //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/avalon/issues/99
                data.element.removeAttribute(data.node.name)
            }
            data.remove = true
        })
        bindings.length = 0
    }

    function extractTextBindings(textNode) {
        var bindings = [],
                tokens = scanExpr(textNode.nodeValue)
        if (tokens.length) {
            while (tokens.length) { //将文本转换为文本节点，并替换原来的文本节点
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
                    bindings.push(binding) //收集带有插值表达式的文本
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
            // 关键字
            'break,case,catch,continue,debugger,default,delete,do,else,false' + ',finally,for,function,if,in,instanceof,new,null,return,switch,this' + ',throw,true,try,typeof,var,void,while,with'
            // 保留字
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

    //添加赋值语句

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
    //取得求值函数及其传参

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
            //args 是一个对象数组， names 是将要生成的求值函数的参数
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
                delete data.filters //释放内存
            } else {
                code = "\nreturn " + code + ";" //IE全家 Function("return ")出错，需要Function("return ;")
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
            textBuffer = names = null //释放内存
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
            } //方便调试
            //这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
            //将它移出订阅者列表
            registerSubscriber(updateView, data)
        }
    }

    avalon.updateViewFactory = updateViewFactory
    /*********************************************************************
     *                         Bind                                    *
     **********************************************************************/
    //将视图中的需要局部刷新的部分与ViewModel用绑定处理函数连结在一起,生成updateView函数,
    //而它内部调用着之前编译好的函数compileFn，双向产生依赖，成为双向绑定链的最顶层
    //visible binding相关
    var cacheDisplay = oneObject("a,abbr,b,span,strong,em,font,i,kbd", "inline")
    avalon.mix(cacheDisplay, oneObject("div,h1,h2,h3,h4,h5,h6,section,p", "block"))

    function parseDisplay(nodeName, val) {
        //用于取得此类标签的默认display值
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
    avalon.parseDisplay = parseDisplay
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

    var styleEl = '<style id="avalonStyle">.fixMsIfFlicker{ display: none!important }</style>'
    styleEl = avalon.parseHTML(styleEl).firstChild //IE6-8 head标签的innerHTML是只读的
    head.insertBefore(styleEl, null) //避免IE6 base标签BUG

    var bindingHandlers = avalon.bindingHandlers = {
        "if": function(data, vmodels, callback) {
            callback = callback || avalon.noop
            var placehoder = DOC.createComment("@"),
                    elem = data.element,
                    state = data.state,
                    parent
            if (root.contains(elem)) {
                ifcall()
            } else {
                avalon(elem).addClass("fixMsIfFlicker")
                var id = setInterval(function() {
                    if (root.contains(elem)) {
                        clearInterval(id)
                        ifcall()
                        avalon(elem).removeClass("fixMsIfFlicker")
                    }
                }, 20)
            }

            function ifcall() {
                parent = elem.parentNode
                updateViewFactory(data.value, vmodels, data, function(val) {
                    if (val) { //添加 如果它不在DOM树中, 插入DOM树
                        if (!root.contains(elem)) {
                            try {
                                parent.replaceChild(elem, placehoder)
                                delete state.sourceIndex
                            } catch (e) {
                            }
                        }
                        avalon.nextTick(callback)
                    } else { //移除  如果它还在DOM树中， 移出DOM树
                        if (root.contains(elem)) {
                            parent.replaceChild(placehoder, elem)
                            state.sourceIndex = 0
                        }
                    }
                })
            }
        },
        // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
        // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
        // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
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
                if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
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
                        return fn.apply(this, args.concat(e))
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
                if (val && typeof val === "object") {
                    elem[key] = val
                } else {
                    elem.setAttribute(key, String(val))
                }
            })
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        text: function(data, vmodels) {
            var node = data.node
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                if (node.nodeType === 2) { //如果是特性节点，说明在元素节点上使用了ms-text
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
        //控制元素显示或隐藏
        visible: function(data, vmodels) {
            var elem = data.element
            if (!supportDisplay && !root.contains(elem)) { //fuck firfox 全家！
                var display = parseDisplay(elem.tagName)
            }
            display = display || avalon(elem).css("display")
            display = display === "none" ? parseDisplay(elem.tagName) : display
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                elem.style.display = val ? display : "none"
            })
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href, include, css添加插值表达式
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
                                    scanNodes(elem, vmodels, data.state)
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
                            scanNodes(elem, vmodels, data.state)
                        })
                    }
                } else {
                    elem[method] = val
                }
            }, simple ? null : scanExpr(data.value))
        },
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔
        disabled: function(data, vmodels) {
            var name = data.type,
                    propName = name === "readonly" ? "readOnly" : name
            updateViewFactory(data.value, vmodels, data, function(val, elem) {
                elem[propName] = !!val
            })
        },
        //ms-bind="name:callback",绑定一个属性，当属性变化时执行对应的回调，this为绑定元素
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
                    elem.insertBefore(f, data.replaceNodes[0] || null) //fix IE6-8 insertBefore的第2个参数只能为节点或null
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
            var uiName = data.value.trim() //取得UI控制的名称
            var elem = data.element //取得被绑定元素
            var id = (elem.getAttribute("data-id") || "").trim()
            if (!id) { //取得此控件的VM的ID
                id = uiName + setTimeout("1") //没有就随机生成一个
                elem.setAttribute("data-id", id)
            }
            elem[id + "vmodels"] = vmodels //将它临时保存起来
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
                try {
                    delete elem[id + "vmodels"]
                } catch (e) {
                    elem[id + "vmodels"] = void 0
                }
            } else {
                delete data.remove
            }
        }
    }

    //============================================================================
    //根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
    "class,hover,active".replace(rword, function(method) {
        bindingHandlers[method] = function(data, vmodels) {
            var oldStyle = data.param,
                    elem = data.element,
                    $elem = avalon(elem)
            if (!oldStyle || isFinite(oldStyle)) {

                var text = data.value,txt = "sp";
                var arr =text.match(rexprg);
                text = text.replace(rexprg,"<{{}}>");
                text = text.match(rnospaces).join("{<>}");
                text = text.replace(/<{{}}>/ig,function(){
                    return arr.shift();
                }).split("{<>}");

                text.forEach(function(text){

                    var toggle, oldClass;

                    var noExpr = text.replace(rexprg, function(a) {
                        return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
                    })
                    var colonIndex = noExpr.indexOf(":") //取得第一个冒号的位置
                    if (colonIndex === -1) { // 比如 ms-class="aaa bbb ccc" 的情况
                        var className = text,
                                rightExpr
                    } else { // 比如 ms-class-1="ui-state-active:checked" 的情况 
                        className = text.slice(0, colonIndex)
                        rightExpr = text.slice(colonIndex + 1)
                        var array = parseExpr(rightExpr, vmodels, {})
                        if (!Array.isArray(array)) {
                            log("'" + (rightExpr || "").trim() + "' 不存在于VM中")
                            return false
                        }
                        var callback = array[0],
                                args = array[1]
                    }
                    var hasExpr = rexpr.test(className) //比如ms-class="width{{w}}"的情况

                    updateViewFactory("", vmodels, data, function(cls) {
                        toggle = callback ? !!callback.apply(elem, args) : true
                        className = hasExpr ? cls : className
                        if (method === "class") {
                            if (toggle && oldClass) {
                                $elem.removeClass(oldClass)
                            }
                            $elem.toggleClass(className, toggle)
                            oldClass = className
                        }
                    }, (hasExpr ? scanExpr(className) : null))

                    if (method === "hover" || method === "active") {
                        if (method === "hover") { //在移出移入时切换类名
                            var event1 = "mouseenter"
                            var event2 = "mouseleave"
                        } else { //在聚焦失焦中切换类名
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

                });

            } else if (method === "class") {
                updateViewFactory(data.value, vmodels, data, function(val) {
                    $elem.toggleClass(oldStyle, !!val)
                })
            }
        }
    })

    //============================= boolean preperty binding =======================
    //与disabled绑定器 用法差不多的其他布尔属性的绑定器
    "checked,readonly,selected".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled
    })
    bindingHandlers.enabled = function(data, vmodels) {
        updateViewFactory(data.value, vmodels, data, function(val, elem) {
            elem.disabled = !val
        })
    }
    //============================= string preperty binding =======================
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title,alt,src,value,css,include".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href
    })
    //============================= model binding =======================
    //将模型中的字段与input, textarea的value值关联在一起
    var modelBinding = bindingHandlers.duplex = bindingHandlers.model = function(data, vmodels) {
        var elem = data.element,
                tagName = elem.tagName
        if (data.type === "model") {
            log("ms-model已经被废弃，请使用ms-duplex")
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
                if (!elem.name) { //如果用户没有写name属性，浏览器默认给它一个空字符串
                    elem.name = generateID()
                }
                var updateView = modelBinding[tagName](data, array[0], vm)
                updateView && registerSubscriber(updateView, data)
            }
        }
    }
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    modelBinding.INPUT = function(data, fn, scope) {
        var element = data.element
        var fixType = data.param
        var type = element.type,
                $elem = avalon(element)
        if (type === "checkbox" && fixType === "radio") {
            type = "radio"
        }
        //当value变化时改变model的值
        var updateModel = function() {
            if ($elem.data("observe") !== false) {
                fn(scope, element.value)
            }
        }
        //当model变化时,它就会改变value的值
        var updateView = function() { //先执行updateView
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
                if (window.addEventListener) { //先执行W3C
                    element.addEventListener("input", updateModel)
                } else {
                    element.attachEvent("onpropertychange", function(e) {
                        if (e.propertyName === "value") {
                            updateModel()
                        }
                    })
                }

                if (DOC.documentMode === 9) { //fuck IE9
                    var selectionchange = function(e) {
                        if (e.type === "focus") {
                            document.addEventListener("selectionchange", updateModel)
                        } else {
                            document.removeEventListener("selectionchange", updateModel)
                        }
                    };
                    element.addEventListener("focus", selectionchange)
                    element.addEventListener("blur", selectionchange)
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
                var array = [].concat(fn(scope)) //强制转换为数组
                try {
                    element.checked = array.indexOf(element.value) >= 0
                } catch (e) {
                    log("<input type='checkbox' ms-duplex='prop' /> 中prop应为一个数组")
                }
            }
            $elem.bind("click", updateModel) //IE6-8
        }
        return updateView
    }
    modelBinding.SELECT = function(data, fn, scope, oldValue) {
        var $elem = avalon(data.element)

        function updateModel() {
            if ($elem.data("observe") !== false) {
                var neo = $elem.val() //字符串或字符串数组
                if (neo + "" !== oldValue) {
                    fn(scope, neo)
                    oldValue = neo + ""
                }
            }
        }

        function updateView() {
            var neo = fn(scope)
            neo = Array.isArray(neo) ? neo.map(String) : neo + ""
            if (neo + "" !== oldValue) {
                $elem.val(neo)
                oldValue = neo + ""
            }
        }
        $elem.bind("change", updateModel)
        setTimeout(function() {
            //先等到select里的option元素被扫描后，才根据model设置selected属性
            registerSubscriber(updateView, data)
        })
    }
    modelBinding.TEXTAREA = modelBinding.INPUT
    //============================= event binding =======================

    var eventName = {
        AnimationEvent: 'animationend',
        WebKitAnimationEvent: 'webkitAnimationEnd'
    }
    for (var name in eventName) {
        if (/object|function/.test(typeof window[name])) {
            eventMap.animationend = eventName[name]
            break;
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
        event.preventDefault = function() { //阻止默认行为
            event.returnValue = false
        }
        event.stopPropagation = function() { //阻止事件在DOM树中的传播
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
     *                 与each绑定息息相关的监控数组              *
     **********************************************************************/

    function convert(val) {
        var type = getType(val)
        if (rchecktype.test(type)) {
            val = val.$id ? val : modelFactory(val, val, type)
        }
        return val
    }

    //取得el在array的位置

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

    var _splice = [].splice
    var CollectionPrototype = {
        _splice: _splice,
        _add: function(arr, pos) {
            var oldLength = this.length
            pos = typeof pos === "number" ? pos : oldLength;
            var added = []
            for (var i = 0, n = arr.length; i < n; i++) {
                added[i] = convert(arr[i])
            }
            _splice.apply(this, [pos, 0].concat(added))
            notifySubscribers(this, "add", added, pos)
            if (!this._stopFireLength) {
                return this._.length = this.length
            }
        },
        _del: function(pos, n) {
            var ret = this._splice(pos, n)
            if (ret.length) {
                notifySubscribers(this, "del", pos, n)
                if (!this._stopFireLength) {
                    this._.length = this.length
                }
            }
            return ret
        },
        push: function() {
            [].push.apply(this.$model, arguments)
            return this._add(arguments) //返回长度
        },
        unshift: function() {
            [].unshift.apply(this.$model, arguments)
            var ret = this._add(arguments, 0) //返回长度
            notifySubscribers(this, "index", arguments.length)
            return ret
        },
        shift: function() {
            var el = this.$model.shift()
            this._del(0, 1)
            notifySubscribers(this, "index", 0)
            return el //返回被移除的元素
        },
        pop: function() {
            var el = this.$model.pop()
            this._del(this.length - 1, 1)
            return el //返回被移除的元素
        },
        splice: function(a, b) {
            // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
            a = resetNumber(a, this.length)
            var removed = _splice.apply(this.$model, arguments),
                    ret = []
            this._stopFireLength = true //确保在这个方法中 , $watch("length",fn)只触发一次
            if (removed.length) {
                ret = this._del(a, removed.length)
                if (arguments.length <= 2) { //如果没有执行添加操作，需要手动resetIndex
                    notifySubscribers(this, "index", 0)
                }
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
            }
            this._stopFireLength = false
            this._.length = this.length
            return ret //返回被移除的元素
        },
        contains: function(el) { //判定是否包含
            return this.indexOf(el) !== -1
        },
        size: function() { //取得数组长度，这个函数可以同步视图，length不能
            return this._.length
        },
        remove: function(el) { //移除第一个等于给定值的元素
            var index = this.indexOf(el)
            if (index >= 0) {
                return this.removeAt(index)
            }
        },
        removeAt: function(index) { //移除指定索引上的元素
            this.splice(index, 1)
        },
        clear: function() {
            this.$model.length = this.length = this._.length = 0 //清空数组
            notifySubscribers(this, "clear")
            return this
        },
        removeAll: function(all) { //移除N个元素
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    this.remove(el)
                }, this)
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
        },
        ensure: function(el) {
            if (!this.contains(el)) { //只有不存在才push
                this.push(el)
            }
            return this
        },
        set: function(index, val) {
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
    }
    "sort,reverse".replace(rword, function(method) {
        CollectionPrototype[method] = function() {
            [][method].apply(this.$model, arguments)
            var sorted = false
            for (var i = 0, n = this.length; i < n; i++) {
                var a = this.$model[i],
                        b = this[i]
                b = b && b.$model ? b.$model : b
                if (!isEqual(a, b)) {
                    sorted = true
                    var index = getVMIndex(a, this, i)
                    var remove = this._splice(index, 1)[0]
                    this._splice(i, 0, remove)
                    notifySubscribers(this, "move", index, i)
                }
            }
            if (sorted) {
                notifySubscribers(this, "index", 0)
            }
            return this
        }
    })

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array[subscribers] = []
        array.$model = model.concat()
        array.$events = {} //VB对象的方法里的this并不指向自身，需要使用bind处理一下
        array._ = modelFactory({
            length: model.length
        })
        array._.$watch("length", function(a, b) {
            array.$fire("length", a, b)
        })
        for (var i in Observable) {
            array[i] = Observable[i]
        }
        avalon.mix(array, CollectionPrototype)
        return array
    }

    //====================== each binding  =================================
    var withMapper = {}
    bindingHandlers["each"] = function(data, vmodels) {
        var elem = data.element,
                list, updateView
        var array = parseExpr(data.value, vmodels, data)
        if (typeof array === "object") {
            list = array[0].apply(array[0], array[1])
        }
        var view = documentFragment.cloneNode(false)
        while (elem.firstChild) {
            view.appendChild(elem.firstChild)
        }
        data.template = view
        data.vmodels = vmodels
        if (typeof list !== "object") {
            return list
        }
        // 由于eachIterator、withIterator为内存开销非常大的复杂函数，因此我们只创建一个，
        // 然后通过updateView这个虚拟代理来内部调用它
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
        updateView.element = elem
        updateView.state = data.state
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
                // 为了保证了withIterator的add一致，需要对调一下第2，第3参数
                var arr = pos,
                        pos = el,
                        transation = documentFragment.cloneNode(false)
                for (var i = 0, n = arr.length; i < n; i++) {
                    var ii = i + pos
                    var proxy = createEachProxy(ii, arr[i], list, data.param)
                    var tview = data.template.cloneNode(true)
                    mapper.splice(ii, 0, proxy)
                    var base = typeof arr[i] === "object" ? [proxy, arr[i]] : [proxy]
                    scanNodes(tview, base.concat(data.vmodels), data.state)
                    proxy.$accessor.$last.get.element = tview.firstChild
                    if (typeof group !== "number") {
                        data.group = tview.childNodes.length //记录每个模板一共有多少子节点
                    }
                    transation.appendChild(tview)
                }
                //得到插入位置 IE6-10要求insertBefore的第2个参数为节点或null，不能为undefined
                locatedNode = getLocatedNode(parent, group, pos)
                parent.insertBefore(transation, locatedNode)
                break
            case "del":
                mapper.splice(pos, el) //移除对应的子VM
                removeView(locatedNode, group, el)
                break
            case "index":
                for (; el = mapper[pos]; pos++) {
                    el.$index = pos
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
                scanNodes(tview, [mapper[key], val].concat(data.vmodels), data.state)
                if (typeof group !== "number") {
                    data.group = tview.childNodes.length
                }
                markstone[key] = tview.firstChild
                transation.appendChild(tview)
                break
            case "sort":
                for (var i = 0, name; name = object[i++]; ) {
                    var node = markstone[name]
                    var view = removeView(node, group) //先移出DOM树
                    transation.appendChild(view)
                }
                parent.appendChild(transation) //再插到最后
                break
            case "add":
                for (var i in object) {
                    if (object.hasOwnProperty(i) && i !== "hasOwnProperty") {
                        if (!markstone.hasOwnProperty(i)) { //这是新增的
                            withIterator("append", i, object[i], data, host, transation)
                            ret.push(i)
                        }
                    }
                }
                parent.appendChild(transation) //再插到最后
                return ret
            case "remove":
                var removeNodes = []
                for (var i = 0, name; name = object[i++]; ) {
                    var node = markstone[name]
                    if (node) {
                        markstone[name] = withMapper[host.$id][name] = 0 //移除不再存在的键
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
    //收集要移除的节点，第一个节点要求先放进去

    function gatherRemovedNodes(array, node, length) {
        for (var i = 1; i < length; i++) {
            node = node.nextSibling
            array.push(node)
        }
        return array
    }
    // 取得用于定位的节点。在绑定了ms-each, ms-with属性的元素里，它的整个innerHTML都会视为一个子模板先行移出DOM树，
    // 然后如果它的元素有多少个（ms-each）或键值对有多少双（ms-with），就将它复制多少份(多少为N)，再经过扫描后，重新插入该元素中。
    // 这时该元素的孩子将分为N等分，每等份的第一个节点就是这个用于定位的节点，
    // 方便我们根据它算出整个等分的节点们，然后整体移除或移动它们。

    function getLocatedNode(parent, group, pos) {
        return parent.childNodes[group * pos] || null
    }

    function removeView(node, group, n) {
        n = n || 1
        var removeNodes = gatherRemovedNodes([node], node, group * n)
        var view = documentFragment.cloneNode(false)
        for (var i = 0, node; node = removeNodes[i++]; ) {
            view.appendChild(node) //通常添加到文档碎片实现移除
        }
        return view
    }
    //为子视图创建一个ViewModel

    function createWithProxy(key, val) {
        return modelFactory({
            $key: key,
            $val: val
        }, 0, {
            $val: 1
        })
    }
    var watchEachOne = oneObject("$index,$remove,$first,$last")
    // 创建一个代理对象，通过它能访问元素的索引值（$index），是否位于开头($first)，结尾($last)等特征

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
            get: function() { //有时用户是传个普通数组
                var n = typeof list.size === "function" ? list.size() : list.length
                return this.$index === n - 1
            }
        }
        source.$remove = function() {
            return list.removeAt(ret.$index)
        }
        var ret = modelFactory(source, 0, watchEachOne)
        return ret
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
            //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
            length = length || 30
            truncation = truncation === void(0) ? "..." : truncation
            return target.length > length ? target.slice(0, length - truncation.length) + truncation : String(target)
        },
        camelize: camelize,
        escape: function(html) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
            return String(html)
                    .replace(/&(?!\w+;)/g, '&amp;')
                    .replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;')
                    .replace(/"/g, '&quot;')
        },
        currency: function(number, symbol) {
            symbol = symbol || "￥"
            return symbol + avalon.filters.number(number)
        },
        number: function(number, decimals, dec_point, thousands_sep) {
            //与PHP的number_format完全兼容
            //number	必需，要格式化的数字
            //decimals	可选，规定多少个小数位。
            //dec_point	可选，规定用作小数点的字符串（默认为 . ）。
            //thousands_sep	可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
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
        //取得上午下午

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
                var s = toInt(match[6] || 0)
                var ms = Math.round(parseFloat('0.' + (match[7] || 0)) * 1000)
                timeSetter.call(date, h, m, s, ms)
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
            medium: "yyyy-M-d ah:mm:ss",
            mediumDate: "yyyy-M-d",
            mediumTime: "ah:mm:ss",
            "short": "yy-M-d ah:mm",
            shortDate: "yy-M-d",
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
        var loadings = [] //正在加载中的模块列表
        var factorys = [] //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
        var basepath

        function cleanUrl(url) {
            return (url || "").replace(/[?#].*/, "")
        }

        plugins.js = function(url, shim) {
            var id = cleanUrl(url)
            if (!modules[id]) { //如果之前没有加载过
                modules[id] = {
                    id: id,
                    parent: parent,
                    exports: {}
                }
                if (shim) { //shim机制
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
            var id = url.replace(/(#.+|\W)/g, "") ////用于处理掉href中的hash与所有特殊符号
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
        if (!cur) { //处理window safari的Error没有stack的问题
            cur = avalon.slice(document.scripts).pop().src
        }
        var url = cleanUrl(cur)
        basepath = kernel.base = url.slice(0, url.lastIndexOf("/") + 1)

        function getCurrentScript(base) {
            // 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
            var stack
            try {
                a.b.c() //强制报错,以便捕获e.stack
            } catch (e) { //safari的错误对象只有line,sourceId,sourceURL
                stack = e.stack
                if (!stack && window.opera) {
                    //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
                    stack = (String(e).match(/of linked script \S+/g) || []).join(" ")
                }
            }
            if (stack) {
                /**e.stack最后一行在所有支持的浏览器大致如下:
                 *chrome23:
                 * at http://113.93.50.63/data.js:4:1
                 *firefox17:
                 *@http://113.93.50.63/query.js:4
                 *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
                 *@http://113.93.50.63/data.js:4
                 *IE10:
                 *  at Global code (http://113.93.50.63/data.js:4:1)
                 *  //firefox4+ 可以用document.currentScript
                 */
                stack = stack.split(/[@ ]/g).pop() //取得最后一行,最后一个空格或@之后的部分
                stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, "") //去掉换行符
                return stack.replace(/(:\d+)?:\d+$/i, "") //去掉行号与或许存在的出错字符起始位置
            }
            var nodes = (base ? DOC : head).getElementsByTagName("script") //只在head标签中寻找
            for (var i = nodes.length, node; node = nodes[--i]; ) {
                if ((base || node.className === subscribers) && node.readyState === "interactive") {
                    return node.className = node.src
                }
            }
        }

        function checkCycle(deps, nick) {
            //检测是否存在循环依赖
            for (var id in deps) {
                if (deps[id] === "司徒正美" && modules[id].state !== 2 && (id === nick || checkCycle(modules[id].deps, nick))) {
                    return true
                }
            }
        }

        function checkDeps() {
            //检测此JS模块的依赖是否都已安装完毕,是则安装自身
            loop: for (var i = loadings.length, id; id = loadings[--i]; ) {

                var obj = modules[id],
                        deps = obj.deps
                for (var key in deps) {
                    if (ohasOwn.call(deps, key) && modules[key].state !== 2) {
                        continue loop
                    }
                }
                //如果deps是空对象或者其依赖的模块的状态都是2
                if (obj.state !== 2) {
                    loadings.splice(i, 1) //必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                    fireFactory(obj.id, obj.args, obj.factory)
                    checkDeps() //如果成功,则再执行一次,以防有些模块就差本模块没有安装好
                }
            }
        }

        function checkFail(node, onError, fuckIE) {
            var id = cleanUrl(node.src) //检测是否死链
            node.onload = node.onreadystatechange = node.onerror = null
            if (onError || (fuckIE && !modules[id].state)) {
                setTimeout(function() {
                    head.removeChild(node)
                    node = null // 处理旧式IE下的循环引用问题
                })
                log("加载 " + id + " 失败" + onError + " " + (!modules[id].state))
            } else {
                return true
            }
        }

        function loadResources(url, parent, ret, shim) {
            //1. 特别处理mass|ready标识符
            if (url === "ready!" || (modules[url] && modules[url].state === 2)) {
                return url
            }
            //2. 转化为完整路径
            if (kernel.alias[url]) { //别名机制
                url = kernel.alias[url]
                if (typeof url === "object") {
                    shim = url
                    url = url.src
                }
            }
            //3.  处理text!  css! 等资源
            var plugin
            url = url.replace(/^\w+!/, function(a) {
                plugin = a.slice(0, -1)
                return ""
            })
            plugin = plugin || "js"
            plugin = plugins[plugin] || noop
            //4. 补全路径
            if (/^(\w+)(\d)?:.*/.test(url)) {
                ret = url
            } else {
                parent = parent.substr(0, parent.lastIndexOf('/'))
                var tmp = url.charAt(0)
                if (tmp !== "." && tmp !== "/") { //相对于根路径
                    ret = basepath + url
                } else if (url.slice(0, 2) === "./") { //相对于兄弟路径
                    ret = parent + url.slice(1)
                } else if (url.slice(0, 2) === "..") { //相对于父路径
                    var arr = parent.replace(/\/$/, "").split("/")
                    tmp = url.replace(/\.\.\//g, function() {
                        arr.pop()
                        return ""
                    })
                    ret = arr.join("/") + "/" + tmp
                } else if (tmp === "/") {
                    ret = parent + url //相对于兄弟路径
                } else {
                    avalon.error("不符合模块标识规则: " + url)
                }
            }
            //5. 补全扩展名
            url = cleanUrl(ret)
            var ext = plugin.ext
            if (ext) {
                if (url.slice(0 - ext.length) !== ext) {
                    ret += ext
                }
            }
            //6. 缓存处理
            if (kernel.nocache) {
                ret += (ret.indexOf("?") === -1 ? "?" : "&") + (new Date - 0)
            }
            return plugin(ret, shim)
        }

        function loadJS(url, id, callback) {
            //通过script节点加载目标模块
            var node = DOC.createElement("script")
            node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
            node[W3C ? "onload" : "onreadystatechange"] = function() {
                if (W3C || /loaded|complete/i.test(node.readyState)) {
                    //mass Framework会在_checkFail把它上面的回调清掉，尽可能释放回存，尽管DOM0事件写法在IE6下GC无望
                    var factory = factorys.pop()
                    factory && factory.delay(id)
                    if (callback) {
                        callback()
                    }
                    if (checkFail(node, false, !W3C)) {
                        log("已成功加载 " + url)
                    }
                }
            }
            node.onerror = function() {
                checkFail(node, true)
            }
            node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
            head.insertBefore(node, head.firstChild) //chrome下第二个参数不能为null
            log("正准备加载 " + url) //更重要的是IE6下可以收窄getCurrentScript的寻找范围
        }

        innerRequire = avalon.require = function(list, factory, parent) {
            // 用于检测它的依赖是否都为2
            var deps = {},
                    // 用于保存依赖模块的返回值
                    args = [],
                    // 需要安装的模块数
                    dn = 0,
                    // 已安装完的模块数
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
                        deps[url] = "司徒正美" //去重
                    }
                }
            })
            modules[id] = {//创建一个对象,记录模块的加载情况与其他信息
                id: id,
                factory: factory,
                deps: deps,
                args: args,
                state: 1
            }
            if (dn === cn) { //如果需要安装的等于已安装好的
                fireFactory(id, args, factory) //安装到框架中
            } else {
                //放到检测列队中,等待checkDeps处理
                loadings.unshift(id)
            }
            checkDeps()
        }

        /**
         * 定义模块
         * @param {String} id ? 模块ID
         * @param {Array} deps ? 依赖列表
         * @param {Function} factory 模块工厂
         * @api public
         */
        innerRequire.define = function(id, deps, factory) { //模块名,依赖列表,模块本身
            var args = aslice.call(arguments)

            if (typeof id === "string") {
                var _id = args.shift()
            }
            if (typeof args[0] === "boolean") { //用于文件合并, 在标准浏览器中跳过补丁模块
                if (args[0]) {
                    return
                }
                args.shift()
            }
            if (typeof args[0] === "function") {
                args.unshift([])
            } //上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
            //现在除了safari外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，
            //safari可通过onload+delay闭包组合解决
            var name = modules[_id] && modules[_id].state >= 1 ? _id : cleanUrl(getCurrentScript())
            if (!modules[name] && _id) {
                modules[name] = {
                    id: name,
                    factory: factory,
                    state: 1
                }
            }
            factory = args[1]
            factory.id = _id //用于调试
            factory.delay = function(d) {
                args.push(d)
                var isCycle = true
                try {
                    isCycle = checkCycle(modules[d].deps, d)
                } catch (e) {
                }
                if (isCycle) {
                    avalon.error(d + "模块与之前的某些模块存在循环依赖")
                }
                delete factory.delay //释放内存
                innerRequire.apply(null, args) //0,1,2 --> 1,2,0
            }

            if (name) {
                factory.delay(name, args)
            } else { //先进先出
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
        if (document.body) { //  在IE8 iframe中doScrollCheck可能不正确
            modules["ready!"].state = 2
            innerRequire.checkDeps()
            fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
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

    if (DOC.readyState === "complete") {
        fireReady() //如果在domReady之外加载
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
