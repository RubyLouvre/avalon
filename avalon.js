//==================================================
// avalon 0.82 独立版  by 司徒正美 2013.6.28
// 疑问:
//    什么协议? MIT, (五种开源协议的比较(BSD,Apache,GPL,LGPL,MIThttp://www.awflasher.com/blog/archives/939)
//    依赖情况? 没有任何依赖，可自由搭配jQuery, mass等使用,并不会引发冲突问题
//==================================================
(function(DOC) {
    var Publish = {} //将函数曝光到此对象上，方便访问器收集依赖
    var expose = new Date - 0
    var subscribers = "$" + expose
    //这两个都与计算属性息息相关
    var stopRepeatAssign = false
    var openComputedCollect = false
    var rword = /[^, ]+/g
    var class2type = {}
    var oproto = Object.prototype;
    var ohasOwn = oproto.hasOwnProperty
    var prefix = "ms-"

    var W3C = window.dispatchEvent
    var root = DOC.documentElement
    var serialize = oproto.toString
    var domParser = document.createElement("div")
    var documentFragment = DOC.createDocumentFragment()
    var DONT_ENUM = "propertyIsEnumerable,isPrototypeOf,hasOwnProperty,toLocaleString,toString,valueOf,constructor".split(",")
    "Boolean Number String Function Array Date RegExp Object Error".replace(rword, function(name) {
        class2type["[object " + name + "]"] = name.toLowerCase()
    })
    var rwindow = /^[object (Window|DOMWindow|global)]$/

        function noop() {}

        function log(a) {
            window.console && console.log(a + "")
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
        return obj && obj === obj.window
    }

    function isWindow(obj) {
        return rwindow.test(serialize.call(obj))
    }
    if (isWindow(window)) {
        avalon.isWindow = isWindow
    }
    //判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例。
    avalon.isPlainObject = function(obj) {
        if (this.type(obj) !== "object" || obj.nodeType || this.isWindow(obj)) {
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
    if (/[native code]/.test(Object.getPrototypeOf)) {
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



    avalon.mix({
        rword: rword,
        subscribers: subscribers,
        ui: {},
        log: log,
        slice: W3C ? function(nodes, start, end) {
            return [].slice.call(nodes, start, end);
        } : function(nodes, start, end) {
            var ret = [],
                n = nodes.length;
            if (end === void 0 || typeof end === "number" && isFinite(end)) {
                start = parseInt(start, 10) || 0;
                end = end == void 0 ? n : parseInt(end, 10);
                if (start < 0) {
                    start += n;
                }
                if (end > n) {
                    end = n;
                }
                if (end < 0) {
                    end += n;
                }
                for (var i = start; i < end; ++i) {
                    ret[i - start] = nodes[i];
                }
            }
            return ret;
        },
        noop: noop,
        error: function(str, e) { //如果不用Error对象封装一下，str在控制台下可能会乱码
            throw new(e || Error)(str)
        },
        ready: function(fn) {
            require("ready!", fn)
        },
        oneObject: function(array, val) {
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
        range: function(start, end, step) {
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
        bind: function(el, type, fn, phase) {
            function callback(e) {
                var ex = e.target ? e : fixEvent(e || window.event)
                var ret = fn.call(el, e)
                if (ret === false) {
                    ex.preventDefault()
                    ex.stopPropagation()
                }
                return ret
            }
            if (W3C) { //addEventListener对return false不做处理，需要自己fix
                el.addEventListener(type, callback, !! phase)
            } else {
                try {
                    el.attachEvent("on" + type, callback)
                } catch (e) {}
            }
            return callback
        },
        unbind: W3C ? function(el, type, fn, phase) {
            el.removeEventListener(type, fn || noop, !! phase)
        } : function(el, type, fn) {
            el.detachEvent("on" + type, fn || noop)
        },
        nextTick: function(fn) {
            setTimeout(fn, 0)
        }
    })
    var VMODELS = avalon.vmodels = avalon.models = {}

        function isArraylike(obj) {
            var length = obj.length,
                type = getType(obj)

                if (avalon.isWindow(obj)) {
                    return false
                }

            if (obj.nodeType === 1 && length) {
                return true
            }

            return type === "array" || type !== "function" &&
                (length === 0 ||
                typeof length === "number" && length > 0 && (length - 1) in obj)
        }

        function generateID() {
            //http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
            return "avalon" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
        }

        function forEach(obj, fn) {
            if (obj) { //不能传个null, undefined进来
                var isArray = isArraylike(obj),
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
        log("此方法已废弃,请使用avalon.each")
        forEach(obj, fn)
    }
    avalon.each = forEach
    /*********************************************************************
     *                      模块加载系统                                *
     **********************************************************************/
    var head = DOC.head || DOC.getElementsByTagName("head")[0] //HEAD元素

    var modules = avalon.modules = {
        "ready!": {
            exports: avalon
        }
    }

        function kernel(settings) {
            for (var p in settings) {
                if (!ohasOwn.call(settings, p))
                    continue
                var val = settings[p]
                if (typeof kernel.plugin[p] === "function") {
                    kernel.plugin[p](val)
                } else {
                    kernel[p] = val
                }
            }
            return this
        }

    new function() {
        var loadings = [] //正在加载中的模块列表
        var factorys = [] //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
        var rmakeid = /(#.+|\W)/g //用于处理掉href中的hash与所有特殊符号
        var basepath

        var plugins = {
            js: function(url, shim) {
                var id = cleanUrl(url)
                if (!modules[id]) { //如果之前没有加载过
                    modules[id] = {
                        id: id,
                        parent: parent,
                        exports: {}
                    }
                    if (shim) { //shim机制
                        require(shim.deps || "", function() {
                            loadJS(url, id, function() {
                                modules[id].state = 2
                                modules[id].exports = typeof shim.exports === "function" ?
                                    shim.exports() : window[shim.exports]
                                checkDeps()
                            })
                        })
                    } else {
                        loadJS(url, id)
                    }
                }
                return id
            },
            css: function(url) {
                var id = url.replace(rmakeid, "")
                if (!DOC.getElementById(id)) {
                    var node = DOC.createElement("link")
                    node.rel = "stylesheet"
                    node.href = url
                    node.id = id
                    head.insertBefore(node, head.firstChild)
                }
            },
            alias: function(val) {
                var map = kernel.alias
                for (var c in val) {
                    if (ohasOwn.call(val, c)) {
                        var prevValue = map[c]
                        var currValue = val[c]
                        if (prevValue) {
                            avalon.error("注意" + c + "出经重写过")
                        }
                        map[c] = currValue
                    }
                }
            }
        }
        plugins.css.ext = ".css"
        plugins.js.ext = ".js"
        kernel.plugins = plugins
        kernel.alias = {}

        function cleanUrl(url) {
            return (url || "").replace(/[?#].*/, "")
        }
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
                for (var i = nodes.length, node; node = nodes[--i];) {
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
                loop: for (var i = loadings.length, id; id = loadings[--i];) {
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
                    })
                    log("加载 " + id + " 失败" + onError + " " + (!modules[id].state))
                } else {
                    return true
                }
            }

            function loadResources(url, parent, ret, shim) {
                //1. 特别处理mass|ready标识符
                if (url === "ready!") {
                    return url
                }
                //2. 转化为完整路径
                if (kernel.alias[url]) { //别名机制
                    ret = kernel.alias[url]
                    if (typeof ret === "object") {
                        shim = ret
                        ret = ret.src
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
                    ret += (ret.indexOf("?") === -1 ? "?" : "&") + (new Date - 0)
                }
                return plugin(ret, modules, shim, checkDeps)
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

        window.require = avalon.require = function(list, factory, parent) {
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
                modules[id] = { //创建一个对象,记录模块的加载情况与其他信息
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
        avalon.config = require.config = kernel
        /**
         * 定义模块
         * @param {String} id ? 模块ID
         * @param {Array} deps ? 依赖列表
         * @param {Function} factory 模块工厂
         * @api public
         */
        window.define = require.define = function(id, deps, factory) { //模块名,依赖列表,模块本身
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
            id = modules[id] && modules[id].state >= 1 ? _id : cleanUrl(getCurrentScript())
            factory = args[1]
            factory.id = _id //用于调试
            factory.delay = function(id) {
                args.push(id)
                var isCycle = true
                try {
                    isCycle = checkCycle(modules[id].deps, id)
                } catch (e) {}
                if (isCycle) {
                    avalon.error(id + "模块与之前的某些模块存在循环依赖")
                }
                delete factory.delay //释放内存
                require.apply(null, args) //0,1,2 --> 1,2,0
            }
            if (id) {
                factory.delay(id, args)
            } else { //先进先出
                factorys.push(factory)
            }
        }
        define.amd = modules

        function fireFactory(id, deps, factory) {
            for (var i = 0, array = [], d; d = deps[i++];) {
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
        //============================domReady机制===========================
        var ready = W3C ? "DOMContentLoaded" : "readystatechange"

            function fireReady() {
                modules["ready!"].state = 2
                checkDeps()
                fireReady = noop //隋性函数，防止IE9二次调用_checkDeps
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
            DOC.attachEvent("onreadychange", function() {
                if (DOC.readyState === "complete") {
                    fireReady()
                }
            })
            if (root.doScroll) {
                doScrollCheck()
            }
        }

    }


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
                    for (var i = 0, attr; attr = attrs[i++];) {
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
                    if (type === "number" && !cssNumber[prop]) {
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
    //=============================css相关=======================
    var cssHooks = avalon.cssHooks = {}
    var prefixes = ['', '-webkit-', '-o-', '-moz-', '-ms-']
    var cssMap = {
        "float": 'cssFloat' in root.style ? 'cssFloat' : 'styleFloat',
        background: "backgroundColor"
    }
    var cssNumber = avalon.oneObject("columnCount,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom")

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
            var ret = cssHooks["@:get"](node, "opacity");
            return ret === "" ? "1" : ret;
        }
    } else {
        var rnumnonpx = /^-?(?:\d*\.)?\d+(?!px)[^\d\s]+$/i
        var rposition = /^(top|right|bottom|left)$/
        var ie8 = !! window.XDomainRequest
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
        cssHooks["opacity:set"] = function(node, value) {
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
            var val = node.attributes.value
            //黑莓手机4.7下val会返回undefined,但我们依然可用node.value取值
            return !val || val.specified ? node.value : node.text
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
            for (var i = 0, el; el = node.options[i++];) {
                el.selected = !! ~values.indexOf(getter(el))
            }
            if (!values.length) {
                node.selectedIndex = -1
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
                for (var i = 0; key = DONT_ENUM[i++];) {
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
            return getType(a) === "array"
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
    if (![].map) {
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
    /*********************************************************************
     *                          数组增强                        *
     **********************************************************************/
    avalon.Array = {
        sortBy: function(target, fn, scope) {
            //根据指定条件进行排序，通常用于对象数组。
            var array = target.map(function(item, index) {
                return {
                    el: item,
                    re: fn.call(scope, item, index)
                }
            }).sort(function(left, right) {
                var a = left.re,
                    b = right.re
                return a < b ? -1 : a > b ? 1 : 0
            })
            return avalon.Array.pluck(array, 'el')
        },
        pluck: function(target, name) {
            //取得对象数组的每个元素的指定属性，组成数组返回。
            return target.filter(function(item) {
                return item[name] != null
            })
        },
        ensure: function(target) {
            //只有当前数组不存在此元素时只添加它
            var args = [].slice.call(arguments, 1)
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
            var args = [].slice.call(arguments, 1)
            for (var i = 0, callback; callback = callbacks[i++];) {
                callback.apply(this, args)
            }
            for (var i = 0, callback; callback = all[i++];) {
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
    var systemOne = avalon.oneObject("$index,$remove,$first,$last")
    var watchOne = avalon.oneObject("$id,$skipArray,$watch,$unwatch,$fire,$events,$json,$model")

        function modelFactory(scope, model, isArray) {
            if (isArray) {
                return Collection(scope)
            }
            var skipArray = scope.$skipArray, //要忽略监控的属性名列表
                vmodel = {},
                Descriptions = {}, //内部用于转换的对象
                callSetters = [],
                callGetters = [],
                VBPublics = Object.keys(watchOne) //用于IE6-8
                model = model || {}
            skipArray = Array.isArray(skipArray) ? skipArray.concat(VBPublics) : VBPublics

            function loop(name, value) {
                if (!watchOne[name]) {
                    model[name] = value
                }
                var valueType = getType(value)
                if (valueType === "function") {
                    VBPublics.push(name) //函数无需要转换
                } else {
                    if (skipArray.indexOf(name) !== -1) {
                        return VBPublics.push(name)
                    }
                    if (name.charAt(0) === "$" && !systemOne[name]) {
                        return VBPublics.push(name)
                    }
                    var accessor, oldArgs
                    if (valueType === "object" && typeof value.get === "function" && Object.keys(value).length <= 2) {
                        var setter = value.set,
                            getter = value.get
                            accessor = function(neo) { //创建计算属性
                                if (arguments.length) {
                                    if (stopRepeatAssign) {
                                        return //阻止重复赋值
                                    }
                                    if (typeof setter === "function") {
                                        setter.call(vmodel, neo)
                                    }
                                    if (oldArgs !== neo) { //由于VBS对象不能用Object.prototype.toString来判定类型，我们就不做严密的检测
                                        oldArgs = neo
                                        notifySubscribers(accessor) //通知顶层改变
                                        vmodel.$events && vmodel.$fire(name, neo, value)
                                    }
                                } else {
                                    if (openComputedCollect || !accessor.locked) {
                                        collectSubscribers(accessor)
                                    }
                                    return value = model[name] = getter.call(vmodel) //保存新值到model[name]
                                }
                            }
                        accessor.nick = name
                        callGetters.push(accessor)
                    } else {
                        value = NaN
                        callSetters.push(name)
                        accessor = function(neo) { //创建监控属性或数组
                            if (arguments.length) {
                                if (stopRepeatAssign) {
                                    return //阻止重复赋值
                                }
                                if (value !== neo) {
                                    var old = value
                                    if (valueType === "array" || valueType === "object") {
                                        if (value && value.$id) {
                                            updateViewModel(value, neo, Array.isArray(neo))
                                        } else if (Array.isArray(neo)) {
                                            value = Collection(neo, vmodel, name)
                                        } else {
                                            value = modelFactory(neo, neo)
                                        }
                                    } else {
                                        value = neo
                                    }
                                    model[name] = value && value.$id ? value.$model : value
                                    notifySubscribers(accessor) //通知顶层改变
                                    vmodel.$events && vmodel.$fire(name, value, old)
                                }
                            } else {
                                collectSubscribers(accessor) //收集视图函数
                                return value
                            }
                        }
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

            vmodel = defineProperties(vmodel, Descriptions, VBPublics)
            VBPublics.forEach(function(name) {
                if (!watchOne[name]) {
                    vmodel[name] = scope[name]
                }
            })
            callSetters.forEach(function(prop) {
                vmodel[prop] = scope[prop] //为空对象赋值
            })
            callGetters.forEach(function(fn) {
                Publish[expose] = fn
                callSetters = vmodel[fn.nick]
                fn.locked = 1
                delete Publish[expose]
            })
            vmodel.$model = vmodel.$json = model
            vmodel.$events = {} //VB对象的方法里的this并不指向自身，需要使用bind处理一下
            vmodel.$watch = Observable.$watch.bind(vmodel)
            vmodel.$unwatch = Observable.$unwatch.bind(vmodel)
            vmodel.$fire = Observable.$fire.bind(vmodel)
            vmodel.$id = generateID()
            vmodel.hasOwnProperty = function(name) {
                return name in vmodel.$model
            }
            return vmodel
        }
    var defineProperty = Object.defineProperty
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
                    "\tPublic Property Let [" + name + "](val)", //setter
                    "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
                        "\tEnd Property",
                        "\tPublic Property Set [" + name + "](val)", //setter
                    "\t\tCall [__proxy__]([__data__], \"" + name + "\", val)",
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
            window.parseVB(buffer.join("\r\n"))

            var model = window[className + "Factory"](description, VBMediator)
            return model
        }
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
            var args = [].slice.call(arguments, 1)
            var safelist = list.concat()
            for (var i = 0, fn; fn = safelist[i++];) {
                el = fn.element
                if (el && (!el.noRemove) && (el.sourceIndex === 0 || el.parentNode === null)) {
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

    function scanNodes(parent, vmodels, callback) {
        var nodes = []
        for (var i = 0, node; node = parent.childNodes[i++];) {
            nodes.push(node);
        }
        callback && callback();
        for (var i = 0; node = nodes[i++];) {
            if (node.nodeType === 1) {
                scanTag(node, vmodels) //扫描元素节点
            } else if (node.nodeType === 3) {
                scanText(node, vmodels) //扫描文本节点
            }
        }
    }
    var regbind = /\{\{[^}]*\}\}|\sms-/
    var stopScan = avalon.oneObject("area,base,basefont,br,col,hr,img,input,link,meta,param,embed,wbr,script,style,textarea")


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
            if (!stopScan[elem.tagName] && regbind.test(elem.innerHTML)) {
                scanNodes(elem, vmodels)
            }
        }
        //扫描元素节点中直属的文本节点，并进行抽取
    var regOpenTag = /([^{]*)\{\{/
    var regCloseTag = /([^}]*)\}\}/

        function scanText(textNode, vmodels) {
            var bindings = extractTextBindings(textNode)
            if (bindings.length) {
                executeBindings(bindings, vmodels)
            }
        }

        function hasExpr(value) {
            var index = value.indexOf("{{")
            return index !== -1 && index < value.indexOf("}}")
        }

        function scanExpr(value) {
            var tokens = []
            if (hasExpr(value)) {
                //抽取{{ }} 里面的语句，并以它们为定界符，拆分原来的文本
                do {
                    value = value.replace(regOpenTag, function(a, b) {
                        if (b) {
                            tokens.push({
                                value: b,
                                expr: false
                            })
                        }
                        return ""
                    })
                    value = value.replace(regCloseTag, function(a, b) {
                        if (b) {
                            var leach = []
                            if (b.indexOf("|") > 0) { // 注意排除短路与
                                b = b.replace(/[^|]\|\s*(\w+)\s*(\([^)]+\))?/g, function(c, d, e) {
                                    leach.push(d + (e || ""))
                                    return ""
                                })
                            }
                            tokens.push({
                                value: b,
                                expr: true,
                                filters: leach.length ? leach : void 0
                            })
                        }
                        return ""
                    })
                } while (hasExpr(value))
                if (value) {
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
            for (var i = 0, attr; attr = el.attributes[i++];) {
                if (attr.specified) {
                    var isBinding = false
                    if (attr.name.indexOf(prefix) !== -1) {
                        //如果是以指定前缀命名的
                        var type = attr.name.replace(prefix, "")
                        if (type.indexOf("-") > 0) { //如果还指定了参数
                            var args = type.split("-")
                            type = args.shift()
                        }
                        isBinding = typeof bindingHandlers[type] === "function"
                    } else if (/\{\{[^}]*\}\}/.test(attr.value)) {
                        type = isBinding = "attr"
                    }
                    if (isBinding) {
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
            executeBindings(bindings, vmodels)
        }

        function executeBindings(bindings, vmodels) {
            bindings.forEach(function(data) {
                bindingHandlers[data.type](data, vmodels) //avalon.mix({},data)
                if (data.remove) { //移除数据绑定，防止被二次解析
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
    var rkeywords = new RegExp(["\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b"].join('|'), 'g');
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
    };

    //添加赋值语句

    function addAssign(vars, scope, name) {
        var ret = [],
            prefix = " = " + name + "."
        for (var i = vars.length; name = vars[--i];) {
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
            if (!uniq[vm ? el.$id : el]) {
                uniq[vm ? el.$id : el] = 1
                return true;
            }
            return false
        })
    }
    //取得求值函数及其传参
    var rprops = /(^\w[\w.]*\w$|^\w+$)/ //"aaa.eee.eee" "a" "eer"

        function parseExpr(code, scopes, data) {
            if (scopes.length == 1 && rprops.test(code)) {
                var fn = Function("vm" + expose, "if(arguments.length === 2){\n vm" +
                    expose + "." + code + " = arguments[1]\n }else{\nreturn vm" + expose + "." + code + "\n}")
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
                        for (var i = 0, fname; fname = data.filters[i++];) {
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
                    code = "\nreturn " + code
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
                array = parseExpr(text, scopes, data)
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
                        for (var i = 0, el; el = a[i++];) {
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
                return "eval(" + text + ")"
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
         *                         Bind                                    *
         **********************************************************************/
        //将视图中的需要局部刷新的部分与ViewModel用绑定处理函数连结在一起,生成updateView函数,
        //而它内部调用着之前编译好的函数compileFn，双向产生依赖，成为双向绑定链的最顶层

        //on binding相关

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
        //visible binding相关
    var cacheDisplay = avalon.oneObject("a,abbr,b,span,strong,em,font,i,kbd", "inline")
    avalon.mix(cacheDisplay, avalon.oneObject("div,h1,h2,h3,h4,h5,h6,section,p", "block"))

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

    domParser.setAttribute("className", "t")
    var fuckIEAttr = domParser.className === "t"
    var propMap = {
        "class": "className",
        "for": "htmlFor"
    }
    var bindingHandlers = avalon.bindingHandlers = {
        "if": function(data, vmodels) {
            var placehoder = DOC.createComment("@")
            var parent = data.element.parentNode
            watchView(data.value, vmodels, data, function(val, elem) {

                if (val) { //添加 如果它不在DOM树中
                    if (!elem.parentNode || elem.parentNode.nodeType === 11) {
                        parent.replaceChild(elem, placehoder)
                        elem.noRemove = 0
                    }
                } else { //移除  如果它还在DOM树中
                    if (elem.parentNode && elem.parentNode.nodeType === 1) {
                        parent.replaceChild(placehoder, elem)
                        elem.noRemove = 1
                    }
                }
            })
        },
        "template": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
                var id = data.args.join("-"),
                    el = DOC.getElementById(id)
                    if (el && val.$model) { //id为一个设置了type="ms"的script标签
                        avalon.nextTick(function() {
                            elem.innerHTML = el.text
                            avalon.scan(elem, val)
                        })
                    }
            })
        },
        "attr": function(data, vmodels) {
            data.remove = false
            watchView(data.value, vmodels, data, function(val, elem) {
                var attrName = data.node.name
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
            watchView(data.value, vmodels, data, function(val) {
                data.node.nodeValue = val
            })
        },
        //控制元素显示或隐藏
        "visible": function(data, vmodels) {
            var elem = data.element
            var display = avalon(elem).css("display")
            display = display === "none" ? parseDisplay(elem.tagName) : display
            watchView(data.value, vmodels, data, function(val) {
                elem.style.display = val ? display : "none"
            })
        },
        //这是一个字符串属性绑定的范本, 方便你在title, alt,  src, href添加插值表达式
        //<a href="{{url.hostname}}/{{url.pathname}}.html">
        "href": function(data, vmodels) {
            //如果没有则说明是使用ng-href的形式
            var text = data.value.trim()
            var simple = true
            var name = data.type
            if (text.indexOf("{{") > -1 && text.indexOf("}}") > 2) {
                simple = false
                if (/^\{\{([^}]+)\}\}$/.test(text)) {
                    simple = true
                    text = RegExp.$1
                }
            }
            watchView(text, vmodels, data, function(val, elem) {
                if (name === "css") {
                    avalon(elem).css(data.args.join("-"), val)
                } else {
                    elem[name] = val
                }
            }, simple ? null : scanExpr(data.value))
        },
        //这是一个布尔属性绑定的范本，布尔属性插值要求整个都是一个插值表达式，用{{}}包起来
        //布尔属性在IE下无法取得原来的字符串值，变成一个布尔，因此需要用ng-disabled
        "disabled": function(data, vmodels) {
            var name = data.type,
                propName = name === "readonly" ? "readOnly" : name
                watchView(data.value, vmodels, data, function(val, elem) {
                    elem[propName] = !! val
                })
        },
        //ms-bind-name="callback",绑定一个属性，当属性变化时执行对应的回调，this为绑定元素
        "bind": function(data, vmodels) {
            var fn = data.value.trim(),
                name = data.args[0]
            for (var i = 0, vm; vm = vmodels[i++];) {
                if (vm.hasOwnProperty(fn)) {
                    fn = vm[fn]
                    break
                }
            }
            if (typeof fn === "function") {
                vm.$watch(name, function(neo, old) {
                    fn.call(data.element, neo, old)
                })
            }
        },
        //切换类名，有三种形式
        //1、ms-class-xxx="flag" 根据flag的值决定是添加或删除类名xxx 
        //2、ms-class=obj obj为一个{xxx:true, yyy:false}的对象，根据其值添加或删除其键名
        //3、ms-class=str str是一个类名或多个类名的集合，全部添加
        //http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
        "class": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
                var cls = data.args.join("-")
                if (typeof val === "function") {
                    if (!elem.$vmodels) {
                        elem.$vmodel = elem.$scope = vmodels[0]
                        elem.$vmodels = vmodels
                    }
                    val = val.call(elem)
                }
                avalon(elem).toggleClass(cls, !! val)
            })
        },
        "hover": function(data) {
            var god = avalon(data.element)
            god.bind("mouseenter", function() {
                god.addClass(data.value)
            })
            god.bind("mouseleave", function() {
                god.removeClass(data.value)
            })
        },
        "active": function(data) {
            var elem = data.element
            var god = avalon(elem)
            elem.tabIndex = elem.tabIndex || -1
            god.bind("focus", function() {
                god.addClass(data.value)
            })
            god.bind("blur", function() {
                god.removeClass(data.value)
            })
        },
        "html": function(data, vmodels) {
            watchView(data.value, vmodels, data, function(val, elem) {
                val = val == null ? "" : val + ""
                if (data.replaceNodes) {
                    domParser.innerHTML = val
                    var replaceNodes = []
                    while (domParser.firstChild) {
                        replaceNodes.push(domParser.firstChild)
                        documentFragment.appendChild(domParser.firstChild)
                    }
                    elem.insertBefore(documentFragment, data.replaceNodes[0]);
                    for (var i = 0, node; node = data.replaceNodes[i++];) {
                        elem.removeChild(node)
                    }
                    data.replaceNodes = replaceNodes

                } else {
                    elem.innerHTML = val
                }
            })
        },
        "ui": function(data, vmodels, opts) {
            var uiName = data.value.trim() //此UI的名字
            if (typeof avalon.ui[uiName] === "function") {
                var id = (avalon(data.element).data("id") || "").trim()
                id = id || uiName + setTimeout("1") //ViewModel的$id
                data.element.setAttribute(prefix + "controller", id)
                var optsName = data.args[0] //它的参数对象
                if (optsName) {
                    for (var i = 0, scope; scope = vmodels[i++];) {
                        if (scope.hasOwnProperty(optsName)) {
                            opts = scope[optsName]
                            break
                        }
                    }
                    if (!opts) {
                        for (var i in VMODELS) {
                            scope = VMODELS[i]
                            if (scope.hasOwnProperty(optsName)) {
                                opts = scope[optsName]
                                break
                            }
                        }
                    }
                }

                avalon.ui[uiName](data.element, id, opts)
            }
        }
    }
    /*********************************************************************
     *                         boolean preperty binding            *
     **********************************************************************/
    //与disabled绑定器 用法差不多的其他布尔属性的绑定器
    var bools = "checked,readonly,selected"
    bools.replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.disabled
    })
    bindingHandlers.enabled = function(data, vmodels) {
        watchView(data.value, vmodels, data, function(val, elem) {
            elem.disabled = !val
        })
    }
    /////////////////////////// string preperty binding///////////////////////////
    //与href绑定器 用法差不多的其他字符串属性的绑定器
    //建议不要直接在src属性上修改，这样会发出无效的请求，请使用ms-src
    "title,alt,src,value,css".replace(rword, function(name) {
        bindingHandlers[name] = bindingHandlers.href
    })
    /////////////////////////// model binding  ///////////////////////////

    //将模型中的字段与input, textarea的value值关联在一起
    var modelBinding = bindingHandlers.model = function(data, vmodels) {
        var element = data.element
        var tagName = element.tagName
        if (typeof modelBinding[tagName] === "function") {
            var array = parseExpr(data.value, vmodels, data)
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
        if (/^(password|textarea|text)$/.test(type)) {
            var event = element.attributes[prefix + "event"] || {}
            event = event.value
            if (event === "change") {
                avalon.bind(element, event, updateModel)
            } else {
                if (window.addEventListener) { //先执行W3C
                    element.addEventListener("input", updateModel, false)
                } else {
                    element.attachEvent("onpropertychange", updateModel)
                }
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
                element.checked = !! fn(scope)
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
        Publish[expose] = updateView
        updateView.element = element
        updateView()
        delete Publish[expose]
    }
    modelBinding.TEXTAREA = modelBinding.INPUT
    //////////////////////////// 常用事件 binding  ////////////////////////
    "dblclick,mouseout,click,mouseover,mouseenter,mouseleave,mousemove,mousedown,mouseup,keypress,keydown,keyup,blur,focus,change".
    replace(rword, function(name) {
        bindingHandlers[name] = function(data) {
            data.args = [name]
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
    /**用于同步集合中的每个元素对应的模型
     *@param val {Any} 集合中的某个元素，可以是一个VM，也可以是一个普通对象，或者说简单的数据类型，
     *@param i {Number} 元素对应的索引值
     **/

    function syncModel(val, i) {
        var type = getType(val)
        if (type === "array" || type === "object") {
            val = val.$id ? val : modelFactory(val, val, type === "array")
            this[i] = val.$model
        }
        return val
    }

    function Collection(list, model, prop) {
        var collection = list.map(syncModel, list) //转换里面的元素为VM
        collection.$id = generateID()
        collection[subscribers] = []
        collection.$model = collection.$json = list
        var dynamic = modelFactory({
            length: list.length
        })
        dynamic.$watch("length", function() {
            model && model.$fire(prop + ".length")
        })
        "push,pop,shift,unshift,splice".replace(rword, function(method) {
            collection[method] = function() {
                var len = this.length,
                    ret
                if (/push|unshift|splice/.test(method)) {
                    var margs = [].slice.call(arguments)

                    var vmargs = margs.map(syncModel, margs)

                    list[method].apply(list, arguments)
                    //  console.log(list.join(","))
                    ret = list[method].apply(this, vmargs)
                    notifySubscribers(this, method, vmargs, len)

                } else {
                    list[method].call(this)
                    ret = list[method]()
                    notifySubscribers(this, method, arguments, len)
                }
                dynamic.length = list.length
                return ret
            }
        })
        "sort,reverse".replace(rword, function(method) {
            collection[method] = function() {
                list[method].apply(this, arguments)
                var neo = this.map(function(el) {
                    return el && el.$model ? el.$model : el
                })
                var n = list.length
                for (var i = 0; i < n; i++) {
                    var a = list[i],
                        b = neo[i]
                    if (a !== b) {
                        list.splice(i, 1)
                        list.push(a)
                        notifySubscribers(collection, "reroder", [i])
                        i = i - 1
                    }
                }
                return this
            }
        })
        collection.isCollection = true
        collection.clear = function() {
            this.length = dynamic.length = 0 //清空数组
            notifySubscribers(this, "clear", [])
            return this
        }
        collection.update = function(val) {
            Array.isArray(val) && updateViewModel(this, val, true)
            return this
        }
        collection.sortBy = function(fn, scope) { //按某属性排序
            this.update(avalon.Array.sortBy(list, fn, scope))
            return this
        }
        collection.contains = function(el) { //判定是否包含
            return this.indexOf(el) !== -1
        }
        collection.ensure = function(el) {
            if (!this.contains(el)) { //只有不存在才push
                this.push(el)
            }
            return this
        }
        collection.set = function(index, val) {
            if (index >= 0 && index < this.length) {
                if (/array|object/.test(getType(val))) {
                    model && model.$fire(prop + ".changed")
                    if (val.$model) {
                        val = val.$model
                    }
                    updateViewModel(this[index], val, Array.isArray(val))
                } else if (this[index] !== val) {
                    this[index] = val
                    model && model.$fire(prop + ".changed")
                    notifySubscribers(this, "set", arguments)
                }
            }
            return this
        }
        collection.size = function() { //取得数组长度，这个函数可以同步视图，length不能
            return dynamic.length
        }
        collection.remove = function(item) { //移除第一个等于给定值的元素
            var index = this.indexOf(item)
            return this.removeAt(index)
        }
        collection.removeAt = function(index) { //移除指定索引上的元素
            if (index >= 0 && (index % 1 === 0)) {
                list.splice(index, 1)
                this.splice(index, 1) //DOM操作非常重,因此只有非负整数才删除
                return this
            }
        }
        collection.removeAll = function(all) { //移除N个元素
            if (Array.isArray(all)) {
                all.forEach(function(el) {
                    collection.remove(el)
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
        return collection
    }
    //////////////////////////// each binding  ////////////////////////
    //https://developer.mozilla.org/en-US/docs/DOM/range.deleteContents

    function emptyNode(parent) {
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild)
        }
    }
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
        data.view = view
        data.scopes = vmodels

        function updateListView(method, args, len) {
            var vmodels = updateListView.vmodels
            switch (method) {
                case "reroder":
                    var i = args[0]
                    var a = vmodels.splice(i, 1)
                    vmodels.push(a[0])
                    var frag = getItemView(parent, vmodels, i)
                    parent.appendChild(frag)
                    resetItemIndex(vmodels)
                    break
                case "set":
                    var model = vmodels[args[0]]
                    if (model) {
                        var n = model.$itemName
                        model[n] = args[1]
                    }
                    break
                case "push":
                    //在后面添加
                    forEach(args, function(index, item) {
                        addItemView(len + index, item, list, data, vmodels)
                    })
                    break
                case "unshift":
                    //在前面添加
                    resetItemIndex(vmodels, 0, list.length - len)
                    list.place = parent.firstChild
                    forEach(args, function(index, item) {
                        addItemView(index, item, list, data, vmodels)
                    })
                    list.place = null
                    break
                case "pop":
                    //去掉最后一个
                    var node = getItemView(parent, vmodels, vmodels.length - 1)
                    if (node) {
                        vmodels.pop()
                    }
                    break
                case "shift":
                    //去掉前面一个
                    var node = getItemView(parent, vmodels, 0)
                    if (node) {
                        vmodels.shift()
                        resetItemIndex(vmodels)
                    }
                    break
                case "splice":
                    var start = args[0],
                        second = args[1],
                        adds = [].slice.call(args, 2)
                        var deleteCount = second >= 0 ? second : len - start
                    if (deleteCount) { //连续删除几个
                        var node = getItemView(parent, vmodels, start, deleteCount)
                        if (node) {
                            vmodels.splice(start, deleteCount)
                            resetItemIndex(vmodels, start, start)
                        }
                    }
                    if (adds.length) { //连续添加几个
                        list.place = getIndexItem(parent, vmodels, start)
                        updateListView("push", adds, start)
                        resetItemIndex(vmodels, start, start)
                        list.place = null
                    }
                    break
                case "clear":
                    vmodels.length = 0
                    emptyNode(parent)
                    break
            }
        }
        updateListView.vmodels = []
        if ((list || {}).isCollection) {
            list[subscribers].push(updateListView)
        }
        updateListView("push", list, 0)
    }

    //取得目标子视图的第一个节点

    function getIndexItem(parent, vmodels, index) { //
        var nodes = parent.childNodes
        var length = vmodels.length
        var group = nodes.length / length
        var node = nodes[group * index]
        return node
    }
    //将目标子视图的所有元素转换为一个文档碎片返回

    function getItemView(parent, vmodels, index, number) {
        var nodes = parent.childNodes
        var length = vmodels.length
        var group = nodes.length / length
        var node = nodes[group * index]
        var view = vmodels[index].$view
        var array = [node]
        number = number || 1
        length = group * number
        for (var i = 1; i < length; i++) {
            node = node.nextSibling
            array.push(node)
        }
        for (var i = 0, node; node = array[i++];) {
            view.appendChild(node)
        }
        return view
    }


    function resetItemIndex(vmodels, pos, add) { //重置路标
        pos = pos || 0
        add = add || 0
        for (var el; el = vmodels[pos++];) {
            el.$index = add++
        }
    }


    function addItemView(index, item, list, data, items) {
        var vmodels = data.scopes
        var parent = data.element
        var vmodel = createItemModel(index, item, list, data.args)
        var view = data.view.cloneNode(true)
        vmodels = [vmodel].concat(vmodels)
        items.splice(index, 0, vmodel)
        vmodel.$view = view
        if (!parent.inprocess) {
            parent.inprocess = 1 //locked!
            var hidden = parent.hidden //http://html5accessibility.com/
            parent.hidden = true //作用类似于display:none
        }
        scanNodes(view, vmodels, function() {
            parent.insertBefore(view, list.place || null)
        });
        if (parent.inprocess) {
            parent.hidden = hidden
            parent.inprocess = 0
        }
    }

    //为子视图创建一个ViewModel

    function createItemModel(index, item, list, args) {
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
                return this.$index === list.length - 1
            }
        }
        source.$remove = function() {
            return list.remove(item)
        }
        return modelFactory(source)
    }


    /*********************************************************************
     *                            Filters                              *
     **********************************************************************/
    var filters = avalon.filters = {
        uppercase: function(str) {
            return str.toUpperCase()
        },
        html: function(str) {
            return str
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
        escape: function(target) {
            //将字符串经过 html 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt 
            return target.replace(/&/g, "&amp ").replace(/</g, "&lt ").replace(/>/g, "&gt ").replace(/"/g, "&quot ").replace(/'/g, "&#39 ")
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
                }

                if (getType(date) === "number") {
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

    avalon.ready(function() {
        avalon.scan(document.body)
    })
})(document)
//2012.8.31 完成 v1
//https://github.com/RubyLouvre/mass-Framework/commit/708e203a0e274b69729d08de8fe1cde2722520d2
//2012.9.22 完成 v2 90%代码重写，使用新的思路收集依赖完成双向绑定链
//2012.12.11 完成 v3 50% 代码重写 数据绑定部分焕然一新，属性名得到绑定器，
//2012.12.13 把所有公开API放到MVVM二级命名空间上
//2012.12.15 添加toJS方法，为collection补上sort erase reverse方法
//2013.4,23 v4 https://github.com/RubyLouvre/mass-Framework/blob/1.3/avalon.js
//2013.4.29 合并options与selecting绑定，为each绑定产生的子ViewModel添加$first, $last属性，
//写死它的$index, $remove属性，重构generateID
//2013.4.30 重构scanTag, generateID，更改fixEvent的条件
//2013.5.1 v5 发布 https://github.com/RubyLouvre/mass-Framework/blob/1.4/avalon.js 添加一个jquery like对象
//2013.5.3 v5.1 性能大幅提升 新的路标系统 hidden的运用 重构model绑定的select 重构addItemView
//2013.5.9 v6 添加ms-hover绑定, 重构mouseenter, mouseleave事件，对data方法进行增强
//2013.5.15 v6.1 添加ms-active
//2013.5.21 v6.2 添加$json与多级监听
//2013.5.22 0.6.3 fix getValueFunction bug  fix  avalon.bind return false bug fix ms-css bug
//2013.5.25 0.7 添加template绑定, 优化渲染速度,插入与移除节点的操作
//2013 6 2 3群月王 ms-visible bug
//2013 6 13 073 重构了each绑定,添加了$model,$vmodel属性，移除了options绑定
//2013 6 22 08 添加模块加载功能， 带来avalon.vmodels(原avalon.models), 
//avalon.type( 返回的类型是小写), avalon.isPlainObject, avalon.mix, 
//avvalon.fn.mix(这两个方法与jQuery的extend方法完全一致)，
//avalon.slice(与数组的slice用法一致，但可以切换类数组对象)， require， define全局方法
//重构parser, modelBindings