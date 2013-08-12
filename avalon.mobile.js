//==================================================
// avalon 091 ，mobile
//==================================================
(function(DOC) {
    var Publish = {} //将函数曝光到此对象上，方便访问器收集依赖
    var expose = new Date - 0
    var subscribers = "$" + expose
    var otherRequire = window.require
    var otherDefine = window.define;
    //这两个都与计算属性息息相关
    var stopRepeatAssign = false
    var openComputedCollect = false
    var rword = /[^, ]+/g//切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
    var class2type = {}
    var oproto = Object.prototype;
    var ohasOwn = oproto.hasOwnProperty
    var prefix = "ms-"
    var root = DOC.documentElement
    var serialize = oproto.toString
    var aslice = [].slice
    var head = DOC.head //HEAD元素
    var documentFragment = DOC.createDocumentFragment()
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })
    var rwindow = /^[object (Window|DOMWindow|global)]$/

    function noop() {
    }

    function log(a) {
        window.console && console.log(a)
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
    avalon.type = getType;
    avalon.isWindow = function(obj) {
        return rwindow.test(serialize.call(obj))
    }

    //判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例

    avalon.isPlainObject = function(obj) {
        return obj && typeof obj === "object" && Object.getPrototypeOf(obj) === oproto
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
            i = 2
        }

        //确保接受方为一个复杂的数据类型
        if (typeof target !== "object" && getType(target) !== "function") {
            target = {}
        }

        //如果只有一个参数，那么新成员添加于mix所在的对象上
        if (length === i) {
            target = this
            --i
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
    var eventMap = {}

    function resetNumber(a, n, end) {//用于模拟slice, splice的效果
        if ((a === +a) && !(a % 1)) { //如果是整数
            if (a < 0) { //范围调整为 [-a, a]
                a = a * -1 >= n ? 0 : a + n
            } else {
                a = a > n ? n : a
            }
        } else {
            a = 0
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
        models: {},
        log: log,
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
        range: function(start, end, step) {// 用于生成整数数组
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
        slice: function(nodes, start, end) {
            return aslice.call(nodes, start, end)
        },
        bind: function(el, type, fn, phase) {
            function callback(ex) {
                var ret = fn.call(el, ex)
                if (ret === false) {
                    ex.preventDefault()
                    ex.stopPropagation()
                }
                return ret
            }
            el.addEventListener(eventMap[type] || type, callback, !!phase)
            return callback
        },
        unbind: function(el, type, fn, phase) {
            el.removeEventListener(eventMap[type] || type, fn || noop, !!phase)
        }
    })
    //视浏览器情况采用最快的异步回调
    var BrowserMutationObserver = window.MutationObserver || window.WebKitMutationObserver;
    if (BrowserMutationObserver) {
        avalon.nextTick = function(callback) {
            var input = DOC.createElement("input")
            var observer = new BrowserMutationObserver(function(mutations) {
                mutations.forEach(function() {
                    callback()
                })
            })
            observer.observe(input, {attributes: true})
            input.setAttribute("value", Math.random())
        }
    } else if (window.VBArray) {
        avalon.nextTick = function(callback) {
            var node = DOC.createElement("script")
            node.onreadystatechange = function() {
                callback()
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

    var VMODELS = avalon.vmodels = avalon.models = {}

//只让节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象通过
    function isArrayLike(obj) {
        if (obj && typeof obj === "object") {
            var n = obj.length, str = serialize.call(obj)
            if (/Array|NodeList|Arguments|CSSRuleList/.test(str)) {
                return true
            } else if (str === "[object Object]" && (+n === n && !(n % 1) && n >= 0)) {
                return true//由于ecma262v5能修改对象属性的enumerable，因此不能用propertyIsEnumerable来判定了
            }
        }
        return false
    }


    function generateID() {
        //生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
        return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    }

    function forEach(obj, fn) {
        if (obj) { //不能传个null, undefined进来
            var isArray = isArrayLike(obj),
                    i = 0
            if (isArray) {
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
    avalon.forEach = function(obj, fn) {
        log("此方法已过时,请使用avalon.each")
        forEach(obj, fn)
    }
    avalon.each = forEach
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
    var openTag, closeTag, rexpr, rexprg, rbind, rregexp = rregexp = /[-.*+?^${}()|[\]\/\\]/g

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
                window.define = innerRequire.define;
                window.require = innerRequire;
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
    kernel.compact = true
    kernel.alias = {}
    kernel.plugins['interpolate'](["{{", "}}"])
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
            return el.nodeType === 1 && el.classList.contains(cls)
        },
        addClass: function(cls) {
            var el = this[0]
            if (cls && typeof cls === "string" && el && el.nodeType === 1) {
                cls.replace(rword, function(c) {
                    el.classList.add(c)
                })
            }
            return this
        },
        removeClass: function(cls) {
            var node = this[0]
            if (cls && typeof cls > "o" && node && node.nodeType === 1 && node.className) {
                cls.replace(rword, function(c) {
                    node.classList.remove(c)
                })
            }
            return this
        },
        toggleClass: function(value, stateVal) {
            var state = stateVal,
                    className, i = 0
            var classNames = value.match(rnospaces) || []
            var isBool = typeof stateVal === "boolean"
            var node = this[0] || {}, classList
            if (classList = node.classList) {
                while ((className = classNames[i++])) {
                    state = isBool ? state : !classList.contains(className)
                    classList[state ? "add" : "remove"](className)
                }
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
            var node = this[0]
            if (node && node.style) { //注意string经过call之后，变成String伪对象，不能简单用typeof来检测
                var prop = /[_-]/.test(name) ? camelize(name) : name
                name = cssName(prop) || prop
                if (arguments.length === 1) { //获取样式
                    var fn = cssHooks[prop + ":get"] || cssHooks["@:get"]
                    return fn(node, name)
                } else { //设置样式
                    var type = typeof value
                    if (type === "number" && !isFinite(value + "")) {
                        return
                    }
                    if (isFinite(value) && !cssNumber[prop]) {
                        value += "px"
                    }
                    fn = cssHooks[prop + ":set"] || cssHooks["@:set"]
                    fn(node, name, value)
                    return this
                }
            }
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
    if (root.dataset) {
        avalon.data = function(name, val) {
            var dataset = this[0].dataset;
            switch (arguments.length) {
                case 2:
                    dataset[name] = val
                    return this
                case 1:
                    val = dataset[name]
                    return parseData(val)
                case 0:
                    var ret = {}
                    for (var name in dataset) {
                        ret[name] = parseData(dataset[name])
                    }
                    return ret
            }
        }
    }

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
    "scrollLeft_pageXOffset,scrollTop_pageYOffset".replace(/(\w+)_(\w+)/g, function(_, method, prop) {
        avalon.fn[method] = function(val) {
            var node = this[0] || {}, win = getWindow(node), top = method === "scrollTop";
            if (!arguments.length) {
                return win ? win[prop] : node[method];
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
        return node.window && node.document ? node : node.nodeType === 9 ? node.defaultView : false;
    }
    //=============================css相关==================================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
    var cssMap = {
        "float": 'cssFloat',
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
        node.style[name] = value
    }

    cssHooks["@:get"] = function(node, name) {
        var ret, styles = window.getComputedStyle(node, null)
        if (styles) {
            ret = styles.getPropertyValue(name)
            if (ret === "") {
                ret = node.style[name] //其他浏览器需要我们手动取内联样式
            }
        }
        return ret
    }
    cssHooks["opacity:get"] = function(node) {
        var ret = cssHooks["@:get"](node, "opacity")
        return ret === "" ? "1" : ret;
    }
    "Width,Height".replace(rword, function(name) {
        var method = name.toLowerCase(),
                clientProp = "client" + name,
                scrollProp = "scroll" + name,
                offsetProp = "offset" + name
        avalon.fn[method] = function(value) {
            var node = this[0]
            if (arguments.length === 0) {
                if (node.setTimeout) { //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
                    //https://developer.mozilla.org/en-US/docs/Web/API/window.innerHeight
                    return node["inner" + name]
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
        var node = this[0]
        var doc = node && node.ownerDocument
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
            //IE9-10 如果不指定value，它会自造一个value，在node.text两边加空白返回给你
            return node.hasAttribute("value") ? node.value : node.text;
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
     *                          Array helper                            *
     **********************************************************************/
    avalon.Array = {
        sortBy: function(target, fn, scope, trend) {
            //根据指定条件进行排序，通常用于对象数组。
            //默认是按递增来排
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
            //取得对象数组的每个元素的指定属性，组成数组返回。
            return target.filter(function(item) {
                return item[name] !== void 0
            })
        },
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
     *                                parseHTML                                 *
     ****************************************************************************/
    var rtagName = /<([\w:]+)/,
            //取得其tagName
            rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig,
            scriptTypes = oneObject("text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript", "text/vbscript"),
            //需要处理套嵌关系的标签
            rnest = /<(?:tb|td|tf|th|tr|col|opt|leg|cap|area)/
    //parseHTML的辅助变量
    var tagHooks = new function() {
        var object = {
            option: DOC.createElement("select"),
            thead: DOC.createElement("table"),
            td: DOC.createElement("tr"),
            area: DOC.createElement("map"),
            tr: DOC.createElement("tbody"),
            col: DOC.createElement("colgroup"),
            legend: DOC.createElement("fieldset"),
            "*": DOC.createElement("div")
        }
        object.optgroup = object.option;
        object.tbody = object.tfoot = object.colgroup = object.caption = object.thead;
        object.th = object.td;
        return object
    }

    avalon.clearChild = function(node) {
        while (node.firstChild) {
            node.removeChild(node.firstChild)
        }
        return node
    }
    avalon.parseHTML = function(html) {
        html = html.replace(rxhtml, "<$1></$2>").trim()
        var fragment = documentFragment.cloneNode(false)
        var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase()
        if (!(tag in tagHooks)) {
            tag = "*";
        }
        var parent = tagHooks[tag];
        parent.innerHTML = html;
        var els = parent.getElementsByTagName("script"),
                firstChild
        if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
            var script = DOC.createElement("script"),
                    neo;
            for (var i = 0, el; el = els[i++]; ) {
                if (!el.type || scriptTypes[el.type]) { //如果script节点的MIME能让其执行脚本
                    neo = script.cloneNode(false) //FF不能省略参数
                    for (var j = 0, attr; attr = el.attributes[j++]; ) {
                        neo[attr.name] = attr.value;//复制其属性
                    }
                    neo.text = el.text; //必须指定,因为无法在attributes中遍历出来
                    el.parentNode.replaceChild(neo, el) //替换节点
                }
            }
        }
        while (firstChild = parent.firstChild) { // 将wrapper上的节点转移到文档碎片上！
            fragment.appendChild(firstChild)
        }
        return fragment;
    }
    avalon.innerHTML = function(node, html) {
        if (rnest.test(html)) {
            var a = this.parseHTML(html)
            this.clearChild(node).appendChild(a)
        } else {
            node.innerHTML = html;
        }
    }
    /*********************************************************************
     *                           Define                                 *
     **********************************************************************/

    avalon.define = function(name, factory) {
        var args = avalon.slice(arguments)
        if (typeof name !== "string") {
            name = generateID()
            args.unshift(name)
        }
        if (Array.isArray(args[1])) { //向前兼容
            args.splice(1, 1)
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
            var callbacks = this.$events[type]
            if (callbacks) {
                callbacks.push(callback)
            } else {
                this.$events[type] = [callback]
            }
            return this
        },
        $unwatch: function(type, callback) {
            var n = arguments.length
            if (n === 0) {
                this.$events = {}
            } else if (n === 1) {
                this.$events[type] = []
            } else {
                var callbacks = this.$events[type] || []
                var i = callbacks.length
                while (--i > -1) {
                    if (callbacks[i] === callback) {
                        return callbacks.splice(i, 1)
                    }
                }
            }
            return this
        },
        $fire: function(type) {
            var callbacks = this.$events[type] || [] //防止影响原数组
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

    function updateViewModel(a, b, isArray) {
        if (isArray) {
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
        } else {
            for (var i in b) {
                if (b.hasOwnProperty(i) && a.hasOwnProperty(i) && i !== "$id") {
                    a[i] = b[i]
                }
            }
        }
    }

    var unwatchOne = oneObject("$id,$skipArray,$watch,$unwatch,$fire,$events,$json,$model")

    function modelFactory(scope, model, watchMore) {
        if (Array.isArray(scope)) {
            var collection = Collection(scope)
            collection._add(scope)
            return collection
        }
        var skipArray = scope.$skipArray, //要忽略监控的属性名列表
                vmodel = {},
                Descriptions = {}, //内部用于转换的对象
                callSetters = [],
                callGetters = [],
                VBPublics = Object.keys(unwatchOne) //用于IE6-8
        model = model || {}
        watchMore = watchMore || {}
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
                    accessor = function(neo) {//创建计算属性，因变量，基本上由其他监控属性触发其改变
                        var value = accessor.value
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //阻止重复赋值
                            }
                            var antiquity = value
                            if (typeof setter === "function") {
                                var backup = vmodel.$events[name]
                                vmodel.$events[name] = []//清空回调，防止内部冒泡而触发多次$fire
                                setter.call(vmodel, neo)
                                vmodel.$events[name] = backup
                            }
                            if (oldArgs !== neo) {  //只检测用户的传参是否与上次是否一致
                                oldArgs = neo
                                value = accessor.value = model[name] = getter.call(vmodel)
                                notifySubscribers(accessor) //通知顶层改变
                                vmodel.$fire && vmodel.$fire(name, value, antiquity)
                            }
                        } else {
                            if (openComputedCollect) {
                                collectSubscribers(accessor)
                            }
                            neo = accessor.value = model[name] = getter.call(vmodel)
                            if (value !== neo) {
                                vmodel.$fire && vmodel.$fire(name, neo, value)
                            }
                            return neo
                        }
                    }
                    callGetters.push(accessor)
                } else {
                    accessor = function(neo) {  //创建监控属性或数组，自变量，由用户触发其改变
                        var value = accessor.value
                        if (arguments.length) {
                            if (stopRepeatAssign) {
                                return //阻止重复赋值
                            }
                            if (value !== neo) {
                                var old = value
                                if (valueType === "array" || valueType === "object") {
                                    if (value && value.$id) {//如果已经转换过
                                        updateViewModel(value, neo, Array.isArray(neo))
                                    } else if (Array.isArray(neo)) {//如果是第一次转换数组
                                        value = Collection(neo)
                                        value._add(neo)
                                    } else {//如果是第一次转换对象
                                        value = modelFactory(neo, neo)
                                    }
                                } else {//如果是其他数据类型
                                    value = neo
                                }
                                accessor.value = value
                                model[name] = value && value.$id ? value.$model : value//更新$model中的值
                                notifySubscribers(accessor) //通知顶层改变
                                vmodel.$fire && vmodel.$fire(name, value, old)
                            }
                        } else {
                            collectSubscribers(accessor) //收集视图函数
                            return value
                        }
                    }
                    callSetters.push(name)
                }
                accessor[subscribers] = []
                Descriptions[name] = {
                    set: accessor,
                    get: accessor,
                    enumerable: true
                }
            }
        }
        for (var i in scope) {
            loop(i, scope[i])
        }


        vmodel = Object.defineProperties(vmodel, Descriptions)//生成一个空的ViewModel
        VBPublics.forEach(function(name) {//先为函数等不被监控的属性赋值
            if (!unwatchOne[name]) {
                vmodel[name] = scope[name]
            }
        })
        callSetters.forEach(function(prop) {//再为监控属性赋值
            vmodel[prop] = scope[prop]
        })
        callGetters.forEach(function(fn) {//最后强逼计算属性 计算自己的值
            Publish[expose] = fn
            fn()
            collectSubscribers(fn)
            delete Publish[expose]
        })
        vmodel.$model = model
        if (kernel.compact) {
            vmodel.$json = model
        }
        vmodel.$events = {} //VB对象的方法里的this并不指向自身，需要使用bind处理一下
        vmodel.$id = generateID()
        for (var i in Observable) {
            vmodel[i] = Observable[i]
        }
        vmodel.hasOwnProperty = function(name) {
            return name in vmodel.$model
        }
        return vmodel
    }

    function collectSubscribers(accessor) { //收集依赖于这个访问器的订阅者
        if (Publish[expose]) {
            var list = accessor[subscribers]
            list && avalon.Array.ensure(list, Publish[expose]) //只有数组不存在此元素才push进去
        }
    }

    function notifySubscribers(accessor, el) { //通知依赖于这个访问器的订阅者更新自身
        var list = accessor[subscribers]
        if (list && list.length) {
            var args = aslice.call(arguments, 1)
            var safelist = list.concat()
            for (var i = 0, fn; fn = safelist[i++]; ) {
                el = fn.element
                if (el && (!el.noRemove) && el.parentNode === null) {
                    avalon.Array.remove(list, fn)
                    log(fn + "")
                } else {
                    fn.apply(0, args) //强制重新计算自身
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

    var stopScan = oneObject("area,base,basefont,br,col,hr,img,input,link,meta,param,embed,wbr,script,style,textarea")

    function scanNodes(parent, vmodels, callback) {
        var nodes = aslice.call(parent.childNodes)
        callback && callback()
        for (var i = 0, node; node = nodes[i++]; ) {
            if (node.nodeType === 1) {
                scanTag(node, vmodels) //扫描元素节点
            } else if (node.nodeType === 3) {
                scanText(node, vmodels) //扫描文本节点
            }
        }
    }

    function scanTag(elem, vmodels) {
        vmodels = vmodels || []
        var a = elem.getAttribute(prefix + "skip")
        var b = elem.getAttribute(prefix + "important")
        var c = elem.getAttribute(prefix + "controller")

        //这三个绑定优先处理，其中a > b > c
        if (typeof a === "string") {
            return
        } else if (b) {
            if (!VMODELS[b]) {
                return
            } else {
                vmodels = [VMODELS[b]]
                elem.removeAttribute(prefix + "important")
            }
        } else if (c) {
            var newVmodel = VMODELS[c]
            if (!newVmodel) {
                return
            }
            vmodels = [newVmodel].concat(vmodels)
            elem.removeAttribute(prefix + "controller")
        }
        scanAttr(elem, vmodels) //扫描特性节点
        if (!stopScan[elem.tagName.toLowerCase()] && rbind.test(elem.innerHTML)) {
            scanNodes(elem, vmodels)
        }
    }

    function scanText(textNode, vmodels) {
        var bindings = extractTextBindings(textNode)
        if (bindings.length) {
            executeBindings(bindings, vmodels)
        }
    }

    var rfilters = /[^|]\|\s*(\w+)\s*(\([^)]*\))?/g

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
                            return c.charAt(0)
                        })
                    }
                    tokens.push({
                        value: value,
                        expr: true,
                        filters: leach.length ? leach : void 0
                    })
                }
                start = stop + closeTag.length;
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

    function scanAttr(el, vmodels) {
        var bindings = []
        for (var i = 0, attr; attr = el.attributes[i++]; ) {
            if (attr.specified) {
                if (attr.name.indexOf(prefix) !== -1) {
                    //如果是以指定前缀命名的
                    var array = attr.name.split("-")
                    var type = array[1]
                    var args = array.slice(2)
                    if (typeof bindingHandlers[type] === "function") {
                        bindings.push({
                            type: type,
                            args: args || [],
                            element: el,
                            remove: true,
                            node: attr,
                            value: attr.nodeValue
                        })
                    }
                }
            }
        }
        executeBindings(bindings, vmodels)
    }

    function executeBindings(bindings, vmodels) {
        bindings.forEach(function(data) {
            var flag = bindingHandlers[data.type](data, vmodels)
            if (flag !== false && data.remove) { //移除数据绑定，防止被二次解析
                data.element.removeAttribute(data.node.name)
            }
        })
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
                        args: [],
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

            + ',undefined';
    var rrexpstr = /\/\*(?:.|\n)*?\*\/|\/\/[^\n]*\n|\/\/[^\n]*$|'[^']*'|"[^"]*"|[\s\t\n]*\.[\s\t\n]*[$\w\.]+/g;
    var rsplit = /[^\w$]+/g;
    var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
    var rnumber = /\b\d[^,]*/g;
    var rcomma = /^,+|,+$/g;
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
        var length = arr.length;
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

    function parseExpr(code, scopes, data, getset) {
        if (getset) {
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
                code = "\nreturn " + code + ";"//IE全家 Function("return ")出错，需要Function("return ;")
            }
            fn = Function.apply(Function, names.concat("'use strict';\n" + prefix + code))
        }
        try {
            fn.apply(fn, args)
            return [fn, args]
        } catch (e) {
            data.remove = false
        } finally {
            textBuffer = names = null //释放内存
        }
    }

    function watchView(text, scopes, data, callback, tokens) {
        var array, updateView = avalon.noop
        if (!tokens) {
            array = parseExpr(text.trim(), scopes, data)
            if (array) {
                var fn = array[0],
                        args = array[1]
                updateView = function() {
                    callback(fn.apply(fn, args), data.element)
                }
            }
        } else {
            array = tokens.map(function(token) {
                return token.expr ? parseExpr(token.value.trim(), scopes, data) || "" : token.value
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

        updateView.toString = function() {
            return data.type + " binding to eval(" + text + ")"
        } //方便调试
        //这里非常重要,我们通过判定视图刷新函数的element是否在DOM树决定
        //将它移出订阅者列表
        updateView.element = data.element
        Publish[expose] = updateView //暴光此函数,方便collectSubscribers收集
        openComputedCollect = true
        updateView()
        openComputedCollect = false
        delete Publish[expose]
    }
    /*********************************************************************
     *                            Bind                                    *
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

            val = window.getComputedStyle(node, null).display

            root.removeChild(node)
            cacheDisplay[nodeName] = val
        }
        return cacheDisplay[nodeName]
    }
    var supportDisplay = (function(td) {
        return window.getComputedStyle ?
                window.getComputedStyle(td, null).display == "table-cell" : true
    })(DOC.createElement("td"))

    var bindingHandlers = avalon.bindingHandlers = {
        "if": function(data, vmodels) {
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
                watchView(data.value, vmodels, data, function(val) {
                    if (val) { //添加 如果它不在DOM树中
                        if (!root.contains(elem)) {
                            parent.replaceChild(elem, placehoder)
                            elem.noRemove = 0
                        }
                    } else { //移除  如果它还在DOM树中
                        if (root.contains(elem)) {
                            parent.replaceChild(placehoder, elem)
                            elem.noRemove = 1
                        }
                    }
                })
            }
        },
        // ms-attr-class="xxx" vm.xxx="aaa bbb ccc"将元素的className设置为aaa bbb ccc
        // ms-attr-class="xxx" vm.xxx=false  清空元素的所有类名
        // ms-attr-name="yyy"  vm.yyy="ooo" 为元素设置name属性
        "attr": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
                var attrName = data.args.join("-")
                var toRemove = (val === false) || (val === null) || (val === void 0)
                if (toRemove) {
                    elem.removeAttribute(attrName)
                } else {
                    elem.setAttribute(attrName, val)
                }
            })
        },
        "on": function(data, vmodels) {
            var callback, type = data.args[0],
                    elem = data.element
            watchView(data.value, vmodels, data, function(fn) {
                callback = fn
            })
            if (!elem.$vmodels) {
                elem.$vmodel = elem.$scope = vmodels[0]
                elem.$vmodels = vmodels
            }
            if (type && typeof callback === "function") {
                avalon.bind(elem, type, callback)
            }
        },
        "data": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
                var key = "data-" + data.args.join("-")
                elem.setAttribute(key, val)
            })
        },
        //抽取innerText中插入表达式，置换成真实数据放在它原来的位置
        //<div>{{firstName}} + java</div>，如果model.firstName为ruby， 那么变成
        //<div>ruby + java</div>
        "text": function(data, vmodels) {
            var node = data.node
            watchView(data.value, vmodels, data, function(val, elem) {
                if (node.nodeType === 2) {//如果是特性节点，说明在元素节点上使用了ms-text
                    elem.textContent = val
                } else {
                    node.nodeValue = val
                }
            })
        },
        //控制元素显示或隐藏
        "visible": function(data, vmodels) {
            var elem = data.element
            if (!supportDisplay && !root.contains(elem)) {//fuck firfox 全家！
                var display = parseDisplay(elem.tagName)
            }
            display = display || avalon(elem).css("display")
            display = display === "none" ? parseDisplay(elem.tagName) : display
            watchView(data.value, vmodels, data, function(val) {
                elem.style.display = val ? display : "none"
            })
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href, include, css添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        "href": function(data, vmodels) {
            var text = data.value.trim(), simple = true, method = data.type
            if (text.indexOf(openTag) > -1 && text.indexOf(closeTag) > 2) {
                simple = false
                if (rexpr.test(text) && RegExp.rightContext === "") {
                    simple = true
                    text = RegExp.$1
                }
            }
            watchView(text, vmodels, data, function(val, elem) {
                if (method === "css") {
                    avalon(elem).css(data.args.join("-"), val)
                } else if (method === "include" && val) {
                    if (data.args + "" === "src") {
                        var ajax = new (window.XMLHttpRequest || ActiveXObject)("Microsoft.XMLHTTP")
                        ajax.onreadystatechange = function() {
                            if (ajax.readyState === 4) {
                                var s = ajax.status
                                if (s >= 200 && s < 300 || s === 304 || s === 1223) {
                                    avalon.innerHTML(elem, ajax.responseText)
                                    avalon.scan(elem, vmodels)
                                }
                            }
                        }
                        ajax.open("GET", val, true)
                        ajax.send(null)
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
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔，因此需要用ng-disabled
        "disabled": function(data, vmodels) {
            var name = data.type,
                    propName = name === "readonly" ? "readOnly" : name
            watchView(data.value, vmodels, data, function(val, elem) {
                elem[propName] = !!val
            })
        },
        //ms-bind="name:callback",绑定一个属性，当属性变化时执行对应的回调，this为绑定元素
        "bind": function(data, vmodels) {
            var array = data.value.match(/([$\w]+)\s*\:\s*([$\w]+)/), ret = false
            if (array && array[1] && array[2]) {
                var fn = array[2]
                for (var i = 0, scope; scope = vmodels[i++]; ) {
                    if (scope.hasOwnProperty(fn)) {
                        fn = scope[fn]
                        break
                    }
                }
                if (typeof fn === "function") {
                    fn.call(data.element)
                    scope.$watch(data.args[0], function(neo, old) {
                        fn.call(data.element, neo, old)
                    })
                    ret = true
                }
            }
            return ret
        },
        "html": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
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
        "ui": function(data, vmodels, opts) {
            var uiName = data.value.trim() //取得UI控制的名称
            var elem = data.element //取得被绑定元素
            var id = (elem.getAttribute("data-id") || "").trim()
            if (!id) { //取得此控件的VM的ID
                id = uiName + setTimeout("1") //没有就随机生成一个
                elem.setAttribute("data-id", id)
            }
            elem[id + "vmodels"] = vmodels //将它临时保存起来
            if (typeof avalon.ui[uiName] === "function") {
                var optsName = data.args.join("-")
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
                return false;
            }
        }
    }
    //============================================================================
    //根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
    //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
    "class,hover,active".replace(rword, function(method) {
        bindingHandlers[method] = function(data, vmodels) {
            var oldStyle = data.args.join("-")
            var elem = data.element
            if (!oldStyle || isFinite(oldStyle)) {
                var text = data.value, toggle
                var noExpr = text.replace(rexprg, function(a) {
                    return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
                })
                var colonIndex = noExpr.indexOf(":")//取得第一个冒号的位置
                if (colonIndex === -1) {// 比如 ms-class="aaa bbb ccc" 的情况
                    var className = text, rightExpr
                } else {// 比如 ms-class-1="ui-state-active:checked" 的情况 
                    className = text.slice(0, colonIndex)
                    rightExpr = text.slice(colonIndex + 1)
                    var array = parseExpr(rightExpr, vmodels, {})
                    var callback = array[0], args = array[1]
                    if (!Array.isArray(array)) {
                        log("'" + (rightExpr || "").trim() + "' 不存在于VM中")
                        return false
                    }
                }
                var hasExpr = rexpr.test(className)//比如ms-class="width{{w}}"的情况

                watchView("", vmodels, data, function(cls) {
                    toggle = callback ? !!callback.apply(elem, args) : true
                    className = hasExpr ? cls : className
                    if (method === "class") {
                        avalon(elem).toggleClass(className, toggle)
                    }
                }, (hasExpr ? scanExpr(className) : null))

                if (method === "hover" || method === "active") {
                    if (method === "hover") {//在移出移入时切换类名
                        var event1 = "mouseenter"
                        var event2 = "mouseleave"
                    } else {//在聚焦失焦中切换类名
                        elem.tabIndex = elem.tabIndex || -1
                        event1 = "mousedown", event2 = "mouseup"
                    }
                    var $elem = avalon(data.element)
                    $elem.bind(event1, function() {
                        toggle && $elem.addClass(className)
                    })
                    $elem.bind(event2, function() {
                        toggle && $elem.removeClass(className)
                    })
                }

            } else if (method === "class") {
                watchView(data.value, vmodels, data, function(val, elem) {
                    avalon(elem).toggleClass(oldStyle, !!val)
                })
            }
        }
    })
    //=========================boolean preperty binding ====================
    //与disabled绑定器 用法差不多的其他布尔属性的绑定器
    "checked,readonly,selected".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled
    })
    bindingHandlers.enabled = function(data, vmodels) {
        watchView(data.value, vmodels, data, function(val, elem) {
            elem.disabled = !val
        })
    }

    //=========================string preperty binding ====================
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title,alt,src,value,css,include".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href
    })
    //========================= model binding ====================
    //将模型中的字段与input, textarea的value值关联在一起
    var modelBinding = bindingHandlers.duplex = bindingHandlers.model = function(data, vmodels) {
        var element = data.element,
                tagName = element.tagName
        if (data.type === "model") {
            log("ms-model已经被废弃，请使用ms-duplex")
        }
        if (typeof modelBinding[tagName] === "function") {
            var array = parseExpr(data.value, vmodels, data, true)
            if (array) {
                modelBinding[tagName](element, array[0], vmodels[0])
            }
        }
    }
    //如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
    //字段变，value就变；value变，字段也跟着变。默认是绑定input事件，
    modelBinding.INPUT = function(element, fn, scope) {
        if (element.name === void 0) {
            element.name = generateID()
        }
        var type = element.type,
                god = avalon(element)
        //当value变化时改变model的值
        var updateModel = function() {
            if (god.data("observe") !== false) {
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
                element.addEventListener(event, updateModel, false)
            } else {
                element.addEventListener("input", updateModel, false)

                if (DOC.documentMode >= 9) { //IE9 10
                    element.attachEvent("onkeydown", function(e) {
                        var key = e.keyCode
                        if (key === 8 || key === 46) {
                            updateModel() //处理回退与删除
                        }
                    })
                    element.attachEvent("oncut", updateModel) //处理粘贴
                }
            }
        } else if (type === "radio") {
            updateView = function() {
                element.checked = !!fn(scope)
            }
            updateModel = function() {
                if (god.data("observe") !== false) {
                    var val = !element.beforeChecked
                    fn(scope, val)
                    element.beforeChecked = element.checked = val
                }
            }

            function beforeChecked() {
                element.beforeChecked = element.checked
            }
            if (element.onbeforeactivate === null) {
                god.bind("beforeactivate", beforeChecked)
            } else {
                god.bind("mouseover", beforeChecked)
            }
            god.bind("click", updateModel)
        } else if (type === "checkbox") {
            updateModel = function() {
                if (god.data("observe") !== false) {
                    var method = element.checked ? "ensure" : "remove"
                    avalon.Array[method](fn(scope), element.value)
                }
            }
            updateView = function() {
                var array = [].concat(fn(scope)) //强制转换为数组
                element.checked = array.indexOf(element.value) >= 0
            }
            god.bind("click", updateModel) //IE6-8
        }
        Publish[expose] = updateView
        updateView.element = element
        updateView()
        delete Publish[expose]
    }
    modelBinding.SELECT = function(element, fn, scope, oldValue) {
        var god = avalon(element)

        function updateModel() {
            if (god.data("observe") !== false) {
                var neo = god.val()
                if (neo + "" !== oldValue) {
                    fn(scope, neo)
                    oldValue = neo + ""
                }
            }
        }

        function updateView() {
            var neo = fn(scope)
            if (neo + "" !== oldValue) {
                god.val(neo)
                oldValue = neo + ""
            }
        }
        god.bind("change", updateModel)
        avalon.nextTick(function() {
            Publish[expose] = updateView
            updateView.element = element
            updateView()
            delete Publish[expose]
        })
    }
    modelBinding.TEXTAREA = modelBinding.INPUT
    //========================= event binding ====================
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
    "dblclick,mouseout,click,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,keypress,keydown,keyup,blur,focus,change,animationend".
            replace(rword, function(name) {
        bindingHandlers[name] = function(data) {
            data.args = [name]
            bindingHandlers.on.apply(0, arguments)
        }
    })
    if (!("onmouseenter" in root)) { //chrome 30  终于支持mouseenter
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
        if (type === "array" || type === "object") {
            val = val.$id ? val : modelFactory(val, val)
        }
        return val
    }

    var isEqual = Object.is || function(x, y) { //只要用于处理NaN 与 NaN 比较, chrome19+, firefox22
        if (x === y) {
            return x !== 0 || 1 / x === 1 / y;
        }
        return x !== x && y !== y;
    }
    //To obtain the corresponding index of the VM

    function getVMIndex(a, bbb, start) {
        for (var i = start, n = bbb.length; i < n; i++) {
            var b = bbb[i];
            var check = b && b.v ? b.v : b
            if (isEqual(a, check)) {
                return i
            }
        }
    }

    function Collection(model) {
        var array = []
        array.$id = generateID()
        array[subscribers] = []
        array.$model = array.$json = model
        array.$events = {} //VB对象的方法里的this并不指向自身，需要使用bind处理一下
        array.isCollection = true;
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
            notifySubscribers(this, "add", pos, added)
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
            return ret;
        }
        array.push = function() {
            model.push.apply(model, arguments)
            return this._add(arguments) //返回长度
        }
        array.unshift = function() {
            model.unshift.apply(model, arguments)
            var ret = this._add(arguments, 0) //返回长度
            notifySubscribers(this, "index", arguments.length)
            return ret;
        }
        array.shift = function() {
            model.shift()
            var el = this._del(0, 1)
            notifySubscribers(this, "index")
            return el[0] //返回被移除的元素
        }
        array.pop = function() {
            var el = model.pop()
            this._del(this.length - 1, 1)
            return el[0] //返回被移除的元素
        }
        array.splice = function(a, b) {
            // 必须存在第一个参数，需要大于-1, 为添加或删除元素的基点
            a = resetNumber(a, this.length)
            var removed = model.splice.apply(model, arguments),
                    ret = []
            this.stopFireLength = true; //确保在这个方法中 , $watch("length",fn)只触发一次
            if (removed.length) {
                ret = this._del(a, removed.length)
                if (arguments.length <= 2) { //如果没有执行添加操作，需要手动resetIndex
                    notifySubscribers(this, "index")
                }
            }
            if (arguments.length > 2) {
                this._add(aslice.call(arguments, 2), a)
            }
            this.stopFireLength = false;
            dynamic.length = this.length
            return ret //返回被移除的元素
        }
        "sort,reverse".replace(rword, function(method) {
            array[method] = function() {
                model[method].apply(model, arguments)
                var sorted = false;
                for (var i = 0, n = this.length; i < n; i++) {
                    var a = model[i];
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
                    notifySubscribers(this, "index")
                }
                return this
            }
        })
        array.contains = function(el) { //判定是否包含
            return this.indexOf(el) !== -1
        }
        array.size = function() { //取得数组长度，这个函数可以同步视图，length不能
            return dynamic.length
        }
        array.remove = function(el) { //移除第一个等于给定值的元素
            var index = this.indexOf(el)
            if (index >= 0) {
                return this.removeAt(index)
            }
        }
        array.removeAt = function(index) { //移除指定索引上的元素
            this.splice(index, 1) //DOM操作非常重,因此只有非负整数才删除
        }
        array.clear = function() {
            this.length = dynamic.length = 0 //清空数组
            notifySubscribers(this, "clear")
            return this
        }
        array.removeAll = function(all) { //移除N个元素
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
            if (!this.contains(el)) { //只有不存在才push
                this.push(el)
            }
            return this
        }
        array.set = function(index, val) {
            if (index >= 0 && index < this.length) {
                if (/array|object/.test(getType(val))) {
                    if (val.$model) {
                        val = val.$model
                    }
                    updateViewModel(this[index], val, Array.isArray(val))
                } else if (this[index] !== val) {
                    this[index] = val
                    notifySubscribers(this, "set", index, val)
                }
            }
            return this
        }
        return array;
    }
    //========================= each binding ====================
    bindingHandlers["each"] = function(data, vmodels) {
        var parent = data.element
        var array = parseExpr(data.value, vmodels, data)

        var list
        if (typeof array == "object") {
            list = array[0].apply(array[0], array[1])
        }

        if (typeof list !== "object") {
            return list
        }
        var view = documentFragment.cloneNode(false)
        while (parent.firstChild) {
            view.appendChild(parent.firstChild)
        }
        data.vTemplate = view
        data.scopes = vmodels

        function updateListView(method, pos, el) {
            var tmodels = updateListView.tmodels
            switch (method) {
                case "add":
                    pos = ~~pos
                    var vTransation = documentFragment.cloneNode(false),
                            arr = el
                    for (var i = 0, n = arr.length; i < n; i++) {
                        var ii = i + pos;
                        var tmodel = createEachModel(ii, arr[i], list, data.args)
                        var tview = data.vTemplate.cloneNode(true)
                        tmodel.$view = tview
                        tmodels.splice(ii, 0, tmodel)
                        var base = typeof arr[i] === "object" ? [tmodel, arr[i]] : [tmodel]
                        scanNodes(tview, base.concat(vmodels))
                        if (typeof data.group !== "number") {
                            data.group = ~~tview.childNodes.length //记录每个模板一共有多少子节点
                        }
                        vTransation.appendChild(tview)
                    }
                    //得到插入位置 IE6-10要求insertBefore的第2个参数为节点或null，不能为undefined
                    var insertNode = parent.childNodes[data.group * pos] || null
                    parent.insertBefore(vTransation, insertNode)
                    break
                case "del":
                    pos = ~~pos
                    var t = tmodels.splice(pos, el) //移除对应的子VM
                    var vRemove = t[0].$view
                    removeView(vRemove, parent, data.group, pos, el)
                    break
                case "index":
                    pos = ~~pos
                    for (; el = tmodels[pos]; pos++) {
                        el.$index = pos
                    }
                    break;
                case "clear":
                    tmodels.length = 0
                    avalon.clearChild(parent)
                    break
                case "move":
                    var t = tmodels.splice(pos, 1)
                    if (t) {
                        tmodels.splice(el, 0, t[0])
                        var vRemove = t[0].$view
                        var group = data.group
                        removeView(vRemove, parent, group, pos, 1)
                        var node = parent.childNodes[group * el]
                        parent.insertBefore(vRemove, node)
                    }
                    break
                case "set":
                    var model = tmodels[pos]
                    if (model) {
                        var n = model.$itemName
                        model[n] = el
                    }
                    break
            }
        }
        updateListView.tmodels = [] //循环绑定的视图刷新函数维护一个临时生成的VM集合
        if ((list || {}).isCollection) {
            list[subscribers].push(updateListView)
        }
        if (Array.isArray(list)) {
            updateListView("add", 0, list)
        } else {
            var vTransation = documentFragment.cloneNode(false), mapper = {}
            function loop(key, val) {
                var tmodel = createWithModel(key, val)
                mapper[key] = tmodel
                list.$watch(key, function(neo) {
                    mapper[key].$val = neo
                })
                var tview = data.vTemplate.cloneNode(true)
                scanNodes(tview, [tmodel, val].concat(vmodels))
                vTransation.appendChild(tview)
            }
            for (var key in list) {
                if (list.hasOwnProperty(key) && key !== "hasOwnProperty") {
                    loop(key, list[key])
                }
            }
            parent.appendChild(vTransation)
        }
    }

    function removeView(vRemove, parent, group, pos, n) {
        var nodes = parent.childNodes
        var node = nodes[group * pos] //第一个要移除的子节点
        var removeNodes = [node]
        for (var i = 1; i < group * n; i++) {
            node = node.nextSibling
            removeNodes.push(node)
        }
        for (var i = 0, node; node = removeNodes[i++]; ) {
            vRemove.appendChild(node) //通常添加到文档碎片实现移除
        }
        return vRemove;
    }

    //为子视图创建一个ViewModel
    function createWithModel(key, val) {
        return modelFactory({
            $key: key,
            $val: val
        }, 0, {
            $val: 1
        })
    }
    var watchEachOne = oneObject("$index,$remove,$first,$last")
    function createEachModel(index, item, list, args) {
        var itemName = args[0] || "$data"
        var source = {}
        source.$index = index
        source.$view = {}
        source.$itemName = itemName
        source[itemName] = {
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
            return list.remove(item)
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
                timeSetter.call(date, toInt(match[4] || 0) - tzHour, toInt(match[5] || 0) - tzMin, toInt(match[6] || 0), toInt(match[7] || 0))
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
     *                      AMD Loader                                   *
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


        function checkFail(node, onError) {
            var id = cleanUrl(node.src) //检测是否死链
            node.onload = node.onerror = null
            if (onError || !modules[id].state) {
                setTimeout(function() {
                    head.removeChild(node)
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
            plugin = plugins[plugin] || noop;
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
                    ret += ext;
                }
            }
            //6. 缓存处理
            if (kernel.nocache) {
                ret += (ret.indexOf("?") === -1 ? "?" : "&") + Date.now()
            }
            return plugin(ret, shim)
        }

        function loadJS(url, id, callback) {
            //通过script节点加载目标模块
            var node = DOC.createElement("script")
            node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
            node.onload = function() {
                var factory = factorys.pop()
                factory && factory.delay(id)
                if (callback) {
                    callback()
                }
                log("已成功加载 " + url)
            }

            node.onerror = function() {
                checkFail(node, true)
            }
            node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
            head.appendChild(node) //chrome下第二个参数不能为null
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
            var args = avalon.slice(arguments)

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
     *                    DOMReady                                         *
     **********************************************************************/

    function fireReady() {
        modules["ready!"].state = 2
        innerRequire.checkDeps()
        fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
    }

    if (DOC.readyState === "complete") {
        fireReady() //如果在domReady之外加载
    } else {
        DOC.addEventListener("DOMContentLoaded", function() {
            fireReady()
        })
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
//2012 6 15
//fix 管道符与短路与相混淆的BUG， 重构on绑定
//elementTransitions.js ， 各种封装好的页面转换特效。http://dan-silver.github.io/ElementTransitions.js/