/*==================================================
 Copyright (c) 2013-2015 司徒正美 and other contributors
 http://www.cnblogs.com/rubylouvre/
 https://github.com/RubyLouvre
 http://weibo.com/jslouvre/
 
 Released under the MIT license
 avalon.modern.js 1.6 built in 2015.12.18
 support IE10+ and other browsers
 ==================================================*/
(function(global, factory) {

    if (typeof module === "object" && typeof module.exports === "object") {
        // For CommonJS and CommonJS-like environments where a proper `window`
        // is present, execute the factory and get avalon.
        // For environments that do not have a `window` with a `document`
        // (such as Node.js), expose a factory as module.exports.
        // This accentuates the need for the creation of a real `window`.
        // e.g. var avalon = require("avalon")(window);
        module.exports = global.document ? factory(global, true) : function(w) {
            if (!w.document) {
                throw new Error("Avalon requires a window with a document")
            }
            return factory(w)
        }
    } else {
        factory(global)
    }

// Pass this if window is not defined yet
}(typeof window !== "undefined" ? window : this, function(window, noGlobal){

/*********************************************************************
 *                    全局变量及方法                                   *
 **********************************************************************/

var expose = Date.now()
//http://stackoverflow.com/questions/7290086/javascript-use-strict-and-nicks-find-global-function
var DOC = window.document
var head = DOC.head //HEAD元素
head.insertAdjacentHTML("afterBegin", '<avalon ms-skip class="avalonHide"><style id="avalonStyle">.avalonHide{ display: none!important }</style></avalon>')
var ifGroup = head.firstChild

function log() {
    if (avalon.config.debug) {
// http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
        console.log.apply(console, arguments)
    }
}

/**
 * Creates a new object without a prototype. This object is useful for lookup without having to
 * guard against prototypically inherited properties via hasOwnProperty.
 *
 * Related micro-benchmarks:
 * - http://jsperf.com/object-create2
 * - http://jsperf.com/proto-map-lookup/2
 * - http://jsperf.com/for-in-vs-object-keys2
 */
function createMap() {
  return Object.create(null)
}

var subscribers = "$" + expose

var nullObject = {} //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rw20g = /\w+/g
var rsvg = /^\[object SVG\w*Element\]$/
var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
var W3C = window.dispatchEvent
var root = DOC.documentElement
var avalonFragment = DOC.createDocumentFragment()
var cinerator = DOC.createElement("div")
var class2type = {}
"Boolean Number String Function Array Date RegExp Object Error".replace(rword, function (name) {
    class2type["[object " + name + "]"] = name.toLowerCase()
})

var IEVersion = NaN
if (window.VBArray) {
    IEVersion = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
}

function noop(){}
function scpCompile(array){
    return Function.apply(noop, array)
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

//生成UUID http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
var generateID = function (prefix) {
    prefix = prefix || "avalon"
    return String(Math.random() + Math.random()).replace(/\d\.\d{4}/, prefix)
}

avalon = function (el) { //创建jQuery式的无new 实例化结构
    return new avalon.init(el)
}

/*视浏览器情况采用最快的异步回调*/
avalon.nextTick = new function () {// jshint ignore:line
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
}// jshint ignore:line

/*********************************************************************
 *                 avalon的静态方法定义区                              *
 **********************************************************************/

avalon.init = function (el) {
    this[0] = this.element = el
}
avalon.fn = avalon.prototype = avalon.init.prototype

avalon.type = function (obj) { //取得目标的类型
    if (obj == null) {
        return String(obj)
    }
    // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
    return typeof obj === "object" || typeof obj === "function" ?
            class2type[serialize.call(obj)] || "object" :
            typeof obj
}

avalon.isFunction = function (fn) {
    return serialize.call(fn) === "[object Function]"
}

avalon.isWindow = function (obj) {
    return rwindow.test(serialize.call(obj))
}

/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
avalon.isPlainObject = function (obj) {
    // 简单的 typeof obj === "object"检测，会致使用isPlainObject(window)在opera下通不过
    return serialize.call(obj) === "[object Object]" && Object.getPrototypeOf(obj) === oproto
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

avalon.mix({
    rword: rword,
    subscribers: subscribers,
    version: 1.6,
    ui: {},
    log: log,
    slice: function (nodes, start, end) {
        return aslice.call(nodes, start, end)
    },
    noop: noop,
    /*如果不用Error对象封装一下，str在控制台下可能会乱码*/
    error: function (str, e) {
        throw new (e || Error)(str)// jshint ignore:line
    },
    /*将一个以空格或逗号隔开的字符串或数组,转换成一个键值都为1的对象*/
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
    eventHooks: {},
    /*绑定事件*/
    bind: function (el, type, fn, phase) {
        var hooks = avalon.eventHooks
        var hook = hooks[type]
        if (typeof hook === "object") {
            type = hook.type || type
            phase = hook.phase || !!phase
            fn = hook.fn ? hook.fn(el, fn) : fn
        }
        el.addEventListener(type, fn, phase)
        return fn
    },
    /*卸载事件*/
    unbind: function (el, type, fn, phase) {
        var hooks = avalon.eventHooks
        var hook = hooks[type]
        var callback = fn || noop
        if (typeof hook === "object") {
            type = hook.type || type
            phase = hook.phase || !!phase
        }
        el.removeEventListener(type, callback, phase)
    },
    /*读写删除元素节点的样式*/
    css: function (node, name, value) {
        if (node instanceof avalon) {
            node = node[0]
        }
        var prop = /[_-]/.test(name) ? camelize(name) : name, fn
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
    /*遍历数组与对象,回调的第一个参数为索引或键名,第二个或元素或键值*/
    each: function (obj, fn) {
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
    },
    //收集元素的data-{{prefix}}-*属性，并转换为对象
    getWidgetData: function (elem, prefix) {
        var raw = avalon(elem).data()
        var result = {}
        for (var i in raw) {
            if (i.indexOf(prefix) === 0) {
                result[i.replace(prefix, "").replace(/\w/, function (a) {
                    return a.toLowerCase()
                })] = raw[i]
            }
        }
        return result
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

var bindingHandlers = avalon.bindingHandlers = {}
var bindingExecutors = avalon.bindingExecutors = {}

var directives = avalon.directives = {}
avalon.directive = function (name, obj) {
    bindingHandlers[name] = obj.init = (obj.init || noop)
    bindingExecutors[name] = obj.update = (obj.update || noop)
    return directives[name] = obj
}

/*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
function isArrayLike(obj) {
    if (obj && typeof obj === "object") {
        var n = obj.length,
                str = serialize.call(obj)
        if (/(Array|List|Collection|Map|Arguments)\]$/.test(str)) {
            return true
        } else if (str === "[object Object]" && n === (n >>> 0)) {
            return true //由于ecma262v5能修改对象属性的enumerable，因此不能用propertyIsEnumerable来判定了
        }
    }
    return false
}

// https://github.com/rsms/js-lru
var Cache = new function() {// jshint ignore:line
    function LRU(maxLength) {
        this.size = 0
        this.limit = maxLength
        this.head = this.tail = void 0
        this._keymap = {}
    }

    var p = LRU.prototype

    p.put = function(key, value) {
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

    p.shift = function() {
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
    p.get = function(key) {
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
    return LRU
}// jshint ignore:line

/*********************************************************************
 *                           DOM 底层补丁                             *
 **********************************************************************/

//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
if (!DOC.contains) {
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

if (window.SVGElement) {
    var svgns = "http://www.w3.org/2000/svg"
    var svg = DOC.createElementNS(svgns, "svg")
    svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
    if (!rsvg.test(svg.firstChild)) {// #409
        /* jshint ignore:start */
        function enumerateNode(node, targetNode) {
            if (node && node.childNodes) {
                var nodes = node.childNodes
                for (var i = 0, el; el = nodes[i++]; ) {
                    if (el.tagName) {
                        var svg = DOC.createElementNS(svgns,
                                el.tagName.toLowerCase())
                        // copy attrs
                        ap.forEach.call(el.attributes, function (attr) {
                            svg.setAttribute(attr.name, attr.value)
                        })
                        // 递归处理子节点
                        enumerateNode(el, svg)
                        targetNode.appendChild(svg)
                    }
                }
            }
        }
        /* jshint ignore:end */
        Object.defineProperties(SVGElement.prototype, {
            "outerHTML": {//IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
                enumerable: true,
                configurable: true,
                get: function () {
                    return new XMLSerializer().serializeToString(this)
                },
                set: function (html) {
                    var tagName = this.tagName.toLowerCase(),
                            par = this.parentNode,
                            frag = avalon.parseHTML(html)
                    // 操作的svg，直接插入
                    if (tagName === "svg") {
                        par.insertBefore(frag, this)
                        // svg节点的子节点类似
                    } else {
                        var newFrag = DOC.createDocumentFragment()
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
                    return  s.replace(ropen, "").replace(rclose, "")
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
//========================= event binding ====================
var eventHooks = avalon.eventHooks
//针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
if (!("onmouseenter" in root)) {
    avalon.each({
        mouseenter: "mouseover",
        mouseleave: "mouseout"
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
    AnimationEvent: "animationend",
    WebKitAnimationEvent: "webkitAnimationEnd"
}, function (construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
        eventHooks.animationend = {
            type: fixType
        }
    }
})

if (DOC.onmousewheel === void 0) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    eventHooks.mousewheel = {
        type: "wheel",
        fn: function (elem, fn) {
            return function (e) {
                e.wheelDeltaY = e.wheelDelta = e.deltaY > 0 ? -120 : 120
                e.wheelDeltaX = 0
                Object.defineProperty(e, "type", {
                    value: "mousewheel"
                })
                fn.call(elem, e)
            }
        }
    }
}

/*********************************************************************
 *                           配置系统                                 *
 **********************************************************************/

function kernel(settings) {
    for (var p in settings) {
        if (!ohasOwn.call(settings, p))
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

var openTag, closeTag, rexpr, rexprg, rbind, rescape = /[-.*+?^${}()|[\]\/\\]/g

function escapeRegExp(target) {
    //http://stevenlevithan.com/regex/xregexp/
    //将字符串安全格式化为正则表达式的源码
    return (target + "").replace(rescape, "\\$&")
}

var plugins = {
    interpolate: function (array) {
        openTag = array[0]
        closeTag = array[1]
        if (openTag === closeTag) {
            throw new SyntaxError("openTag!==closeTag")
            var test = openTag + "test" + closeTag
            cinerator.innerHTML = test
            if (cinerator.innerHTML !== test && cinerator.innerHTML.indexOf("&lt;") > -1) {
                throw new SyntaxError("此定界符不合法")
            }
            cinerator.innerHTML = ""
        }
         kernel.openTag = openTag
            kernel.closeTag = closeTag
        var o = escapeRegExp(openTag),
                c = escapeRegExp(closeTag)
        rexpr = new RegExp(o + "(.*?)" + c)
        rexprg = new RegExp(o + "(.*?)" + c, "g")
        rbind = new RegExp(o + ".*?" + c + "|\\sms-")
    }
}
kernel.plugins = plugins
kernel.plugins['interpolate'](["{{", "}}"])

kernel.async =true
kernel.debug = true
kernel.paths = {}
kernel.shim = {}
kernel.maxRepeatSize = 100

//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
avalon.vmodels = {} //所有vmodel都储存在这里
var vtree = {}
var dtree = {}

avalon.define = function (definition) {
    var $id = definition.$id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    var vmodel = observeObject(definition, {
        timestamp: new Date() - 0
    }, {
        watch: true
    })

    avalon.vmodels[$id] = vmodel
    vmodel.$id = $id


    return vmodel
}


//observeArray及observeObject的包装函数
function observe(definition, old, heirloom, options) {
    if (Array.isArray(definition)) {
        return observeArray(definition, old, heirloom, options)
    } else if (avalon.isPlainObject(definition)) {
        var vm = observeObject(definition, heirloom, options)
        for (var i in old) {
            if (vm.hasOwnProperty(i)) {
                vm[i] = old[i]
            }
        }
        return vm
    } else {
        return definition
    }
}


//将普通数组转换为监控数组
function observeArray(array, old, heirloom, options) {
    if (old && old.splice) {
        var args = [0, old.length].concat(array)
        old.splice.apply(old, args)
        return old
    } else {
        for (var i in newProto) {
            array[i] = newProto[i]
        }
        array._ = observeObject({
            length: NaN
        }, heirloom, {
            pathname: options.pathname + ".length",
            watch: true
        })
        array._.length = array.length
        array._.$watch("length", function (a, b) {
        })


        hideProperty(array, "$model", $modelDescriptor)

        var arrayOptions = {
            pathname: options.pathname + "*",
            watch: true
        }
        for (var j = 0, n = array.length; j < n; j++) {
            array[j] = observe(array[j], 0, heirloom, arrayOptions)
        }

        return array
    }
}


function Component() {
}


/*
 将一个对象转换为一个VM
 它拥有如下私有属性
 $id: vm.id
 $events: 放置$watch回调与绑定对象
 $watch: 增强版$watch
 $fire: 触发$watch回调
 $active:boolean,false时防止依赖收集
 $model:返回一个纯净的JS对象
 =============================
 $skipArray:用于指定不可监听的属性,但VM生成是没有此属性的
 
 $$skipArray与$skipArray都不能监控,
 不同点是
 $$skipArray被hasOwnProperty后返回false
 $skipArray被hasOwnProperty后返回true
 */
var $$skipArray = oneObject("$id,$watch,$fire,$events,$model,$skipArray,$active")

function observeObject(definition, heirloom, options) {
    options = options || {}
    heirloom = heirloom || {}

    var $skipArray = {}//收集所有不可监听属性
    if (definition.$skipArray) {
        $skipArray = oneObject(definition.$skipArray)
        delete definition.$skipArray
    }
    var $computed = getComputed(definition) // 收集所有计算属性
    var $pathname = options.pathname || ""
    var $vmodel = new Component() //要返回的对象, 它在IE6-8下可能被偷龙转凤
    var $accessors = {} //用于储放所有访问器属性的定义
    var hasOwn = {}    //用于实现hasOwnProperty方法
    var simple = []    //用于储放简单类型的访问器属性的名字
    var skip = []

    for (var key in definition) {
        if ($$skipArray[key])
            continue
        var val = definition[key]
        hasOwn[key] = true
        if (!isObervable(key, val, $skipArray)) {
            simple.push(key)
            var path = $pathname ? $pathname + "." + key : key
            $accessors[key] = makeObservable(path, heirloom)
        } else {
            skip.push(key)
        }
    }

    for (var name in $computed) {
        hasOwn[key] = true
        path = $pathname ? $pathname + "." + key : key
        $accessors[key] = makeComputed(path, heirloom, key, $computed[key])
    }

    $accessors["$model"] = $modelDescriptor

    Object.defineProperties($vmodel, $accessors)

    function trackBy(name) {
        return hasOwn[name] === true
    }

    skip.forEach(function (name) {
        $vmodel[name] = definition[name]
    })
    simple.forEach(function (name) {
        $vmodel[name] = definition[name]
    })

    hideProperty($vmodel, "$id", "anonymous")
    hideProperty($vmodel, "$active", false)
    hideProperty($vmodel, "hasOwnProperty", trackBy)
    //在高级浏览器,我们不需要搞一个$accessors存放所有访问器属性的定义
    //直接用Object.getOwnPropertyDescriptor获取它们
    if (options.watch) {
        hideProperty($vmodel, "$events", {})
        hideProperty($vmodel, "$watch", $watch)
        hideProperty($vmodel, "$fire", function (path, a, b) {
            if (path.indexOf("all!") === 0) {
                var p = path.slice(4)
                for (var i in avalon.vmodels) {
                    var v = avalon.vmodels[i]
                    v.$fire && v.$fire(p, a, b)
                }
            } else {
                if (heirloom.vm) {
                    $emit(heirloom.vm, $vmodel, path, a, b)
                }
            }
        })
        heirloom.vm = heirloom.vm || $vmodel
    }

    for (name in $computed) {
        val = $vmodel[name]
    }

    $vmodel.$active = true
    return $vmodel
}


function isComputed(val) {//speed up!
    if (val && typeof val === "object") {
        for (var i in val) {
            if (i !== "get" && i !== "set") {
                return false
            }
        }
        return  typeof val.get === "function"
    }
}

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

function makeComputed(pathname, heirloom, key, value) {
    var old = NaN, _this = {}
    return {
        get: function () {
            if (!this.configurable) {
                _this = this
            }
            return old = value.get.call(_this)
        },
        set: function (x) {
            if (typeof value.set === "function") {
                if (!this.configurable) {
                    _this = this
                }
                var older = old
                value.set.call(_this, x)
                var newer = _this[key]
                if (_this.$active && (newer !== older)) {
                    $emit(heirloom.vm, _this, pathname, newer, older)
                    batchUpdate(heirloom.vm)
                }
            }
        },
        enumerable: true,
        configurable: true
    }
}

function isObservable(key, value, skipArray) {
    return key.charAt(0) === "$" ||
            skipArray[key] ||
            (typeof value === "function") ||
            (value && value.nodeName && value.nodeType > 0)
}

function makeObservable(pathname, heirloom) {
    var old = NaN, _this = {}
    return {
        get: function () {
            if (!this.configurable) {
                _this = this // 保存当前子VM的引用
            }
            if (_this.$active) {
                collectDependency(pathname, heirloom)
            }
            return old
        },
        set: function (val) {
            if (old === val)
                return
            val = observe(val, old, heirloom, {
                pathname: pathname
            })
            if (!this.configurable) {
                _this = this // 保存当前子VM的引用
            }
            var older = old
            old = val
            if (_this.$active) {
                $emit(heirloom.vm, _this, pathname, val, older)
                batchUpdate(heirloom.vm)
            }

        },
        enumerable: true,
        configurable: true
    }
}

function createProxy(before, after) {
    var accessors = {}
    var skip = {}
    //收集所有键值对及访问器属性
    for (var k in before) {
        var accessor = Object.getOwnPropertyDescriptor(before, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = before[k]
        }
    }
    for (var k in after) {
        var accessor = Object.getOwnPropertyDescriptor(after, k)
        if (accessor.set) {
            accessors[k] = accessor
        } else {
            skip[k] = after[k]
        }
    }
    var $vmodel = {}
    $vmodel = Object.defineProperties($vmodel, accessors)
    for (var k in skip) {
        $vmodel[k] = keys[k]
    }
    $vmodel.$active = true
    return $vmodel
}

avalon.createProxy = createProxy

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
            if (val.hasOwnProperty(i)) {
                var value = val[i]
                obj[i] = value && value.nodeType ? value : toJson(value)
            }
        }
        return obj
    }
    return val
}

var $modelDescriptor = {
    get: function () {
        return toJson(this)
    },
    set: noop,
    enumerable: false,
    configurable: true
}


function hideProperty(host, name, value) {
    Object.defineProperty(host, name, {
        value: value,
        writable: true,
        enumerable: false,
        configurable: true
    })
}


//监听对象属性值的变化(注意,数组元素不是数组的属性),通过对劫持当前对象的访问器实现
//监听对象或数组的结构变化, 对对象的键值对进行增删重排, 或对数组的进行增删重排,都属于这范畴
//   通过比较前后代理VM顺序实现
function batchUpdate(vm) {
    if (vm && canUpdateDom) {
        var id = vm.$id
        var vnode = vtree[id]//虚拟DOM
        if (!vnode)
            return
        var dom = dtree[id]//虚拟DOM
        if (dom) {
            if (!root.contains(dom))
                return
        } else {
            for (var i = 0, node, all = document.getElementsByTagName("*");
                    node = all[i++]; ) {
                if (node.getAttribute("data-controller") === id ||
                        node.getAttribute("data-important") === id) {
                    dom = dtree[id] = node
                    break
                }
            }
        }
        if (dom) {
            canUpdateDom = false
            setTimeout(function () {
                updateTree([dom], [vnode])
                canUpdateDom = true
            })
        }
    }
}
var canUpdateDom = true
function $watch(expr, funOrObj) {
    var hive = (this.$events = this.$events || {})
    var list = (hive[expr] = hive[expr] || [])
    var data = typeof funOrObj === "function" ? {
        update: funOrObj
    } : funOrObj
    avalon.Array.ensure(list, data)
    return function () {
        avalon.Array.remove(list, data)
    }
}

function $emit(topVm, curVm, path, a, b, i) {
    var hive = topVm.$events
    if (hive && hive[path]) {
        var list = hive[path]
        try {
            for (i = i || list.length - 1; i >= 0; i--) {
                var data = list[i]
                if (data.remove) {
                    list.splice(i, 1)
                } else if (data.update) {
                    data.update.call(curVm, a, b, path)
                }
            }
        } catch (e) {
           
            // $emit(topVm, curVm, path, a, b, i - 1)
            avalon.log(e, path)
        }
    }
}

/*********************************************************************
 *          监控数组（与ms-each, ms-repeat配合使用）                     *
 **********************************************************************/

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
var arrayProto = Array.prototype
var newProto = {
    notify: function () {
        $emit.call(this.$up, this.$pathname)
    },
    set: function (index, val) {
        if (((index >>> 0) === index) && this[index] !== val) {
            if (index > this.length) {
                throw Error(index + "set方法的第一个参数不能大于原数组长度")
            }
            $emit.call(this.$up, this.$pathname + ".*", [val, this[index]])
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
    size: function () { //取得数组长度，这个函数可以同步视图，length不能
        return this._.length
    },
    removeAll: function (all) { //移除N个元素
        if (Array.isArray(all)) {
            for (var i = this.length - 1; i >= 0; i--) {
                if (all.indexOf(this[i]) !== -1) {
                    _splice.call(this.$track, i, 1)
                    _splice.call(this, i, 1)
                    
                }
            }
        } else if (typeof all === "function") {
            for (i = this.length - 1; i >= 0; i--) {
                var el = this[i]
                if (all(el, i)) {
                     _splice.call(this.$track, i, 1)
                    _splice.call(this, i, 1)
                   
                }
            }
        } else {
            _splice.call(this.$track, 0, this.length)
            _splice.call(this, 0, this.length)

        }
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        this._.length = this.length
    },
    clear: function () {
        return this.removeAll()
    }
}

var _splice = arrayProto.splice
arrayMethods.forEach(function (method) {
    var original = arrayProto[method]
    newProto[method] = function () {
        // 继续尝试劫持数组元素的属性
        var args = []
        for (var i = 0, n = arguments.length; i < n; i++) {
            args[i] = observe(arguments[i], 0, 1, 1)
        }
        var result = original.apply(this, args)
        addTrack(this.$track, method, args)
        if (!W3C) {
            this.$model = toJson(this)
        }
        this.notify()
        this._.length = this.length
        return result
    }
})

"sort,reverse".replace(rword, function (method) {
    newProto[method] = function () {
        var oldArray = this.concat() //保持原来状态的旧数组
        var newArray = this
        var mask = Math.random()
        var indexes = []
        var hasSort = false
        arrayProto[method].apply(newArray, arguments) //排序
        for (var i = 0, n = oldArray.length; i < n; i++) {
            var neo = newArray[i]
            var old = oldArray[i]
            if (neo === old) {
                indexes.push(i)
            } else {
                var index = oldArray.indexOf(neo)
                indexes.push(index)//得到新数组的每个元素在旧数组对应的位置
                oldArray[index] = mask    //屏蔽已经找过的元素
                hasSort = true
            }
        }
        if (hasSort) {
            sortByIndex(this.$track, indexes)
            if (!W3C) {
                this.$model = toJson(this)
            }
            this.notify()
        }
        return this
    }
})

function sortByIndex(array, indexes) {
    var map = {};
    for (var i = 0, n = indexes.length; i < n; i++) {
        map[i] = array[i]
        var j = indexes[i]
        if (j in map) {
            array[i] = map[j]
            delete map[j]
        } else {
            array[i] = array[j]
        }
    }
}

function createTrack(n) {
    var ret = []
    for (var i = 0; i < n; i++) {
        ret[i] = generateID("$proxy$each")
    }
    return ret
}

function addTrack(track, method, args) {
    switch (method) {
        case 'push':
        case 'unshift':
            args = createTrack(args.length)
            break
        case 'splice':
            if (args.length > 2) {
                // 0, 5, a, b, c --> 0, 2, 0
                // 0, 5, a, b, c, d, e, f, g--> 0, 0, 3
                var del = args[1]
                var add = args.length - 2
                // args = [args[0], Math.max(del - add, 0)].concat(createTrack(Math.max(add - del, 0)))
                args = [args[0], args[1]].concat(createTrack(args.length - 2))
            }
            break
    }
    Array.prototype[method].apply(track, args)
}

/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/

//检测两个对象间的依赖关系
var dependencyDetection = (function () {
    var outerFrames = []
    var currentFrame
    return {
        begin: function (binding) {
            //accessorObject为一个拥有callback的对象
            outerFrames.push(currentFrame)
            currentFrame = binding
        },
        end: function () {
            currentFrame = outerFrames.pop()
        },
        collectDependency: function (array) {
            if (currentFrame) {
                //被dependencyDetection.begin调用
                currentFrame.callback(array)
            }
        }
    };
})()

//将绑定对象注入到其依赖项的订阅数组中
var roneval = /^on$/

function returnRandom() {
    return new Date() - 0
}

avalon.injectBinding = function (binding) {

    binding.handler = binding.handler || directives[binding.type].update || noop
    binding.update = function () {
        var begin = false
        if (!binding.getter) {
            begin = true
            dependencyDetection.begin({
                callback: function (array) {
                    injectDependency(array, binding)
                }
            })
            binding.getter = parseExpr(binding.expr, binding.vmodels, binding)
            binding.observers.forEach(function (a) {
                a.v.$watch(a.p, binding)
            })
            delete binding.observers
        }
        try {
            var args = binding.fireArgs, a, b
            delete binding.fireArgs
            if (!args) {
                if (binding.type === "on") {
                    a = binding.getter + ""
                } else {
                    try {
                        a = binding.getter.apply(0, binding.args)
                    } catch (ex) {
                        a = null
                    }
                }
            } else {
                a = args[0]
                b = args[1]

            }
            b = typeof b === "undefined" ? binding.oldValue : b
            if (binding._filters) {
                a = filters.$filter.apply(0, [a].concat(binding._filters))
            }
            if (binding.signature) {
                var xtype = avalon.type(a)
                if (xtype !== "array" && xtype !== "object") {
                    throw Error("warning:" + binding.expr + "只能是对象或数组")
                }
                binding.xtype = xtype
                var vtrack = getProxyIds(binding.proxies || [], xtype)
                var mtrack = a.$track || (xtype === "array" ? createTrack(a.length) :
                        Object.keys(a))
                binding.track = mtrack
                if (vtrack !== mtrack.join(";")) {
                    binding.handler(a, b)
                    binding.oldValue = 1
                }
            } else if (Array.isArray(a) ? a.length !== (b && b.length) : false) {
                binding.handler(a, b)
                binding.oldValue = a.concat()
            } else if (!("oldValue" in binding) || a !== b) {
                binding.handler(a, b)
                binding.oldValue = a
            }
        } catch (e) {
            delete binding.getter
            log("warning:exception throwed in [avalon.injectBinding] ", e)
            var node = binding.element
            if (node && node.nodeType === 3) {
                node.nodeValue = openTag + (binding.oneTime ? "::" : "") + binding.expr + closeTag
            }
        } finally {
            begin && dependencyDetection.end()

        }
    }
    binding.update()
}

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组
function injectDependency(list, binding) {
    if (binding.oneTime)
        return
    if (list && avalon.Array.ensure(list, binding) && binding.element) {
        injectDisposeQueue(binding, list)
        if (new Date() - beginTime > 444) {
            rejectDisposeQueue()
        }
    }
}

function getProxyIds(a, isArray) {
    var ret = []
    for (var i = 0, el; el = a[i++]; ) {
        ret.push(isArray ? el.$id : el.$key)
    }
    return ret.join(";")
}

/*********************************************************************
 *                          定时GC回收机制                             *
 **********************************************************************/

var disposeCount = 0
var disposeQueue = avalon.$$subscribers = []
var beginTime = new Date()
var oldInfo = {}

function getUid(data) { //IE9+,标准浏览器
    if (!data.uniqueNumber) {
        var elem = data.element
        if (elem) {
            if (elem.nodeType !== 1) {
                //如果是注释节点,则data.pos不存在,当一个元素下有两个注释节点就会出问题
                data.uniqueNumber = data.type + "-" + getUid(elem.parentNode) + "-" + (++disposeCount)
            } else {
                data.uniqueNumber = data.name + "-" + getUid(elem)
            }
        } else {
            data.uniqueNumber = ++disposeCount
        }
    }
    return data.uniqueNumber
}

//添加到回收列队中
function injectDisposeQueue(data, list) {
    var lists = data.lists || (data.lists = [])
    var uuid = getUid(data)
    avalon.Array.ensure(lists, list)
    list.$uuid = list.$uuid || generateID()
    if (!disposeQueue[uuid]) {
        disposeQueue[uuid] = 1
        disposeQueue.push(data)
    }
}

function rejectDisposeQueue(data) {

    var i = disposeQueue.length
    var n = i
    var allTypes = []
    var iffishTypes = {}
    var newInfo = {}
    //对页面上所有绑定对象进行分门别类, 只检测个数发生变化的类型
    while (data = disposeQueue[--i]) {
        var type = data.type
        if (newInfo[type]) {
            newInfo[type]++
        } else {
            newInfo[type] = 1
            allTypes.push(type)
        }
    }
    var diff = false
    allTypes.forEach(function (type) {
        if (oldInfo[type] !== newInfo[type]) {
            iffishTypes[type] = 1
            diff = true
        }
    })
    i = n
    if (diff) {
        while (data = disposeQueue[--i]) {
            if (data.element === null) {
                disposeQueue.splice(i, 1)
                continue
            }
            if (iffishTypes[data.type] && shouldDispose(data.element)) { //如果它没有在DOM树
                disposeQueue.splice(i, 1)
                delete disposeQueue[data.uniqueNumber]
                var lists = data.lists
                for (var k = 0, list; list = lists[k++]; ) {
                    avalon.Array.remove(lists, list)
                    avalon.Array.remove(list, data)
                }
                disposeData(data)
            }
        }
    }
    oldInfo = newInfo
    beginTime = new Date()
}

function disposeData(data) {
    delete disposeQueue[data.uniqueNumber] // 先清除，不然无法回收了
    data.element = null
    data.rollback && data.rollback()
    for (var key in data) {
        data[key] = null
    }
}

function shouldDispose(el) {
    try {//IE下，如果文本节点脱离DOM树，访问parentNode会报错
        var fireError = el.parentNode.nodeType
    } catch (e) {
        return true
    }
    if (el.ifRemove) {
        // 如果节点被放到ifGroup，才移除
        if (!root.contains(el.ifRemove) && (ifGroup === el.parentNode)) {
            el.parentNode && el.parentNode.removeChild(el)
            return true
        }
    }
    return el.msRetain ? 0 : (el.nodeType === 1 ? !root.contains(el) : !avalon.contains(root, el))
}

/************************************************************************
 *              HTML处理(parseHTML, innerHTML, clearHTML)                *
 *************************************************************************/

//parseHTML的辅助变量
var tagHooks = new function() {// jshint ignore:line
    avalon.mix(this, {
        option: DOC.createElement("select"),
        thead: DOC.createElement("table"),
        td: DOC.createElement("tr"),
        area: DOC.createElement("map"),
        tr: DOC.createElement("tbody"),
        col: DOC.createElement("colgroup"),
        legend: DOC.createElement("fieldset"),
        _default: DOC.createElement("div"),
        "g": DOC.createElementNS("http://www.w3.org/2000/svg", "svg")
    })
    this.optgroup = this.option
    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
    this.th = this.td
}// jshint ignore:line
String("circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use").replace(rword, function(tag) {
    tagHooks[tag] = tagHooks.g //处理SVG
})

var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
var scriptTypes = oneObject(["", "text/javascript", "text/ecmascript", "application/ecmascript", "application/javascript"])
var script = DOC.createElement("script")
var rhtml = /<|&#?\w+;/

avalon.parseHTML = function(html) {
    var fragment = avalonFragment.cloneNode(false)
    if (typeof html !== "string" ) {
        return fragment
    }
    if (!rhtml.test(html)) {
        fragment.appendChild(DOC.createTextNode(html))
        return fragment
    }
    html = html.replace(rxhtml, "<$1></$2>").trim()
    var tag = (rtagName.exec(html) || ["", ""])[1].toLowerCase(),
            //取得其标签名
            wrapper = tagHooks[tag] || tagHooks._default,
            firstChild
    wrapper.innerHTML = html
    var els = wrapper.getElementsByTagName("script")
    if (els.length) { //使用innerHTML生成的script节点不会发出请求与执行text属性
        for (var i = 0, el; el = els[i++]; ) {
            if (scriptTypes[el.type]) {
                var neo = script.cloneNode(false) //FF不能省略参数
                ap.forEach.call(el.attributes, function(attr) {
                    neo.setAttribute(attr.name, attr.value)
                })// jshint ignore:line
                neo.text = el.text
                el.parentNode.replaceChild(neo, el)
            }
        }
    }

    while (firstChild = wrapper.firstChild) { // 将wrapper上的节点转移到文档碎片上！
        fragment.appendChild(firstChild)
    }
    return fragment
}

avalon.innerHTML = function(node, html) {
    var a = this.parseHTML(html)
    this.clearHTML(node).appendChild(a)
}

avalon.clearHTML = function(node) {
    node.textContent = ""
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
    return node
}

var bools = ["autofocus,autoplay,async,allowTransparency,checked,controls",
    "declare,disabled,defer,defaultChecked,defaultSelected",
    "contentEditable,isMap,loop,multiple,noHref,noResize,noShade",
    "open,readOnly,selected"
].join(",")

var boolMap = {}
bools.replace(rword, function (name) {
    boolMap[name.toLowerCase()] = name
})

var propMap = {//不规则的属性名映射
    "accept-charset": "acceptCharset",
    "char": "ch",
    "charoff": "chOff",
    "class": "className",
    "for": "htmlFor",
    "http-equiv": "httpEquiv"
}

var anomaly = ["accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan",
    "dateTime,defaultValue,frameBorder,longDesc,maxLength,marginWidth,marginHeight",
    "rowSpan,tabIndex,useMap,vSpace,valueType,vAlign"
].join(",")
anomaly.replace(rword, function (name) {
    propMap[name.toLowerCase()] = name
})

function attrUpdate(elem, vnode) {
    var attrs = vnode.changeAttrs
    if (attrs) {
        for (var attrName in attrs) {
            var val = attrs[attrName]
            // switch
            if (attrName === "href" || attrName === "src") {
                if (!root.hasAttribute) {
                    val = String(val).replace(/&amp;/g, "&") //处理IE67自动转义的问题
                }
                elem[attrName] = val
                if (window.chrome && elem.tagName === "EMBED") {
                    var parent = elem.parentNode //#525  chrome1-37下embed标签动态设置src不能发生请求
                    var comment = document.createComment("ms-src")
                    parent.replaceChild(comment, elem)
                    parent.replaceChild(elem, comment)
                }
            } else if (attrName.indexOf("data-") === 0) {
                elem.setAttribute(attrName, val)

            } else {
                var bool = boolMap[attrName]
                if (typeof elem[bool] === "boolean") {
                    elem[bool] = !!val
                    //布尔属性必须使用el.xxx = true|false方式设值
                    //如果为false, IE全系列下相当于setAttribute(xxx,''),
                    //会影响到样式,需要进一步处理
                }
                if (!W3C && propMap[attrName]) { //旧式IE下需要进行名字映射
                    attrName = propMap[attrName]
                }
                if (val === false) {
                    elem.removeAttribute(attrName)
                    continue
                }
                //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,
                //HTML的固有属性必须elem.xxx = yyy
                var isInnate = rsvg.test(elem) ? false :
                        (DOC.namespaces && isVML(elem)) ? true :
                        attrName in elem.cloneNode(false)
                if (isInnate) {
                    elem[attrName] = val + ""
                } else {
                    elem.setAttribute(attrName, val)
                }

            }

        }
        delete vnode.changeAttrs
        delete vnode.changeHooks.attr
    }
}

//=============================css相关=======================
var cssHooks = avalon.cssHooks = {}
var prefixes = ["", "-webkit-", "-o-", "-moz-", "-ms-"]
var cssMap = {
    "float": W3C ? "cssFloat" : "styleFloat"
}
avalon.cssNumber = oneObject("animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

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

"top,left".replace(rword, function (name) {
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
/*********************************************************************
 *                  avalon的原型方法定义区                             *
 **********************************************************************/

function hyphen(target) {
    //转换为连字符线风格
    return target.replace(/([a-z\d])([A-Z]+)/g, "$1-$2").toLowerCase()
}

function camelize(target) {
    //提前判断，提高getStyle等的效率
    if (!target || target.indexOf("-") < 0 && target.indexOf("_") < 0) {
        return target
    }
    //转换为驼峰风格
    return target.replace(/[-_][^-_]/g, function (match) {
        return match.charAt(1).toUpperCase()
    })
}

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
    } catch (e) {}
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

avalon.fireDom = function (elem, type, opts) {
    if (DOC.createEvent) {
        var hackEvent = DOC.createEvent("Events");
        hackEvent.initEvent(type, true, true, opts)
        avalon.mix(hackEvent, opts)

        elem.dispatchEvent(hackEvent)
    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报"SCRIPT16389: 未指明的错误"
        hackEvent = DOC.createEventObject()
        avalon.mix(hackEvent, opts)
        elem.fireEvent("on" + type, hackEvent)
    }
}


//==================================val相关============================


function getValType(elem) {
    var ret = elem.tagName.toLowerCase()
    return ret === "input" && /checkbox|radio/.test(elem.type) ? "checked" : ret
}
var roption = /^<option(?:\s+\w+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*\s+value[\s=]/i
var valHooks = {
    "option:get": IEVersion ? function (node) {
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




var rregexp = /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rmethod = /\b\d+(\.\w+\s*\()/g
var keywords = [
    "break,case,catch,continue,debugger,default,delete,do,else,false",
    "finally,for,function,if,in,instanceof,new,null,return,switch,this",
    "throw,true,try,typeof,var,void,while,with", /* 关键字*/
    "abstract,boolean,byte,char,class,const,double,enum,export,extends",
    "final,float,goto,implements,import,int,interface,long,native",
    "package,private,protected,public,short,static,super,synchronized",
    "throws,transient,volatile", /*保留字*/
    "arguments,let,yield,undefined" /* ECMA 5 - use strict*/].join(",")
var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g')
var rpaths = /[$_a-z]\w*(\.[$_a-z]\w*)*/g
var rfilter = /^[$_a-z]\w*/
//当属性发生变化时, 执行update
var rfill = /\?\?\d+/g
var brackets = /\(([^)]*)\)/
function K(a) {
    return a
}

var pathPool = new Cache(256)
//缓存求值函数，以便多次利用
var evaluatorPool = new Cache(512)


avalon.mix({
    __read__: function () {
        var fn = avalon.filter[name]
        if (fn) {
            return fn.get ? fn.get : fn
        }
        return K
    },
    __write__: function () {
        var fn = avalon.filter[name]
        return fn && fn.set || K
    }
})

function parseExpr(expr, vmodel, binding) {
    //目标生成一个函数
    binding = binding || {}
    var category = (binding.type.match(/on|duplex/) || ["other"])[0]
    var input = expr.trim()
    var fn = evaluatorPool.get(category + ":" + input)
    binding.paths = pathPool.put(category + ":" + input)
    var canReturn = false
    if (typeof fn === "function") {
        binding.getter = fn
        canReturn = true
    }
    if (category === "duplex") {
        fn = evaluatorPool.get(category + ":" + input + ":setter")
        if (typeof fn === "function") {
            binding.setter = fn
        }
    }
    if (canReturn)
        return
    var number = 1
    //相同的表达式生成相同的函数
    var maps = {}
    function dig(a) {
        var key = "??" + number++
        maps[key] = a
        return key
    }
    function dig2(a, b) {
        var key = "??" + number++
        maps[key] = b
        return key
    }
    function fill(a) {
        return maps[a]
    }

    input = input.replace(rregexp, dig).//移除所有正则
            replace(rstring, dig).//移除所有字符串
            replace(rmethod, dig2).//移除所有正则或字符串方法
            replace(/\|\|/g, dig).//移除所有短路与
            replace(/\$event/g, dig).//去掉事件对象
            replace(/\s*(\.|\1)\s*/g, "$1").//移除. |两端空白
            split(/\|(?=\w)/) //分离过滤器
    var paths = {}
    //处理表达式的本体
    var body = input.shift().
            replace(rkeywords, dig).
            replace(rpaths, function (a) {
                paths[a] = true //抽取所有要$watch的东西
                return a
            })
    //处理表达式的过滤器部分
    var footers = input.map(function (str) {
        return str.replace(/\w+/, dig).//去掉过滤名
                replace(rkeywords, dig).//去掉关键字
                replace(rpaths, function (a) {
                    paths[a] = true //抽取所有要$watch的东西
                    return a
                })
    }).map(function (str) {
        str = str.replace(rfill, fill) //还原
        var hasBracket = false
        str = str.replace(brackets, function (a, b) {
            hasBracket = true
            return /\S/.test(b) ?
                    "(__value__," + b + ");\n" :
                    "(__value__);\n"
        })
        if (!hasBracket) {
            str += "(__value__);\n"
        }
        str = str.replace(/(\w+)/, "avalon.__read__('$1')")
        return "__value__ = " + str
    })

    var headers = []
    var unique = {}
    var pathArray = []
    for (var i in paths) {
        pathArray.push(i)
        if (!unique[i]) {
            var key = i.split(".").shift()
            unique[key] = true
            headers.push("var " + key + " =  __vm__." + key + ";\n")
        }
    }
    binding.paths = pathPool.put(category + ":" + input, pathArray.join("★"))
    body = body.replace(rfill, fill).trim()
    var args = ["__vm__"]
    if (category === "on") {
        args.push("$event")
        if (body.indexOf("(") === -1) {//如果不存在括号
            body += ".call(this, $event)"
        } else {
            body = body.replace(brackets, function (a, b) {
                var array = b.split(/\s*,\s*/).filter(function (e) {
                    return /\S/.test(e)
                })
                array.unshift("this")
                if (array.indexOf("$event") === -1) {
                    array.push("$event")
                }
                return  ".call(" + array + ")"
            })
        }
    } else if (category === "duplex") {
        args.push("__value__", "__bind__")
        //Setter
        var setters = footers.map(function (str) {
            str = str.replace("__read__", "__write__")
            return str.replace(");", ",__bind__);")
        })
        //Getter
        footers = footers.map(function (str) {
            return str.replace(");", ",__bind__);")
        })
        fn = new Function(args.join(","),
                setters.join("") +
                "__vm__." + body + " = __value__;")
        binding.setter = evaluatorPool.put(category +
                ":" + input + ":setter", fn)
        // avalon.log(binding.setter + "***")
    }
    headers.push("var __value__ = " + body + ";\n")
    headers.push.apply(headers, footers)
    headers.push("return __value__;")
    fn = new Function(args.join(","), headers.join(""))
    binding.getter = evaluatorPool.put(category + ":" + input, fn)
    //avalon.log(binding.getter + "")
}









function normalizeExpr(code) {
    var hasExpr = rexpr.test(code) //比如ms-class="width{{w}}"的情况
    if (hasExpr) {
        var array = scanExpr(code)
        if (array.length === 1) {
            return array[0].expr
        }
        /* jshint ignore:start */
        return array.map(function (el) {
            return el.type ? "(" + el.expr + ")" : quote(el.expr)
        }).join(" + ")
        /* jshint ignore:end */
    } else {
        return code
    }
}
avalon.normalizeExpr = normalizeExpr
avalon.parseExprProxy = parseExpr

/*********************************************************************
 *                          编译系统                                  *
 **********************************************************************/

var quote = JSON.stringify

function VComment(text) {
    this.type = "#comment"
    this.nodeValue = text
    this.skip = true
}
VComment.prototype = {
    constructor: VComment,
    toDOM: function () {
        return document.createComment(this.nodeValue)
    },
    toHTML: function () {
        return "<!--" + this.nodeValue + "-->"
    }
}
function VComponent(type, props) {
    this.type = "#component"
    this.props = props
    this.__type__ = type
    this.children = []
}
VComponent.prototype = {
    update: function (vm) {
        var a = avalon.components[this.__type__]
        if (a && a.update) {
            a.update(this, vm)
        }
    },
    toDOM: function () {
        var fragment = document.createDocumentFragment()
        for (var i = 0; i < this.children.length; i++) {
            fragment.appendChild(this.children[i].toDOM())
        }
        return fragment
    },
    toHTML: function () {
        var ret = ""
        for (var i = 0; i < this.children.length; i++) {
            ret += this.children[i].toHTML()
        }
        return ret
    }
}

avalon.components = {}

avalon.components["repeat"] = {
    update: function (that, vm) {
        var template = that.props.template
        var arr = that.props.expr.match(/([^:]+)\:?(\w*)/)
        var repeatValue = parseExpr(arr[1], vm), repeatItem = arr[2] || "el"
        var children = [new VComment("ms-repeat")]
        updateVLoop(repeatValue, repeatItem, function (proxy) {
            var clone = buildVTree(template)

            var vnode = updateVTree(clone, proxy)

            children.push.apply(children, vnode)
        }, vm)

        that.children = children.concat(new VComment("ms-repeat-end"))
    }
}
avalon.components["each"] = avalon.components["repeat"]

avalon.components["if"] = {
    update: function (that, vm) {
        var render = parseExpr(that.props.expr, vm)
        if (render) {
            that.children = updateVTree(that.props._children, vm)
        } else {
            that.children = [new VComment("ms-if")]
        }
    }
}

avalon.components["html"] = {
    update: function (that, vm) {
        var html = parseExpr(that.props.expr, vm)
        var arr = buildVTree(html)
        updateVTree(arr, vm)
        that.children = [new VComment("ms-html")]
                .concat(arr)
                .concat(new VComment("ms-html-end"))
    }
}
avalon.components["text"] = {
    update: function (that, vm) {
        var text = parseExpr(that.props.expr, vm)
        that.children = [new VText(text)]
    }
}
function VElement(type, innerHTML, outerHTML) {
    this.type = type
    this.props = {}
    this.innerHTML = innerHTML
    this.outerHTML = outerHTML
    this.children = []
}
VElement.prototype = {
    constructor: VElement,
    toDOM: function () {
        if (this.skip) {
            return avalon.parseHTML(this.outerHTML)
        }
        var dom = document.createElement(this.type)

        for (var i in this.props) {
            if (this.props[i] === false) {
                dom.removeAttribute(i)
            } else {
                dom.setAttribute(i, this.props[i])
            }
        }
        if (this.skipContent) {
            switch (this.type) {
                case "script":
                    this.text = this.__content
                    break;
                case "style":
                case "noscript":
                case "template":
                    this.innerHTML = this.__content
                    break
                default:
                    var a = avalon.parseHTML(this.__content)
                    dom.appendChild(a)
                    break
            }
        } else {
            this.children.forEach(function (c) {
                dom.appendChild(c.toDOM())
            })
        }
        return dom
    },
    toHTML: function () {
        if (this.skip) {
            return this.outerHTML
        }
        if (this.closeSelf) {
            return "<" + this.type + "/>"
        }
        var p = ""
        for (var i in this.props) {
            p += (i + "=" + quote(String(this.props[i]))) + " "
        }
        p = p ? " " + p : p
        var str = "<" + this.type + p + ">"
        if (this.skipContent) {
            str += this.__content
        } else {
            str += this.children.map(function (el) {
                return el.toHTML()
            }).join("")
        }
        return str + "</" + this.type + ">"
    }
}




function updateVLoop(array, key, callback, old) {
    if (array) {
        if (Array.isArray(array)) {
            var n = array.length - 1
            for (var i = 0; i <= n; i++) {
                var vm = simpleCopy(old)
                vm[key] = array[i]
                vm["$index"] = i
                vm["$first"] = i === 0
                vm["$last"] = i === n
                /* jshint ignore:start */
                vm["$remove"] = (function (k) {
                    return function () {
                        avalon.Array.removeAt(array, k)
                    }
                })(i)
                /* jshint ignore:end */
                callback(vm)
            }
        } else {
            var keys = Object.keys(array)
            n = keys.length - 1
            for (i = 0; i <= n; i++) {
                vm = clone(old)
                vm["$key"] = keys[i]
                vm["$val"] = array[keys[i]]
                vm["$index"] = i
                vm["$first"] = i === 0
                vm["$last"] = i === n
                callback(vm)
            }
        }
    }
}
function simpleCopy(a) {
    var b = {}
    for (var i in a) {
        b[i] = a[i]
    }
    return b
}

function VText(text) {
    this.type = "#text"
    this.nodeValue = text
    this.skip = !rexpr.test(text)
}
function fixGtLt(str) {
    return str.replace(/</g, "&lt;").replace(/>/g, "&gt;")
}
VText.prototype = {
    constructor: VText,
    toDOM: function () {
        return document.createTextNode(this.nodeValue)
    },
    toHTML: function () {
        return fixGtLt(this.nodeValue)
    }
}
//avalon.scan时扫描整个DOM树,建立对应的虚拟DOM树


var rfullTag = /^<(\S+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>([\s\S]*)<\/\1>/
var ropenTag = /^<(\S+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>/
var openStr = '(?:\\s+[^=\\s]+=?(?:"[^"]*"|\'[^\']*\'|[^\\s>]+)?)*>'
var rtext = /^[^<]+/
var rattr1 = /(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>/g
var rattr2 = /\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
var rquote = /^['"]/
var rgtlt = /></
var ramp = /&amp;/g
var rcomment = /^<\!--([\s\S]*)-->/
var rmsrepeatkey = /^ms-(repeat|each)-?(.*)/

var avalonID = 1
//=== === === === 创建虚拟DOM树 === === === === =
//依赖config
function parseVProps(node, str) {
    var obj = {}
    var change = addHooks(node, "changeAttrs")
    str.replace(rattr2, function (a, n, v) {
        if (v) {
            v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
        }
        var name = n.toLowerCase()
        var match = n.match(rmsAttr)
        if (match) {
            var type = match[1]
            var param = match[2] || ""
            var value = v
            switch (type) {
                case "controller":
                case "important":
                    change[name] = false
                    name = "data-" + type
                    change[name] = value
                    addAttrHook(node)

                    break
                case "each":
                case "with":
                case "repeat":
                    change[name] = false
                    addAttrHook(node)
                    if (name === "with")
                        name = "each"
                    value = value + "★" + (param || "el")
                    break
            }
        }
        obj[name] = v || ""
    })
    if (!obj["avalon-uuid"]) {
        change["avalon-uuid"] = obj["avalon-uuid"] = avalonID++
        addAttrHook(node)
    }
    return obj
}

var tagCache = {}// 缓存所有匹配开标签闭标签的正则
function buildVTree(text) {
    var nodes = []
    if (!rbind.test(text))
        return nodes
    do {
        var matchText = ""
        var match = text.match(rtext)
        var node = false
        if (match) {//尝试匹配文本
            matchText = match[0]
            node = new VText(matchText)
        }
        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                matchText = match[0]
                node = new VComment(match[1])
            }
        }
        if (!node) {//尝试匹配拥有闭标签的元素节点
            match = text.match(rfullTag)
            if (match) {
                matchText = match[0]
                var tagName = match[1]
                var opens = []
                var closes = []

                var ropen = tagCache[tagName + "open"] ||
                        (tagCache[tagName + "open"] = new RegExp("<" + tagName + openStr, "g"))
                var rclose = tagCache[tagName + "close"] ||
                        (tagCache[tagName + "close"] = new RegExp("<\/" + tagName + ">", "g"))
                /* jshint ignore:start */
                matchText.replace(ropen, function (_, b) {
                    opens.push(("0000" + b + "<").slice(-4))//取得所有开标签的位置
                    return new Array(_.length + 1).join("1")
                }).replace(rclose, function (_, b) {
                    closes.push(("0000" + b + ">").slice(-4))//取得所有闭标签的位置

                })
                /* jshint ignore:end */

                var pos = opens.concat(closes).sort()
                var gtlt = pos.join("").replace(/\d+/g, "")

                //<<>><<>>
                var gutter = gtlt.indexOf("><")

                if (gutter !== -1) {
                    var index = gutter //+ tagName.length+ 2
                    var findex = parseFloat(pos[index]) + tagName.length + 3
                    matchText = matchText.slice(0, findex)
                }

                var allAttrs = matchText.match(rattr1)[0]
                var innerHTML = matchText.slice((tagName + allAttrs).length + 1,
                        (tagName.length + 3) * -1)
                node = new VElement(tagName, innerHTML, matchText)

                var props = allAttrs.slice(0, -1)
                node = fixTag(node, props)
            }
        }
        if (!node) {
            match = text.match(ropenTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]

                node = new VElement(match[1], "", matchText)

                props = matchText.slice(node.type.length + 1).replace(/\/>$/, "")
                node = fixTag(node, props)
            }
        }
        if (node) {
            nodes.push(node)
            text = text.slice(matchText.length)
        } else {
            break
        }
    } while (1);
    return nodes
}

var rmsif = /\s+ms-if=("[^"]*"|'[^']*'|[^\s>]+)/
var rmsrepeat = /\s+ms-(?:repeat|each)=("[^"]*"|'[^']*'|[^\s>]+)/
var rmstext = /\s+ms-text=("[^"]*"|'[^']*'|[^\s>]+)/
var rmshtml = /\s+ms-html=("[^"]*"|'[^']*'|[^\s>]+)/
var rnocontent = /textarea|template|script|style/
//如果存在ms-if, ms-repeat, ms-html, ms-text指令,可能会生成<ms:repeat> 等自定义标签
function fixTag(node, str) {
    if (/\bms\-skip/.test(str)) {
        node.skip = true
        return node
    }
    var props = node.props = parseVProps(node, str)
    var outerHTML = node.outerHTML
    if (!rnocontent.test(node.type) && (props["ms-text"] || props["ms-html"] ||
            rexpr.test(node.innerHTML))) {

        if (props["ms-repeat"]) {
            outerHTML = outerHTML.replace(rmsrepeat, "")
            node = new VComponent("repeat", {
                template: outerHTML,
                expr: props["ms-repeat"]
            })
            delete props["ms-if"]
        } else if (props["ms-html"]) {
            outerHTML = outerHTML.replace(rmshtml, "")
            node.children = [
                new VComponent("html", {
                    expr: props["ms-html"]
                })
            ]
            delete props["ms-html"]
        } else if (props["ms-text"]) {
            outerHTML = outerHTML.replace(rmstext, "")
            node.children = [
                new VComponent("text", {
                    expr: props["ms-text"]
                })
            ]
            delete props["ms-text"]
        }
        // 如果存在上面的组件,那么将上面的组件作<ms:if>的孩子
        if (props["ms-if"]) {
            var child = node
            outerHTML = outerHTML.replace(rmsif, "")
            node = new VComponent("if", {
                template: outerHTML,
                _children: [child],
                expr: props["ms-if"]
            })
            delete props["ms-if"]
        }
        node.children = buildVTree(node.innerHTML)
    } else {
        node.skipContent = true
        node.__content = node.innerHTML
    }
    return node
}


// executeBindings
function executeBindings(bindings, vmodel) {
    for (var i = 0, binding; binding = bindings[i++]; ) {
        binding.vmodel = vmodel
        directives[binding.type].init(binding)
        avalon.injectBinding(binding)
    }
    bindings.length = 0
}
function bindingIs(a, b) {
    return a === b
}

avalon.injectBinding = function (binding) {
    parseExpr(binding.expr, binding.vmodel, binding)
  
    binding.paths.split("★").forEach(function (path) {
        binding.vmodel.$watch(path, binding)
    })
    delete binding.paths
    binding.update = function () {
        try {
            var value = binding.getter(binding.vmodel)
        } catch (e) {
            avalon.log(e)
        }
        var is = binding.is || bindingIs
        if (!is(value, binding.oldValue)) {
            directives[binding.type].change(value, binding)
            binding.oldValue = value
        }
    }
    binding.update()
}

// attr css class data duplex

// aaa.bb.ccc

/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/
avalon.scan = function (elem, vmodel) {
    var text = elem.outerHTML
    if (rbind.test(text)) {
        var tree = buildVTree(text, vmodel)
        scanTree(tree, vmodel)
        updateTree([elem], tree)
    }
}


function updateTree(nodes, vnodes) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var vnode = vnodes[i]
        var node = nodes[i]
        switch (vnode.type) {
            case "#text":
                if (!vnode.skip) {
                    if (vnode.change) {
                        node.nodeValue = vnode.nodeValue
                        delete vnode.change
                    }
                }
                break
            case "#comment":
                if (!vnode.skip) {
                    // 添加或删除
                    // nodes[i].nodeValue = vnode.nodeValue
                    // delete vnode.change
                }
                break
            default:
                if (!vnode.skip) {
                    var hooks = vnode.changeHooks

                    for (var hook in hooks) {
                        hooks[hook](node, vnode)
                    }

                    delete vnode.changeHooks
                    if (!vnode.skipContent) {
                        updateTree(node.childNodes, vnode.children)
                    }
                }
                break
        }
    }
}

function addHooks(elem, name) {
    return elem[name] || (elem[name] = {})
}

function addAttrHook(node) {
    var hook = addHooks(node, "changeHooks")
    hook.attr = attrUpdate
}




var getBindingCallback = function (elem, name, vmodels) {
    var callback = elem.getAttribute(name)
    if (callback) {
        for (var i = 0, vm; vm = vmodels[i++]; ) {
            if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                return vm[callback]
            }
        }
    }
}





var rnoCollect = /^(ms-\S+|data-\S+|on[a-z]+|id|style|class)$/
var ronattr = /^on\-[\w-]+$/
function getOptionsFromTag(elem, vmodels) {
    var attributes = elem.attributes
    var ret = {}
    for (var i = 0, attr; attr = attributes[i++]; ) {
        var name = attr.name
        if (attr.specified && !rnoCollect.test(name)) {
            var camelizeName = camelize(attr.name)
            if (/^on\-[\w-]+$/.test(name)) {
                ret[camelizeName] = getBindingCallback(elem, name, vmodels)
            } else {
                ret[camelizeName] = parseData(attr.value)
            }
        }

    }
    return ret
}

function scanExpr(str) {
    var tokens = [],
            value, start = 0,
            stop
    do {
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop).trim()
        if (value) { // {{ 左边的文本
            tokens.push({
               expr: value
            })
        }
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.push({
                expr: value,
                type: "{{}}" 
            })
        }
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start).trim()
    if (value) { //}} 右边的文本
        tokens.push({
            expr: value
        })
    }
    return tokens
}


function scanText(node, vmodel) {
    var tokens = scanExpr(String(node.nodeValue))
    var texts = []
    for (var i = 0, token; token = tokens[i]; i++) {
        if (token.type) {
            token.expr = token.expr.replace(roneTime, function () {
                token.oneTime = true
                return ""
            })
            token.element = node
            token.vmodel = vmodel
            token.index = i
            token.array = texts
            avalon.injectBinding(token)
        } else {
            texts[i] = token.expr
            var nodeValue = texts.join("")
            if (nodeValue !== node.nodeValue) {
                node.change = "update"
                node.nodeValue = nodeValue
            }
        }
    }
    return [node]
}
function scanTree(nodes, vm) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        switch (node.type) {
            case "#comment":
                break
            case "#text":
                if (!node.skip) {
                    if (rexpr.test(String(node.nodeValue))) {
                        var arr = scanText(node, vm)
                        if (arr.length > 1) {
                            nodes.splice.apply(nodes, [i, 1].concat(arr))
                            i = i + arr.length
                        }
                    }
                }
                break
            case "#component":
                if (!node.skip) {
                    node.update(vm)
                }
                break
            default:
                if (!node.skip) {
                    nodes[i] = scanTag(node, vm)
                }
                break
        }
    }
    return nodes
}


//使用来自游戏界的双缓冲技术,减少对视图的冗余刷新
var Buffer = function () {
    this.queue = []
}
Buffer.prototype = {
    render: function (isAnimate) {
        if (!this.locked) {
            this.locked = isAnimate ? root.offsetHeight + 10 : 1
            var me = this
            avalon.nextTick(function () {
                me.flush()
            })
        }
    },
    flush: function () {
        for (var i = 0, sub; sub = this.queue[i++]; ) {
            sub.update && sub.update()
        }
        this.locked = 0
        this.queue = []
    }
}

var buffer = new Buffer()



var attrDir = avalon.directive("attr", {
    init: function (binding) {
        //{{aaa}} --> aaa
        //{{aaa}}/bbb.html --> (aaa) + "/bbb.html"
        binding.expr = normalizeExpr(binding.expr.trim())
    },
    change: function (val, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeAttrs")
            var name = binding.param
            var toRemove = (val === false) || (val === null) || (val === void 0)
            change[name] = toRemove ? false : val
            change = addHooks(elem, "changeHooks")
            change.attr = directives.attr.update
        }
    },
    update: attrUpdate
})

//这几个指令都可以使用插值表达式，如ms-src="aaa/{{b}}/{{c}}.html"
"title,alt,src,value,css,include,href".replace(rword, function (name) {
    directives[name] = attrDir
})

//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
avalon.directive("class", {
    init: function (binding) {
        var oldStyle = binding.param
        var method = binding.type
        if (!oldStyle || isFinite(oldStyle)) {
            binding.param = "" //去掉数字
            directives.effect.init(binding)
        } else {
            log('ms-' + method + '-xxx="yyy"这种用法已经过时,请使用ms-' + method + '="xxx:yyy"')
            binding.expr = '[' + quote(oldStyle) + "," + binding.expr + "]"
            binding.oldStyle = oldStyle
        }
        if (method === "hover" || method === "active") { //确保只绑定一次
            if (!binding.hasBindEvent) {
                var elem = binding.element
                var $elem = avalon(elem)
                var activate = "mouseenter" //在移出移入时切换类名
                var abandon = "mouseleave"
                if (method === "active") { //在聚焦失焦中切换类名
                    elem.tabIndex = elem.tabIndex || -1
                    activate = "mousedown"
                    abandon = "mouseup"
                    var fn0 = $elem.bind("mouseleave", function () {
                        binding.toggleClass && $elem.removeClass(binding.newClass)
                    })
                }
            }

            var fn1 = $elem.bind(activate, function () {
                binding.toggleClass && $elem.addClass(binding.newClass)
            })
            var fn2 = $elem.bind(abandon, function () {
                binding.toggleClass && $elem.removeClass(binding.newClass)
            })
            binding.rollback = function () {
                $elem.unbind("mouseleave", fn0)
                $elem.unbind(activate, fn1)
                $elem.unbind(abandon, fn2)
            }
            binding.hasBindEvent = true
        }

    },
    update: function (arr) {
        var binding = this
        var $elem = avalon(this.element)
        binding.newClass = arr[0]
        binding.toggleClass = !!arr[1]
        if (binding.oldClass && binding.newClass !== binding.oldClass) {
            $elem.removeClass(binding.oldClass)
        }
        binding.oldClass = binding.newClass
        if (binding.type === "class") {
            if (binding.oldStyle) {
                $elem.toggleClass(binding.oldStyle, !!arr[1])
            } else {
                $elem.toggleClass(binding.newClass, binding.toggleClass)
            }
        }
    }
})

"hover,active".replace(rword, function (name) {
    directives[name] = directives["class"]
})

//ms-controller绑定已经在scanTag 方法中实现
avalon.directive("css", {
    init: directives.attr.init,
    change: function (val, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeStyles")
            change[this.param] = val
            change = addHooks(elem, "changeHooks")
            change.css = directives.css.update
        }
    },
    update: function (elem, vnode) {
        var change = vnode.changeStyles
        var wrap = avalon(elem)
        for (var name in change) {
            if (name !== "display") {
                wrap.css(name, change[name])
            }
        }
    }
})

avalon.directive("data", {
    priority: 100,
    init: noop,
    change: directives.attr.change
})

//双工绑定
var rduplexType = /^(?:checkbox|radio)$/
var rduplexParam = /^(?:radio|checked)$/
var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/
var duplexBinding = avalon.directive("duplex", {
    priority: 2000,
    init: function (binding, hasCast) {
        var elem = binding.element
        var vmodels = binding.vmodels
        binding.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
        var params = []
        var casting = oneObject("string,number,boolean,checked")
        if (elem.type === "radio" && binding.param === "") {
            binding.param = "checked"
        }

        binding.param.replace(rw20g, function (name) {
            if (rduplexType.test(elem.type) && rduplexParam.test(name)) {
                if (name === "radio")
                    log("ms-duplex-radio已经更名为ms-duplex-checked")
                name = "checked"
                binding.isChecked = true
                binding.xtype = "radio"
            }
            if (name === "bool") {
                name = "boolean"
                log("ms-duplex-bool已经更名为ms-duplex-boolean")
            } else if (name === "text") {
                name = "string"
                log("ms-duplex-text已经更名为ms-duplex-string")
            }
            if (casting[name]) {
                hasCast = true
            }
            avalon.Array.ensure(params, name)
        })
        if (!hasCast) {
            params.push("string")
        }
        binding.param = params.join("-")
        if (!binding.xtype) {
            binding.xtype = elem.tagName === "SELECT" ? "select" :
                    elem.type === "checkbox" ? "checkbox" :
                    elem.type === "radio" ? "radio" :
                    /^change/.test(elem.getAttribute("data-duplex-event")) ? "change" :
                    "input"
        }
        //===================绑定事件======================
        var bound = binding.bound = function (type, callback) {
            elem.addEventListener(type, callback, false)
            var old = binding.rollback
            binding.rollback = function () {
                elem.avalonSetter = null
                avalon.unbind(elem, type, callback)
                old && old()
            }
        }
        function callback(value) {
            binding.changed.call(this, value, binding)
        }
        var composing = false
        function compositionStart() {
            composing = true
        }
        function compositionEnd() {
            composing = false
        }
        var updateVModel = function (e) {
            var val = elem.value //防止递归调用形成死循环
            if (composing || val === binding.oldValue || binding.pipe === null) //处理中文输入法在minlengh下引发的BUG
                return
            var lastValue = binding.pipe(val, binding, "get")
            binding.oldValue = val
            binding.setter(lastValue)
            callback.call(elem, lastValue)
        }
        switch (binding.xtype) {
            case "radio":
                bound("click", function () {
                    var lastValue = binding.pipe(elem.value, binding, "get")
                    binding.setter(lastValue)
                    callback.call(elem, lastValue)
                })
                break
            case "checkbox":
                bound("change", function () {
                    var method = elem.checked ? "ensure" : "remove"
                    var array = binding.getter.apply(0, binding.vmodels)
                    if (!Array.isArray(array)) {
                        log("ms-duplex应用于checkbox上要对应一个数组")
                        array = [array]
                    }
                    var val = binding.pipe(elem.value, binding, "get")
                    avalon.Array[method](array, val)
                    callback.call(elem, array)
                })
                break
            case "change":
                bound("change", updateVModel)
                break
            case "input":
                bound("input", updateVModel)
                bound("keyup", updateVModel)
                if (!IEVersion) {
                    bound("compositionstart", compositionStart)
                    bound("compositionend", compositionEnd)
                    bound("DOMAutoComplete", updateVModel)
                }
                break
            case "select":
                bound("change", function () {
                    var val = avalon(elem).val() //字符串或字符串数组
                    if (Array.isArray(val)) {
                        val = val.map(function (v) {
                            return binding.pipe(v, binding, "get")
                        })
                    } else {
                        val = binding.pipe(val, binding, "get")
                    }
                    if (val + "" !== binding.oldValue) {
                        try {
                            binding.setter(val)
                        } catch (ex) {
                            log(ex)
                        }
                    }
                })
                bound("datasetchanged", function (e) {
                    if (e.bubble === "selectDuplex") {
                        var value = binding._value
                        var curValue = Array.isArray(value) ? value.map(String) : value + ""
                        avalon(elem).val(curValue)
                        elem.oldValue = curValue + ""
                        callback.call(elem, curValue)
                    }
                })
                break
        }
        if (binding.xtype === "input" && !rnoduplexInput.test(elem.type)) {
            if (elem.type !== "hidden") {
                bound("focus", function () {
                    elem.msFocus = true
                })
                bound("blur", function () {
                    elem.msFocus = false
                })
            }
            elem.avalonSetter = updateVModel //#765
            watchValueInTimer(function () {
                if (root.contains(elem)) {
                    if (!elem.msFocus) {
                        updateVModel()
                    }
                } else if (!elem.msRetain) {
                    return false
                }
            })
        }

    },
    update: function (value) {
        var elem = this.element, binding = this, curValue
        if (!this.init) {
            for (var i in avalon.vmodels) {
                var v = avalon.vmodels[i]
                v.$fire("avalon-ms-duplex-init", binding)
            }
            var cpipe = binding.pipe || (binding.pipe = pipe)
            cpipe(null, binding, "init")
            this.init = 1
        }
        switch (this.xtype) {
            case "input":
            case "change":
                curValue = this.pipe(value, this, "set")  //fix #673
                if (curValue !== this.oldValue) {
                    var fixCaret = false
                    if (elem.msFocus) {
                        try {
                            var start = elem.selectionStart
                            var end = elem.selectionEnd
                            if (start === end) {
                                var pos = start
                                fixCaret = true
                            }
                        } catch (e) {
                        }
                    }
                    elem.value = this.oldValue = curValue
                    if (fixCaret && !elem.readOnly) {
                        elem.selectionStart = elem.selectionEnd = pos
                    }
                }
                break
            case "radio":
                curValue = binding.isChecked ? !!value : value + "" === elem.value
                elem.checked = curValue
                break
            case "checkbox":
                var array = [].concat(value) //强制转换为数组
                curValue = this.pipe(elem.value, this, "get")
                elem.checked = array.indexOf(curValue) > -1
                break
            case "select":
                //必须变成字符串后才能比较
                binding._value = value
                if (!elem.msHasEvent) {
                    elem.msHasEvent = "selectDuplex"
                    //必须等到其孩子准备好才触发
                } else {
                    avalon.fireDom(elem, "datasetchanged", {
                        bubble: elem.msHasEvent
                    })
                }
                break
        }
    }
})


function fixNull(val) {
    return val == null ? "" : val
}
avalon.duplexHooks = {
    checked: {
        get: function (val, binding) {
            return !binding.oldValue
        }
    },
    string: {
        get: function (val) { //同步到VM
            return val
        },
        set: fixNull
    },
    "boolean": {
        get: function (val) {
            return val === "true"
        },
        set: fixNull
    },
    number: {
        get: function (val, binding) {
            var number = parseFloat(val)
            if (-val === -number) {
                return number
            }
            var arr = /strong|medium|weak/.exec(binding.element.getAttribute("data-duplex-number")) || ["medium"]
            switch (arr[0]) {
                case "strong":
                    return 0
                case "medium":
                    return val === "" ? "" : 0
                case "weak":
                    return val
            }
        },
        set: fixNull
    }
}

function pipe(val, binding, action, e) {
    binding.param.replace(rw20g, function (name) {
        var hook = avalon.duplexHooks[name]
        if (hook && typeof hook[action] === "function") {
            val = hook[action](val, binding)
        }
    })
    return val
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

var watchValueInTimer = noop
new function () { // jshint ignore:line
    try { //#272 IE9-IE11, firefox
        var setters = {}
        var aproto = HTMLInputElement.prototype
        var bproto = HTMLTextAreaElement.prototype
        function newSetter(value) { // jshint ignore:line
            setters[this.tagName].call(this, value)
            if (!this.msFocus && this.avalonSetter) {
                this.avalonSetter()
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
} // jshint ignore:line

avalon.directive("effect", {
    priority: 5,
    init: function (binding) {
        var text = binding.expr,
                className,
                rightExpr
        var colonIndex = text.replace(rexprg, function (a) {
            return a.replace(/./g, "0")
        }).indexOf(":") //取得第一个冒号的位置
        if (colonIndex === -1) { // 比如 ms-class/effect="aaa bbb ccc" 的情况
            className = text
            rightExpr = true
        } else { // 比如 ms-class/effect-1="ui-state-active:checked" 的情况
            className = text.slice(0, colonIndex)
            rightExpr = text.slice(colonIndex + 1)
        }
        if (!rexpr.test(text)) {
            className = quote(className)
        } else {
            className = normalizeExpr(className)
        }
        binding.expr = "[" + className + "," + rightExpr + "]"
    },
    update: function (arr) {
        var name = arr[0]
        var elem = this.element
        if (elem.getAttribute("data-effect-name") === name) {
            return
        } else {
            elem.removeAttribute("data-effect-driver")
        }
        var inlineStyles = elem.style
        var computedStyles = window.getComputedStyle ? window.getComputedStyle(elem) : null
        var useAni = false
        if (computedStyles && (supportTransition || supportAnimation)) {

            //如果支持CSS动画
            var duration = inlineStyles[transitionDuration] || computedStyles[transitionDuration]
            if (duration && duration !== '0s') {
                elem.setAttribute("data-effect-driver", "t")
                useAni = true
            }

            if (!useAni) {

                duration = inlineStyles[animationDuration] || computedStyles[animationDuration]
                if (duration && duration !== '0s') {
                    elem.setAttribute("data-effect-driver", "a")
                    useAni = true
                }

            }
        }

        if (!useAni) {
            if (avalon.effects[name]) {
                elem.setAttribute("data-effect-driver", "j")
                useAni = true
            }
        }
        if (useAni) {
            elem.setAttribute("data-effect-name", name)
        }
    }
})

avalon.effects = {}
avalon.effect = function (name, callbacks) {
    avalon.effects[name] = callbacks
}



var supportTransition = false
var supportAnimation = false

var transitionEndEvent
var animationEndEvent
var transitionDuration = avalon.cssName("transition-duration")
var animationDuration = avalon.cssName("animation-duration")
new function () {// jshint ignore:line
    var checker = {
        'TransitionEvent': 'transitionend',
        'WebKitTransitionEvent': 'webkitTransitionEnd',
        'OTransitionEvent': 'oTransitionEnd',
        'otransitionEvent': 'otransitionEnd'
    }
    var tran
    //有的浏览器同时支持私有实现与标准写法，比如webkit支持前两种，Opera支持1、3、4
    for (var name in checker) {
        if (window[name]) {
            tran = checker[name]
            break;
        }
        try {
            var a = document.createEvent(name);
            tran = checker[name]
            break;
        } catch (e) {
        }
    }
    if (typeof tran === "string") {
        supportTransition = true
        transitionEndEvent = tran
    }

    //大致上有两种选择
    //IE10+, Firefox 16+ & Opera 12.1+: animationend
    //Chrome/Safari: webkitAnimationEnd
    //http://blogs.msdn.com/b/davrous/archive/2011/12/06/introduction-to-css3-animat ions.aspx
    //IE10也可以使用MSAnimationEnd监听，但是回调里的事件 type依然为animationend
    //  el.addEventListener("MSAnimationEnd", function(e) {
    //     alert(e.type)// animationend！！！
    // })
    checker = {
        'AnimationEvent': 'animationend',
        'WebKitAnimationEvent': 'webkitAnimationEnd'
    }
    var ani;
    for (name in checker) {
        if (window[name]) {
            ani = checker[name];
            break;
        }
    }
    if (typeof ani === "string") {
        supportTransition = true
        animationEndEvent = ani
    }

}()

var effectPool = []//重复利用动画实例
function effectFactory(el, opts) {
    if (!el || el.nodeType !== 1) {
        return null
    }
    if (opts) {
        var name = opts.effectName
        var driver = opts.effectDriver
    } else {
        name = el.getAttribute("data-effect-name")
        driver = el.getAttribute("data-effect-driver")
    }
    if (!name || !driver) {
        return null
    }

    var instance = effectPool.pop() || new Effect()
    instance.el = el
    instance.driver = driver
    instance.useCss = driver !== "j"
    if (instance.useCss) {
        opts && avalon(el).addClass(opts.effectClass)
        instance.cssEvent = driver === "t" ? transitionEndEvent : animationEndEvent
    }
    instance.name = name
    instance.callbacks = avalon.effects[name] || {}

    return instance


}

function effectBinding(elem, binding) {
    var name = elem.getAttribute("data-effect-name")
    if (name) {
        binding.effectName = name
        binding.effectDriver = elem.getAttribute("data-effect-driver")
        var stagger = +elem.getAttribute("data-effect-stagger")
        binding.effectLeaveStagger = +elem.getAttribute("data-effect-leave-stagger") || stagger
        binding.effectEnterStagger = +elem.getAttribute("data-effect-enter-stagger") || stagger
        binding.effectClass = elem.className || NaN
    }
}
function upperFirstChar(str) {
    return str.replace(/^[\S]/g, function (m) {
        return m.toUpperCase()
    })
}
var effectBuffer = new Buffer()
function Effect() {
}//动画实例,做成类的形式,是为了共用所有原型方法

Effect.prototype = {
    contrustor: Effect,
    enterClass: function () {
        return getEffectClass(this, "enter")
    },
    leaveClass: function () {
        return getEffectClass(this, "leave")
    },
    // 共享一个函数
    actionFun: function (name, before, after) {
        if (document.hidden) {
            return
        }
        var me = this
        var el = me.el
        var isLeave = name === "leave"
        name = isLeave ? "leave" : "enter"
        var oppositeName = isLeave ? "enter" : "leave"
        callEffectHook(me, "abort" + upperFirstChar(oppositeName))
        callEffectHook(me, "before" + upperFirstChar(name))
        if (!isLeave)
            before(el) //这里可能做插入DOM树的操作,因此必须在修改类名前执行
        var cssCallback = function (cancel) {
            el.removeEventListener(me.cssEvent, me.cssCallback)
            if (isLeave) {
                before(el) //这里可能做移出DOM树操作,因此必须位于动画之后
                avalon(el).removeClass(me.cssClass)
            } else {
                if (me.driver === "a") {
                    avalon(el).removeClass(me.cssClass)
                }
            }
            if (cancel !== true) {
                callEffectHook(me, "after" + upperFirstChar(name))
                after && after(el)
            }
            me.dispose()
        }
        if (me.useCss) {
            if (me.cssCallback) { //如果leave动画还没有完成,立即完成
                me.cssCallback(true)
            }

            me.cssClass = getEffectClass(me, name)
            me.cssCallback = cssCallback

            me.update = function () {
                el.addEventListener(me.cssEvent, me.cssCallback)
                if (!isLeave && me.driver === "t") {//transtion延迟触发
                    avalon(el).removeClass(me.cssClass)
                }
            }
            avalon(el).addClass(me.cssClass)//animation会立即触发

            effectBuffer.render(true)
            effectBuffer.queue.push(me)

        } else {
            callEffectHook(me, name, cssCallback)

        }
    },
    enter: function (before, after) {
        this.actionFun.apply(this, ["enter"].concat(avalon.slice(arguments)))

    },
    leave: function (before, after) {
        this.actionFun.apply(this, ["leave"].concat(avalon.slice(arguments)))

    },
    dispose: function () {//销毁与回收到池子中
        this.update = this.cssCallback = null
        if (effectPool.unshift(this) > 100) {
            effectPool.pop()
        }
    }


}


function getEffectClass(instance, type) {
    var a = instance.callbacks[type + "Class"]
    if (typeof a === "string")
        return a
    if (typeof a === "function")
        return a()
    return instance.name + "-" + type
}


function callEffectHook(effect, name, cb) {
    var hook = effect.callbacks[name]
    if (hook) {
        hook.call(effect, effect.el, cb)
    }
}

var applyEffect = function (el, dir/*[before, [after, [opts]]]*/) {
    var args = aslice.call(arguments, 0)
    if (typeof args[2] !== "function") {
        args.splice(2, 0, noop)
    }
    if (typeof args[3] !== "function") {
        args.splice(3, 0, noop)
    }
    var before = args[2]
    var after = args[3]
    var opts = args[4]
    var effect = effectFactory(el, opts)
    if (!effect) {
        before()
        after()
        return false
    } else {
        var method = dir ? 'enter' : 'leave'
        effect[method](before, after)
    }
}

avalon.mix(avalon.effect, {
    apply: applyEffect,
    append: function (el, parent, after, opts) {
        return applyEffect(el, 1, function () {
            parent.appendChild(el)
        }, after, opts)
    },
    before: function (el, target, after, opts) {
        return applyEffect(el, 1, function () {
            target.parentNode.insertBefore(el, target)
        }, after, opts)
    },
    remove: function (el, parent, after, opts) {
        return applyEffect(el, 0, function () {
            if (el.parentNode === parent)
                parent.removeChild(el)
        }, after, opts)
    }
})

directives["{{}}"] = {
    init: noop,
    change: function (value, binding) {
        binding.array[binding.index] = value
        var nodeValue = binding.array.join("")

        var node = binding.element
        if (nodeValue !== node.nodeValue) {
            node.change = "update"
            node.nodeValue = nodeValue
        }
    }
}
avalon.directive("html", {
    update: function (val) {
        var binding = this
        var elem = this.element
        var isHtmlFilter = elem.nodeType !== 1
        var parent = isHtmlFilter ? elem.parentNode : elem
        if (!parent)
            return
        val = val == null ? "" : val

        if (elem.nodeType === 3) {
            var signature = generateID("html")
            parent.insertBefore(DOC.createComment(signature), elem)
            binding.element = DOC.createComment(signature + ":end")
            parent.replaceChild(binding.element, elem)
            elem = binding.element
        }
        if (typeof val !== "object") {//string, number, boolean
            var fragment = avalon.parseHTML(String(val))
        } else if (val.nodeType === 11) { //将val转换为文档碎片
            fragment = val
        } else if (val.nodeType === 1 || val.item) {
            var nodes = val.nodeType === 1 ? val.childNodes : val.item
            fragment = avalonFragment.cloneNode(true)
            while (nodes[0]) {
                fragment.appendChild(nodes[0])
            }
        }

        nodes = avalon.slice(fragment.childNodes)
        //插入占位符, 如果是过滤器,需要有节制地移除指定的数量,如果是html指令,直接清空
        if (isHtmlFilter) {
            var endValue = elem.nodeValue.slice(0, -4)
            while (true) {
                var node = elem.previousSibling
                if (!node || node.nodeType === 8 && node.nodeValue === endValue) {
                    break
                } else {
                    parent.removeChild(node)
                }
            }
            parent.insertBefore(fragment, elem)
        } else {
            avalon.clearHTML(elem).appendChild(fragment)
        }
        scanNodeArray(nodes, binding.vmodels)
    }
})

avalon.directive("if", {
    priority: 10,
    update: function (val) {
        var binding = this
        var elem = this.element
        var stamp = binding.stamp = +new Date()
        var par
        var after = function () {
            if (stamp !== binding.stamp)
                return
            binding.recoverNode = null
        }
        if (binding.recoverNode)
            binding.recoverNode() // 还原现场，有移动节点的都需要还原现场
        try {
            if (!elem.parentNode)
                return
            par = elem.parentNode
        } catch (e) {
            return
        }
        if (val) { //插回DOM树
            function alway() {// jshint ignore:line
                if (elem.getAttribute(binding.name)) {
                    elem.removeAttribute(binding.name)
                    scanAttr(elem, binding.vmodels)
                }
                binding.rollback = null
            }
            if (elem.nodeType === 8) {
                var keep = binding.keep
                var hasEffect = avalon.effect.apply(keep, 1, function () {
                    if (stamp !== binding.stamp)
                        return
                    elem.parentNode.replaceChild(keep, elem)
                    elem = binding.element = keep //这时可能为null
                    if (keep.getAttribute("_required")) {//#1044
                        elem.required = true
                        elem.removeAttribute("_required")
                    }
                    if (elem.querySelectorAll) {
                        avalon.each(elem.querySelectorAll("[_required=true]"), function (el) {
                            el.required = true
                            el.removeAttribute("_required")
                        })
                    }
                    alway()
                }, after)
                hasEffect = hasEffect === false
            }
            if (!hasEffect)
                alway()
        } else { //移出DOM树，并用注释节点占据原位置
            if (elem.nodeType === 1) {
                if (elem.required === true) {
                    elem.required = false
                    elem.setAttribute("_required", "true")
                }
                try {//如果不支持querySelectorAll或:required,可以直接无视
                    avalon.each(elem.querySelectorAll(":required"), function (el) {
                        elem.required = false
                        el.setAttribute("_required", "true")
                    })
                } catch (e) {
                }

                var node = binding.element = DOC.createComment("ms-if"),
                        pos = elem.nextSibling
                binding.recoverNode = function () {
                    binding.recoverNode = null
                    if (node.parentNode !== par) {
                        par.insertBefore(node, pos)
                        binding.keep = elem
                    }
                }

                avalon.effect.apply(elem, 0, function () {
                    binding.recoverNode = null
                    if (stamp !== binding.stamp)
                        return
                    elem.parentNode.replaceChild(node, elem)
                    binding.keep = elem //元素节点
                    ifGroup.appendChild(elem)
                    binding.rollback = function () {
                        if (elem.parentNode === ifGroup) {
                            ifGroup.removeChild(elem)
                        }
                    }
                }, after)
            }
        }
    }
})

//ms-important绑定已经在scanTag 方法中实现
var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/img
var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

var getXHR = function () {
    return new window.XMLHttpRequest() // jshint ignore:line
}
//将所有远程加载的模板,以字符串形式存放到这里
var templatePool = avalon.templateCache = {}

function getTemplateContainer(binding, id, text) {
    var div = binding.templateCache && binding.templateCache[id]
    if (div) {
        var dom = DOC.createDocumentFragment(),
                firstChild
        while (firstChild = div.firstChild) {
            dom.appendChild(firstChild)
        }
        return dom
    }
    return avalon.parseHTML(text)

}
function nodesToFrag(nodes) {
    var frag = DOC.createDocumentFragment()
    for (var i = 0, len = nodes.length; i < len; i++) {
        frag.appendChild(nodes[i])
    }
    return frag
}
avalon.directive("include", {
    init: directives.attr.init,
    update: function (val) {
        var binding = this
        var elem = this.element
        var vmodels = binding.vmodels
        var rendered = binding.includeRendered
        var effectClass = binding.effectName && binding.effectClass // 是否开启动画
        var templateCache = binding.templateCache // 是否data-include-cache
        var outer = binding.includeReplace // 是否data-include-replace
        var loaded = binding.includeLoaded
        var target = outer ? elem.parentNode : elem
        var _ele = binding._element // data-include-replace binding.element === binding.end

        binding.recoverNodes = binding.recoverNodes || avalon.noop

        var scanTemplate = function (text) {
            var _stamp = binding._stamp = +(new Date()) // 过滤掉频繁操作
            if (loaded) {
                var newText = loaded.apply(target, [text].concat(vmodels))
                if (typeof newText === "string")
                    text = newText
            }
            if (rendered) {
                checkScan(target, function () {
                    rendered.call(target)
                }, NaN)
            }
            var lastID = binding.includeLastID || "_default" // 默认

            binding.includeLastID = val
            var leaveEl = templateCache && templateCache[lastID] || DOC.createElement(elem.tagName || binding._element.tagName) // 创建一个离场元素

            if (effectClass) {
                leaveEl.className = effectClass
                target.insertBefore(leaveEl, binding.start) // 插入到start之前，防止被错误的移动
            }

            // cache or animate，移动节点
            (templateCache || {})[lastID] = leaveEl
            var fragOnDom = binding.recoverNodes() // 恢复动画中的节点
            if (fragOnDom) {
                target.insertBefore(fragOnDom, binding.end)
            }
            while (true) {
                var node = binding.start.nextSibling
                if (node && node !== leaveEl && node !== binding.end) {
                    leaveEl.appendChild(node)
                } else {
                    break
                }
            }

            // 元素退场
            avalon.effect.remove(leaveEl, target, function () {
                if (templateCache) { // write cache
                    if (_stamp === binding._stamp)
                        ifGroup.appendChild(leaveEl)
                }
            }, binding)


            var enterEl = target,
                    before = avalon.noop,
                    after = avalon.noop

            var fragment = getTemplateContainer(binding, val, text)
            var nodes = avalon.slice(fragment.childNodes)

            if (outer && effectClass) {
                enterEl = _ele
                enterEl.innerHTML = "" // 清空
                enterEl.setAttribute("ms-skip", "true")
                target.insertBefore(enterEl, binding.end.nextSibling) // 插入到bingding.end之后避免被错误的移动
                before = function () {
                    enterEl.insertBefore(fragment, null) // 插入节点
                }
                after = function () {
                    binding.recoverNodes = avalon.noop
                    if (_stamp === binding._stamp) {
                        fragment = nodesToFrag(nodes)
                        target.insertBefore(fragment, binding.end) // 插入真实element
                        scanNodeArray(nodes, vmodels)
                    }
                    if (enterEl.parentNode === target)
                        target.removeChild(enterEl) // 移除入场动画元素
                }
                binding.recoverNodes = function () {
                    binding.recoverNodes = avalon.noop
                    return nodesToFrag(nodes)
                }
            } else {
                before = function () {//新添加元素的动画
                    target.insertBefore(fragment, binding.end)
                    scanNodeArray(nodes, vmodels)
                }
            }

            avalon.effect.apply(enterEl, "enter", before, after)

        }


        if (binding.param === "src") {
            if (typeof templatePool[val] === "string") {
                avalon.nextTick(function () {
                    scanTemplate(templatePool[val])
                })
            } else if (Array.isArray(templatePool[val])) { //#805 防止在循环绑定中发出许多相同的请求
                templatePool[val].push(scanTemplate)
            } else {
                var xhr = getXHR()
                xhr.onload = function () {
                    var text = xhr.responseText
                    for (var f = 0, fn; fn = templatePool[val][f++]; ) {
                        fn(text)
                    }
                    templatePool[val] = text
                }
                xhr.onerror = function () {
                    log("ms-include load [" + val + "] error")
                }
                templatePool[val] = [scanTemplate]
                xhr.open("GET", val, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send(null)
            }
        } else {
            //IE系列与够新的标准浏览器支持通过ID取得元素（firefox14+）
            //http://tjvantoll.com/2012/07/19/dom-element-references-as-global-variables/
            var el = val && val.nodeType === 1 ? val : DOC.getElementById(val)
            if (el) {
                avalon.nextTick(function () {
                    scanTemplate(el.value || el.innerText || el.innerHTML)
                })
            }
        }
    }
})

var rdash = /\(([^)]*)\)/
var onDir = avalon.directive("on", {
    priority: 3000,
    init: function (binding) {
        var value = binding.expr
        binding.type = "on"
        var eventType = binding.param.replace(/-\d+$/, "") // ms-on-mousemove-10
        if (typeof onDir[eventType + "Hook"] === "function") {
            onDir[eventType + "Hook"](binding)
        }
        if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
            var matched = (value.match(rdash) || ["", ""])[1].trim()
            if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
                value = value.replace(rdash, "")
            }
        }
        binding.expr = value
    },
    update: function (callback) {
        var binding = this
        var elem = this.element
        callback = function (e) {
            var fn = binding.getter || noop
            return fn.apply(this, binding.args.concat(e))
        }
        
        var eventType = binding.param.replace(/-\d+$/, "") // ms-on-mousemove-10
        if (eventType === "scan") {
            callback.call(elem, {
                type: eventType
            })
        } else if (typeof binding.specialBind === "function") {
            binding.specialBind(elem, callback)
        } else {
            var removeFn = avalon.bind(elem, eventType, callback)
        }
        binding.rollback = function () {
            if (typeof binding.specialUnbind === "function") {
                binding.specialUnbind()
            } else {
                avalon.unbind(elem, eventType, removeFn)
            }
        }
    }
})
avalon.directive("repeat", {
    priority: 90,
    init: function (binding) {
        var type = binding.type
        binding.cache = {} //用于存放代理VM
        binding.enterCount = 0

        var elem = binding.element
        if (elem.nodeType === 1) {
            elem.removeAttribute(binding.name)
            effectBinding(elem, binding)
            binding.param = binding.param || "el"
            binding.sortedCallback = getBindingCallback(elem, "data-with-sorted", binding.vmodels)
            var rendered = getBindingCallback(elem, "data-" + type + "-rendered", binding.vmodels)

            var signature = generateID(type)
            var start = DOC.createComment(signature + ":start")
            var end = binding.element = DOC.createComment(signature + ":end")
            binding.signature = signature
            binding.start = start
            binding.template = avalonFragment.cloneNode(false)
            if (type === "repeat") {
                var parent = elem.parentNode
                parent.replaceChild(end, elem)
                parent.insertBefore(start, end)
                binding.template.appendChild(elem)
            } else {
                while (elem.firstChild) {
                    binding.template.appendChild(elem.firstChild)
                }
                elem.appendChild(start)
                elem.appendChild(end)
                parent = elem
            }
            binding.element = end

            if (rendered) {
                var removeFn = avalon.bind(parent, "datasetchanged", function () {
                    rendered.apply(parent, parent.args)
                    avalon.unbind(parent, "datasetchanged", removeFn)
                    parent.msRendered = rendered
                })
            }
        }
    },
    update: function (value, oldValue) {
        var binding = this
        var xtype = this.xtype

        this.enterCount += 1
        var init = !oldValue
        if (init) {
            binding.$outer = {}
            var check0 = "$key"
            var check1 = "$val"
            if (xtype === "array") {
                check0 = "$first"
                check1 = "$last"
            }
            for (var i = 0, v; v = binding.vmodels[i++]; ) {
                if (v.hasOwnProperty(check0) && v.hasOwnProperty(check1)) {
                    binding.$outer = v
                    break
                }
            }
        }
        var track = this.track
        if (binding.sortedCallback) { //如果有回调，则让它们排序
            var keys2 = binding.sortedCallback.call(parent, track)
            if (keys2 && Array.isArray(keys2)) {
                track = keys2
            }
        }

        var action = "move"
        binding.$repeat = value
        var fragments = []
        var transation = init && avalonFragment.cloneNode(false)
        var proxies = []
        var param = this.param
        var retain = avalon.mix({}, this.cache)
        var elem = this.element
        var length = track.length

        var parent = elem.parentNode
        for (i = 0; i < length; i++) {

            var keyOrId = track[i] //array为随机数, object 为keyName
            var proxy = retain[keyOrId]
            if (!proxy) {
                
                proxy = getProxyVM(this)
                proxy.$up = null
                if (xtype === "array") {
                    action = "add"
                    proxy.$id = keyOrId
                    var valueItem = value[i]
                    proxy[param] = valueItem //index
                    if(Object(valueItem) === valueItem){
                        valueItem.$ups = valueItem.$ups || {}
                        valueItem.$ups[param] = proxy
                    }

                } else {
                    action = "append"
                    proxy.$key = keyOrId
                    proxy.$val = value[keyOrId] //key
                }
                this.cache[keyOrId] = proxy
                var node = proxy.$anchor || (proxy.$anchor = elem.cloneNode(false))
                node.nodeValue = this.signature
                shimController(binding, transation, proxy, fragments, init && !binding.effectDriver)
                decorateProxy(proxy, binding, xtype)
            } else {
//                if (xtype === "array") {
//                    proxy[param] = value[i]
//                }
                fragments.push({})
                retain[keyOrId] = true
            }

            //重写proxy
            if (this.enterCount === 1) {//防止多次进入,导致位置不对
                proxy.$active = false
                proxy.$oldIndex = proxy.$index
                proxy.$active = true
                proxy.$index = i

            }

            if (xtype === "array") {
                proxy.$first = i === 0
                proxy.$last = i === length - 1
                // proxy[param] = value[i]
            } else {
                proxy.$val = toJson(value[keyOrId]) //这里是处理vm.object = newObject的情况 
            }
            proxies.push(proxy)
        }
        this.proxies = proxies
        if (init && !binding.effectDriver) {
            parent.insertBefore(transation, elem)
            fragments.forEach(function (fragment) {
                scanNodeArray(fragment.nodes || [], fragment.vmodels)
                //if(fragment.vmodels.length > 2)
                fragment.nodes = fragment.vmodels = null
            })// jshint ignore:line
        } else {

            var staggerIndex = binding.staggerIndex = 0
            for (keyOrId in retain) {
                if (retain[keyOrId] !== true) {

                    action = "del"
                    removeItem(retain[keyOrId].$anchor, binding)
                    // avalon.log("删除", keyOrId)
                    // 相当于delete binding.cache[key]
                    proxyRecycler(this.cache, keyOrId, param)
                    retain[keyOrId] = null
                }
            }

            //  console.log(effectEnterStagger)
            for (i = 0; i < length; i++) {
                proxy = proxies[i]
                keyOrId = xtype === "array" ? proxy.$id : proxy.$key
                var pre = proxies[i - 1]
                var preEl = pre ? pre.$anchor : binding.start
                if (!retain[keyOrId]) {//如果还没有插入到DOM树
                    (function (fragment, preElement) {
                        var nodes = fragment.nodes
                        var vmodels = fragment.vmodels
                        if (nodes) {
                            staggerIndex = mayStaggerAnimate(binding.effectEnterStagger, function () {
                                parent.insertBefore(fragment.content, preElement.nextSibling)
                                scanNodeArray(nodes, vmodels)
                                animateRepeat(nodes, 1, binding)
                            }, staggerIndex)
                        }
                        fragment.nodes = fragment.vmodels = null
                    })(fragments[i], preEl)// jshint ignore:line
                    // avalon.log("插入")

                } else if (proxy.$index !== proxy.$oldIndex) {
                    (function (proxy2, preElement) {
                        staggerIndex = mayStaggerAnimate(binding.effectEnterStagger, function () {
                            var curNode = removeItem(proxy2.$anchor)//如果位置被挪动了
                            var inserted = avalon.slice(curNode.childNodes)
                            parent.insertBefore(curNode, preElement.nextSibling)
                            animateRepeat(inserted, 1, binding)
                        }, staggerIndex)
                    })(proxy, preEl)// jshint ignore:line

                    // avalon.log("移动", proxy.$oldIndex, "-->", proxy.$index)
                }
            }

        }
        if (!value.$track) {//如果是非监控对象,那么就将其$events清空,阻止其持续监听
            for (keyOrId in this.cache) {
                proxyRecycler(this.cache, keyOrId, param)
            }

        }

        //repeat --> duplex
        (function (args) {
            parent.args = args
            if (parent.msRendered) {//第一次事件触发,以后直接调用
                parent.msRendered.apply(parent, args)
            }
        })(kernel.newWatch ? arguments : [action]);
        var id = setTimeout(function () {
            clearTimeout(id)
            //触发上层的select回调及自己的rendered回调
            avalon.fireDom(parent, "datasetchanged", {
                bubble: parent.msHasEvent
            })
        })
        this.enterCount -= 1

    }

})

"with,each".replace(rword, function (name) {
    directives[name] = avalon.mix({}, directives.repeat, {
        priority: 1400
    })
})


function animateRepeat(nodes, isEnter, binding) {
    for (var i = 0, node; node = nodes[i++]; ) {
        if (node.className === binding.effectClass) {
            avalon.effect.apply(node, isEnter, noop, noop, binding)
        }
    }
}

function mayStaggerAnimate(staggerTime, callback, index) {
    if (staggerTime) {
        setTimeout(callback, (++index) * staggerTime)
    } else {
        callback()
    }
    return index
}


function removeItem(node, binding) {
    var fragment = avalonFragment.cloneNode(false)
    var last = node
    var breakText = last.nodeValue
    var staggerIndex = binding && Math.max(+binding.staggerIndex, 0)
    var nodes = avalon.slice(last.parentNode.childNodes)
    var index = nodes.indexOf(last)
    while (true) {
        var pre = nodes[--index] //node.previousSibling
        if (!pre || String(pre.nodeValue).indexOf(breakText) === 0) {
            break
        }

        if (binding && (pre.className === binding.effectClass)) {
            node = pre;
            (function (cur) {
                binding.staggerIndex = mayStaggerAnimate(binding.effectLeaveStagger, function () {
                    avalon.effect.apply(cur, 0, noop, function () {
                        fragment.appendChild(cur)
                    }, binding)
                }, staggerIndex)
            })(pre);// jshint ignore:line
        } else {
            fragment.insertBefore(pre, fragment.firstChild)
        }
    }
    fragment.appendChild(last)
    return fragment
}


function shimController(data, transation, proxy, fragments, init) {
    var content = data.template.cloneNode(true)
    var nodes = avalon.slice(content.childNodes)
    content.appendChild(proxy.$anchor)
    init && transation.appendChild(content)
    var nv = [proxy].concat(data.vmodels)
    var fragment = {
        nodes: nodes,
        vmodels: nv,
        content: content
    }
    fragments.push(fragment)
}
// {}  -->  {xx: 0, yy: 1, zz: 2} add
// {xx: 0, yy: 1, zz: 2}  -->  {xx: 0, yy: 1, zz: 2, uu: 3}
// [xx: 0, yy: 1, zz: 2}  -->  {xx: 0, zz: 1, yy: 2}

function getProxyVM(binding) {
    var agent = binding.xtype === "object" ? withProxyAgent : eachProxyAgent
    var proxy = agent(binding)
    var node = proxy.$anchor || (proxy.$anchor = binding.element.cloneNode(false))
    node.nodeValue = binding.signature
    proxy.$outer = binding.$outer
    return proxy
}

var eachProxyPool = []

function eachProxyAgent(data, proxy) {
    var itemName = data.param || "el"
    for (var i = 0, n = eachProxyPool.length; i < n; i++) {
        var candidate = eachProxyPool[i]
        if (candidate && candidate.hasOwnProperty(itemName)) {
            eachProxyPool.splice(i, 1)
            proxy = candidate
            break
        }
    }
    if (!proxy) {
        proxy = eachProxyFactory(itemName)
    }
    return proxy
}

function eachProxyFactory(itemName) {
    var source = {
        $outer: {},
        $index: 0,
        $oldIndex: 0,
        $anchor: null,
        //-----
        $first: false,
        $last: false,
        $remove: avalon.noop
    }
    source[itemName] = NaN

    var force = {
        $last: 1,
        $first: 1,
        $index: 1
    }
    force[itemName] = 1
    var proxy = modelFactory(source, {
        force: force
    })
    proxy.$id = generateID("$proxy$each")
    return proxy
}

function decorateProxy(proxy, binding, type) {
    if (type === "array") {
        proxy.$remove = function () {

            binding.$repeat.removeAt(proxy.$index)
        }
        var param = binding.param


        proxy.$watch(param, function (a) {
            var index = proxy.$index
            binding.$repeat[index] = a
        })
    } else {
        proxy.$watch("$val", function fn(a) {
            binding.$repeat[proxy.$key] = a
        })
    }
}

var withProxyPool = []

function withProxyAgent() {
    return withProxyPool.pop() || withProxyFactory()
}

function withProxyFactory() {
    var proxy = modelFactory({
        $key: "",
        $val: NaN,
        $index: 0,
        $oldIndex: 0,
        $outer: {},
        $anchor: null
    }, {
        force: {
            $key: 1,
            $val: 1,
            $index: 1
        }
    })
    proxy.$id = generateID("$proxy$with")
    return proxy
}


function proxyRecycler(cache, key, param) {
    var proxy = cache[key]
    if (proxy) {
        var proxyPool = proxy.$id.indexOf("$proxy$each") === 0 ? eachProxyPool : withProxyPool
        proxy.$outer = {}

        for (var i in proxy.$events) {
            var a = proxy.$events[i]
            if (Array.isArray(a)) {
                a.length = 0
                if (i === param) {
                    proxy[param] = NaN

                } else if (i === "$val") {
                    proxy.$val = NaN
                }
            }
        }

        if (proxyPool.unshift(proxy) > kernel.maxRepeatSize) {
            proxyPool.pop()
        }
        delete cache[key]
    }
}

/*********************************************************************
 *                         各种指令                                  *
 **********************************************************************/

//ms-skip绑定已经在scanTag 方法中实现
avalon.directive("text", {
    update: function (val) {
        var elem = this.element
        val = val == null ? "" : val //不在页面上显示undefined null
        if (elem.nodeType === 3) { //绑定在文本节点上
            try { //IE对游离于DOM树外的节点赋值会报错
                elem.data = val
            } catch (e) {
            }
        } else { //绑定在特性节点上
            elem.textContent = val
        }
    }
})
function parseDisplay(nodeName, val) {
    //用于取得此类标签的默认display值
    var key = "_" + nodeName
    if (!parseDisplay[key]) {
        var node = DOC.createElement(nodeName)
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
/*
 avalon.directive("visible", {
 init: function (binding) {
 effectBinding(binding.element, binding)
 },
 update: function (val) {
 var binding = this, elem = this.element, stamp
 var noEffect = !this.effectName
 if (!this.stamp) {
 stamp = this.stamp = +new Date()
 if (val) {
 elem.style.display = binding.display || ""
 if (avalon(elem).css("display") === "none") {
 elem.style.display = binding.display = parseDisplay(elem.nodeName)
 }
 } else {
 elem.style.display = "none"
 }
 return
 }
 stamp = this.stamp = +new Date()
 if (val) {
 avalon.effect.apply(elem, 1, function () {
 if (stamp !== binding.stamp)
 return
 var driver = elem.getAttribute("data-effect-driver") || "a"
 
 if (noEffect) {//不用动画时走这里
 elem.style.display = binding.display || ""
 }
 // "a", "t"
 if (driver === "a" || driver === "t") {
 if (avalon(elem).css("display") === "none") {
 elem.style.display = binding.display || parseDisplay(elem.nodeName)
 }
 }
 })
 } else {
 avalon.effect.apply(elem, 0, function () {
 if (stamp !== binding.stamp)
 return
 elem.style.display = "none"
 })
 }
 }
 })
 */
avalon.directive("visible", {
    init: noop,
    change: function (val, binding) {
        var elem = binding.element
        if (elem) {
            var change = addHooks(elem, "changeStyles")
            change[this.param] = val
            change = addHooks(elem, "changeHooks")
            change.visible = directives.visible.update
        }
    },
    update: function (elem, vnode) {
        var change = vnode.changeStyles
        
    }
})
/*********************************************************************
 *                             自带过滤器                             *
 **********************************************************************/

var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/ig
var rsanitize = {
    a: /\b(href)\=("javascript[^"]*"|'javascript[^']*')/ig,
    img: /\b(src)\=("javascript[^"]*"|'javascript[^']*')/ig,
    form: /\b(action)\=("javascript[^"]*"|'javascript[^']*')/ig
}
var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
var rnoalphanumeric = /([^\#-~| |!])/g;

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
            toFixedFix = function(n, prec) {
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

var filters = avalon.filters = {
    uppercase: function(str) {
        return str.toUpperCase()
    },
    lowercase: function(str) {
        return str.toLowerCase()
    },
    truncate: function(str, length, truncation) {
        //length，新字符串长度，truncation，新字符串的结尾的字段,返回新字符串
        length = length || 30
        truncation = typeof truncation === "string" ?  truncation : "..." 
        return str.length > length ? str.slice(0, length - truncation.length) + truncation : String(str)
    },
    camelize: camelize,
    //https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
    //    <a href="javasc&NewLine;ript&colon;alert('XSS')">chrome</a> 
    //    <a href="data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==">chrome</a>
    //    <a href="jav	ascript:alert('XSS');">IE67chrome</a>
    //    <a href="jav&#x09;ascript:alert('XSS');">IE67chrome</a>
    //    <a href="jav&#x0A;ascript:alert('XSS');">IE67chrome</a>
    sanitize: function(str) {
        return str.replace(rscripts, "").replace(ropen, function(a, b) {
            var match = a.toLowerCase().match(/<(\w+)\s/)
            if (match) { //处理a标签的href属性，img标签的src属性，form标签的action属性
                var reg = rsanitize[match[1]]
                if (reg) {
                    a = a.replace(reg, function(s, name, value) {
                        var quote = value.charAt(0)
                        return name + "=" + quote + "javascript:void(0)" + quote// jshint ignore:line
                    })
                }
            }
            return a.replace(ron, " ").replace(/\s+/g, " ") //移除onXXX事件
        })
    },
    escape: function(str) {
        //将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
        return String(str).
                replace(/&/g, '&amp;').
                replace(rsurrogate, function(value) {
                    var hi = value.charCodeAt(0)
                    var low = value.charCodeAt(1)
                    return '&#' + (((hi - 0xD800) * 0x400) + (low - 0xDC00) + 0x10000) + ';'
                }).
                replace(rnoalphanumeric, function(value) {
                    return '&#' + value.charCodeAt(0) + ';'
                }).
                replace(/</g, '&lt;').
                replace(/>/g, '&gt;')
    },
    currency: function(amount, symbol, fractionSize) {
        return (symbol || "\uFFE5") + numberFormat(amount, isFinite(fractionSize) ? fractionSize : 2)
    },
    number: numberFormat
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
new function() {// jshint ignore:line
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
        return function(date) {
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
        return function(date, formats) {
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
    filters.date = function(date, format) {
        var locate = filters.date.locate,
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
                trimDate = trimDate.replace(/^(\d+)\D(\d+)\D(\d+)/, function(_, a, b, c) {
                    var array = c.length === 4 ? [c, a, b] : [a, b, c]
                    dateArray[0] = toInt(array[0])     //年
                    dateArray[1] = toInt(array[1]) - 1 //月
                    dateArray[2] = toInt(array[2])     //日
                    return ""
                })
                var dateSetter = oDate.setFullYear
                var timeSetter = oDate.setHours
                trimDate = trimDate.replace(/[T\s](\d+):(\d+):?(\d+)?\.?(\d)?/, function(_, a, b, c, d) {
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
                trimDate = trimDate.replace(/Z|([+-])(\d\d):?(\d\d)/, function(z, symbol, c, d) {
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
        parts.forEach(function(value) {
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
    filters.date.locate = locate
}// jshint ignore:line

/*********************************************************************
 *                    DOMReady                                       *
 **********************************************************************/

var readyList = [],
    isReady
var fireReady = function (fn) {
    isReady = true
    var require = avalon.require
    if (require && require.checkDeps) {
        modules["domReady!"].state = 4
        require.checkDeps()
    }
    while (fn = readyList.shift()) {
        fn(avalon)
    }
}

if (DOC.readyState === "complete") {
    setTimeout(fireReady) //如果在domReady之外加载
} else {
    DOC.addEventListener("DOMContentLoaded", fireReady)
}
window.addEventListener("load", fireReady)
avalon.ready = function (fn) {
    if (!isReady) {
        readyList.push(fn)
    } else {
        fn(avalon)
    }
}

avalon.config({
    loader: true
})
avalon.ready(function () {
    avalon.scan(DOC.body)
})


// Register as a named AMD module, since avalon can be concatenated with other
// files that may use define, but not via a proper concatenation script that
// understands anonymous AMD modules. A named AMD is safest and most robust
// way to register. Lowercase avalon is used because AMD module names are
// derived from file names, and Avalon is normally delivered in a lowercase
// file name. Do this after creating the global so that if an AMD module wants
// to call noConflict to hide this version of avalon, it will work.

// Note that for maximum portability, libraries that are not avalon should
// declare themselves as anonymous modules, and avoid setting a global if an
// AMD loader is present. avalon is a special case. For more information, see
// https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon
    if (typeof define === "function" && define.amd) {
        define("avalon", [], function() {
            return avalon
        })
    }
// Map over avalon in case of overwrite
    var _avalon = window.avalon
    avalon.noConflict = function(deep) {
        if (deep && window.avalon === avalon) {
            window.avalon = _avalon
        }
        return avalon
    }
// Expose avalon identifiers, even in AMD
// and CommonJS for browser emulators
    if (noGlobal === void 0) {
        window.avalon = avalon
    }
    return avalon

}));