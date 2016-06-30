/*********************************************************************
 *                      AMD加载器                                     *
 **********************************************************************/

//https://www.devbridge.com/articles/understanding-amd-requirejs/
//http://maxogden.com/nested-dependencies.html
var modules = avalon.modules = {
    "domReady!": {
        exports: avalon,
        state: 3
    },
    "avalon": {
        exports: avalon,
        state: 4
    }
}
//Object(modules[id]).state拥有如下值
// undefined  没有定义
// 1(send)    已经发出请求
// 2(loading) 已经被执行但还没有执行完成，在这个阶段define方法会被执行
// 3(loaded)  执行完毕，通过onload/onreadystatechange回调判定，在这个阶段checkDeps方法会执行
// 4(execute)  其依赖也执行完毕, 值放到exports对象上，在这个阶段fireFactory方法会执行
modules.exports = modules.avalon
var otherRequire = window.require
var otherDefine = window.define
var innerRequire
plugins.loader = function (builtin) {
    var flag = innerRequire && builtin
    window.require = flag ? innerRequire : otherRequire
    window.define = flag ? innerRequire.define : otherDefine
}
new function () { // jshint ignore:line
    var loadings = [] //正在加载中的模块列表
    var factorys = [] //放置define方法的factory函数
    var rjsext = /\.js$/i
    var rquery = /(\?[^#]*)$/
    function makeRequest(name, config) {
        //1. 去掉资源前缀
        var res = "js"
        name = name.replace(/^(\w+)\!/, function (a, b) {
            res = b
            return ""
        })
        if (res === "ready") {
            log("debug: ready!已经被废弃，请使用domReady!")
            res = "domReady"
        }
        //2. 去掉querystring, hash
        var query = ""
        name = name.replace(rquery, function (a) {
            query = a
            return ""
        })
        //3. 去掉扩展名
        var suffix = "." + res
        var ext = /js|css/.test(suffix) ? suffix : ""
        name = name.replace(/\.[a-z0-9]+$/g, function (a) {
            if (a === suffix) {
                ext = a
                return ""
            } else {
                return a
            }
        })
        var req = avalon.mix({
            query: query,
            ext: ext,
            res: res,
            name: name,
            toUrl: toUrl
        }, config)
        req.toUrl(name)
        return req
    }

    function fireRequest(req) {
        var name = req.name
        var res = req.res
        //1. 如果该模块已经发出请求，直接返回
        var module = modules[name]
        var urlNoQuery = name && req.urlNoQuery
        if (module && module.state >= 1) {
            return name
        }
        module = modules[urlNoQuery]
        if (module && module.state >= 3) {
            innerRequire(module.deps || [], module.factory, urlNoQuery)
            return urlNoQuery
        }
        if (name && !module) {
            module = modules[urlNoQuery] = {
                id: urlNoQuery,
                state: 1 //send
            }
            var wrap = function (obj) {
                resources[res] = obj//标识该插件已注册
                obj.load(name, req, function (a) {
                    if (arguments.length && a !== void 0) {
                        module.exports = a
                    }
                    module.state = 4
                    checkDeps()
                })
            }

            if (!resources[res]) {//如果资源插件不存在,先加载插件
                innerRequire([res], wrap)
            } else {
                wrap(resources[res])//使用资源插件的load方法加载我们的模块
            }
        }
        return name ? urlNoQuery : res + "!"
    }

    //核心API之一 require
    var requireQueue = []
    var isUserFirstRequire = false
    innerRequire = avalon.require = function (array, factory, parentUrl, defineConfig) {
        if (!isUserFirstRequire) {
            requireQueue.push(avalon.slice(arguments))
            if (arguments.length <= 2) {
                isUserFirstRequire = true
                var queue = requireQueue.splice(0, requireQueue.length),
                        args
                while (args = queue.shift()) {
                    innerRequire.apply(null, args)
                }
            }
            return
        }

        if (!Array.isArray(array)) {
            avalon.error("require方法的第一个参数应为数组 " + array)
        }
        var deps = [] // 放置所有依赖项的完整路径
        var uniq = {}
        var id = parentUrl || "callback" + setTimeout("1") // jshint ignore:line
        defineConfig = defineConfig || {}
        defineConfig.baseUrl = kernel.baseUrl
        var isBuilt = !!defineConfig.built
        if (parentUrl) {
            defineConfig.parentUrl = parentUrl.substr(0, parentUrl.lastIndexOf("/"))
            defineConfig.mapUrl = parentUrl.replace(rjsext, "")
        }
        if (isBuilt) {
            var req = makeRequest(defineConfig.defineName, defineConfig)
            id = req.urlNoQuery
        } else {
            array.forEach(function (name) {
                var req = makeRequest(name, defineConfig)
                var url = fireRequest(req) //加载资源，并返回该资源的完整地址
                if (url) {
                    if (!uniq[url]) {
                        deps.push(url)
                        uniq[url] = "司徒正美" //去重
                    }
                }
            })
        }

        var module = modules[id]
        if (!module || module.state !== 4) {
            modules[id] = {
                id: id,
                deps: isBuilt ? array.concat() : deps,
                factory: factory || noop,
                state: 3
            }
        }
        if (!module) {
            //如果此模块是定义在另一个JS文件中, 那必须等该文件加载完毕, 才能放到检测列队中
            loadings.push(id)
        }
        checkDeps()
    }

    //核心API之二 require
    innerRequire.define = function (name, deps, factory) { //模块名,依赖列表,模块本身
        if (typeof name !== "string") {
            factory = deps
            deps = name
            name = "anonymous"
        }
        if (!Array.isArray(deps)) {
            factory = deps
            deps = []
        }
        var config = {
            built: !isUserFirstRequire, //用r.js打包后,所有define方法会放到require方法之前()
            defineName: name
        }
        var args = [deps, factory, config]
        factory.require = function (url) {
            args.splice(2, 0, url)
            if (modules[url]) {
                modules[url].state = 3 //loaded
                var isCycle = false
                try {
                    isCycle = checkCycle(modules[url].deps, url)
                } catch (e) {
                }
                if (isCycle) {
                    avalon.error(url + "模块与之前的模块存在循环依赖，请不要直接用script标签引入" + url + "模块")
                }
            }
            delete factory.require //释放内存
            innerRequire.apply(null, args) //0,1,2 --> 1,2,0
        }
        //根据标准,所有遵循W3C标准的浏览器,script标签会按标签的出现顺序执行。
        //老的浏览器中，加载也是按顺序的：一个文件下载完成后，才开始下载下一个文件。
        //较新的浏览器中（IE8+ 、FireFox3.5+ 、Chrome4+ 、Safari4+），为了减小请求时间以优化体验，
        //下载可以是并行的，但是执行顺序还是按照标签出现的顺序。
        //但如果script标签是动态插入的, 就未必按照先请求先执行的原则了,目测只有firefox遵守
        //唯一比较一致的是,IE10+及其他标准浏览器,一旦开始解析脚本, 就会一直堵在那里,直接脚本解析完毕
        //亦即，先进入loading阶段的script标签(模块)必然会先进入loaded阶段
        var url = config.built ? "unknown" : getCurrentScript()
        if (url) {
            var module = modules[url]
            if (module) {
                module.state = 2
            }
            factory.require(url)
        } else { //合并前后的safari，合并后的IE6-9走此分支
            factorys.push(factory)
        }
    }
    //核心API之三 require.config(settings)
    innerRequire.config = kernel
    //核心API之四 define.amd 标识其符合AMD规范
    innerRequire.define.amd = modules

    //==========================对用户配置项进行再加工==========================
    var allpaths = kernel["orig.paths"] = {}
    var allmaps = kernel["orig.map"] = {}
    var allpackages = kernel["packages"] = []
    var allargs = kernel["orig.args"] = {}
    avalon.mix(plugins, {
        paths: function (hash) {
            avalon.mix(allpaths, hash)
            kernel.paths = makeIndexArray(allpaths)
        },
        map: function (hash) {
            avalon.mix(allmaps, hash)
            var list = makeIndexArray(allmaps, 1, 1)
            avalon.each(list, function (_, item) {
                item.val = makeIndexArray(item.val)
            })
            kernel.map = list
        },
        packages: function (array) {
            array = array.concat(allpackages)
            var uniq = {}
            var ret = []
            for (var i = 0, pkg; pkg = array[i++]; ) {
                pkg = typeof pkg === "string" ? {
                    name: pkg
                } : pkg
                var name = pkg.name
                if (!uniq[name]) {
                    var url = joinPath(pkg.location || name, pkg.main || "main")
                    url = url.replace(rjsext, "")
                    ret.push(pkg)
                    uniq[name] = pkg.location = url
                    pkg.reg = makeMatcher(name)
                }
            }
            kernel.packages = ret.sort()
        },
        urlArgs: function (hash) {
            if (typeof hash === "string") {
                hash = {
                    "*": hash
                }
            }
            avalon.mix(allargs, hash)
            kernel.urlArgs = makeIndexArray(allargs, 1)
        },
        baseUrl: function (url) {
            if (!isAbsUrl(url)) {
                var baseElement = head.getElementsByTagName("base")[0]
                if (baseElement) {
                    head.removeChild(baseElement)
                }
                var node = DOC.createElement("a")
                node.href = url
                url = getFullUrl(node, "href")
                if (baseElement) {
                    head.insertBefore(baseElement, head.firstChild)
                }
            }
            if (url.length > 3)
                kernel.baseUrl = url
        },
        shim: function (obj) {
            for (var i in obj) {
                var value = obj[i]
                if (Array.isArray(value)) {
                    value = obj[i] = {
                        deps: value
                    }
                }
                if (!value.exportsFn && (value.exports || value.init)) {
                    value.exportsFn = makeExports(value)
                }
            }
            kernel.shim = obj
        }

    })


    //==============================内部方法=================================
    function checkCycle(deps, nick) {
        //检测是否存在循环依赖
        for (var i = 0, id; id = deps[i++]; ) {
            if (modules[id].state !== 4 &&
                    (id === nick || checkCycle(modules[id].deps, nick))) {
                return true
            }
        }
    }

    function checkFail(node, onError, fuckIE) {
        var id = trimQuery(node.src) //检测是否死链
        node.onload = node.onreadystatechange = node.onerror = null
        if (onError || (fuckIE && modules[id] && !modules[id].state)) {
            setTimeout(function () {
                head.removeChild(node)
                node = null // 处理旧式IE下的循环引用问题
            })
            log("debug: 加载 " + id + " 失败" + onError + " " + (!modules[id].state))
        } else {
            return true
        }
    }

    function checkDeps() {
        //检测此模块的依赖是否都执行完毕,是则执行自身
        loop: for (var i = loadings.length, id; id = loadings[--i]; ) {
            var obj = modules[id],
                    deps = obj.deps
            if (!deps)
                continue
            for (var j = 0, key; key = deps[j]; j++) {
                if (Object(modules[key]).state !== 4) {
                    continue loop
                }
            }
            //如果deps是空对象或者其依赖的模块的状态都是4
            if (obj.state !== 4) {
                loadings.splice(i, 1) //必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
                fireFactory(obj.id, obj.deps, obj.factory)
                checkDeps() //如果成功,则再执行一次,以防有些模块就差本模块没有执行
            }
        }
    }

    var rreadyState = /complete|loaded/

    function loadJS(url, id, callback) {
        //通过script节点加载目标模块
        var node = DOC.createElement("script")

        var supportLoad = "onload" in node
        var onEvent = supportLoad ? "onload" : "onreadystatechange"

        function onload() {
            var factory = factorys.pop()//处理safari早期版本
            factory && factory.require(id)
            if (callback) {
                callback()
            }
            if (checkFail(node, false, !supportLoad)) {
                log("debug: 已成功加载 " + url)
                id && loadings.push(id)
                checkDeps()
            }
        }
        node[onEvent] = supportLoad ? onload : function () {
            if (rreadyState.test(node.readyState)) {
                onload()
            }
        }
        node.onerror = function () {
            checkFail(node, true)
        }
        node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
        node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
        head.insertBefore(node, head.firstChild) //chrome下第二个参数不能为null

        log("debug: 正准备加载 " + url) //更重要的是IE6下可以收窄getCurrentScript的寻找范围
    }

    var resources = innerRequire.plugins = {
        //三大常用资源插件 js!, css!, text!, domReady!
        domReady: {
            load: noop
        },
        js: {
            load: function (name, req, onLoad) {
                var url = req.url
                var id = req.urlNoQuery
                var shim = kernel.shim[name.replace(rjsext, "")]
                if (shim) { //shim机制
                    innerRequire(shim.deps || [], function () {
                        var args = avalon.slice(arguments)
                        loadJS(url, id, function () {
                            onLoad(shim.exportsFn ? shim.exportsFn.apply(0, args) : void 0)
                        })
                    })
                } else {
                    loadJS(url, id)
                }
            }
        },
        css: {
            load: function (name, req, onLoad) {
                var url = req.url
                var node = DOC.createElement("link")
                node.rel = "stylesheet"
                node.href = url
                head.insertBefore(node, head.firstChild)
                log("debug: 已成功加载 " + url)
                onLoad()
            }
        },
        text: {
            load: function (name, req, onLoad) {
                var url = req.url
                var xhr = getXHR()
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        var status = xhr.status;
                        if (status > 399 && status < 600) {
                            avalon.error(url + " 对应资源不存在或没有开启 CORS")
                        } else {
                            log("debug: 已成功加载 " + url)
                            onLoad(xhr.responseText)
                        }
                    }
                }
                var time = "_=" + (new Date() - 0)
                var _url = url.indexOf("?") === -1 ? url + "?" + time : url + "&" + time
                xhr.open("GET", _url, true)
                if ("withCredentials" in xhr) { //这是处理跨域
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest") //告诉后端这是AJAX请求
                xhr.send()
                log("debug: 正准备加载 " + url)
            }
        }
    }
    innerRequire.checkDeps = checkDeps

    function trimQuery(url) {
        return (url || "").replace(rquery, "")
    }

    function isAbsUrl(path) {
        //http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
        return /^(?:[a-z]+:)?\/\//i.test(String(path))
    }

    function getFullUrl(node, src) {
        return "1" [0] ? node[src] : node.getAttribute(src, 4)
    }

    function getCurrentScript() {
        // inspireb by https://github.com/samyk/jiagra/blob/master/jiagra.js
        var stack
        try {
            a.b.c() //强制报错,以便捕获e.stack
        } catch (e) { //safari5的sourceURL，firefox的fileName，它们的效果与e.stack不一样
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
            return trimQuery(stack.replace(/(:\d+)?:\d+$/i, "")) //去掉行号与或许存在的出错字符起始位置
        }
        var nodes = head.getElementsByTagName("script") //只在head标签中寻找
        for (var i = nodes.length, node; node = nodes[--i]; ) {
            if (node.className === subscribers && node.readyState === "interactive") {
                var url = getFullUrl(node, "src")
                return node.className = trimQuery(url)
            }
        }
    }

    var rcallback = /^callback\d+$/

    function fireFactory(id, deps, factory) {
        var module = Object(modules[id])
        module.state = 4
        for (var i = 0, array = [], d; d = deps[i++]; ) {
            if (d === "exports") {
                var obj = module.exports || (module.exports = {})
                array.push(obj)
            } else {
                array.push(modules[d].exports)
            }
        }
        try {
            var ret = factory.apply(window, array)
        } catch (e) {
            log("执行[" + id + "]模块的factory抛错： ", e)
        }
        if (ret !== void 0) {
            modules[id].exports = ret
        }
        modules[id].state = 4
        if (rcallback.test(id)) {
            delete modules[id]
        }
        delete module.factory
        return ret
    }

    function toUrl(id) {
        if (id.indexOf(this.res + "!") === 0) {
            id = id.slice(this.res.length + 1) //处理define("css!style",[], function(){})的情况
        }
        var url = id
        //1. 是否命中paths配置项
        var usePath = 0
        var baseUrl = this.baseUrl
        var rootUrl = this.parentUrl || baseUrl
        eachIndexArray(id, kernel.paths, function (value, key) {
            url = url.replace(key, value)
            usePath = 1
        })
        //2. 是否命中packages配置项
        if (!usePath) {
            eachIndexArray(id, kernel.packages, function (value, key, item) {
                url = url.replace(item.name, item.location)
            })
        }
        //3. 是否命中map配置项
        if (this.mapUrl) {
            eachIndexArray(this.mapUrl, kernel.map, function (array) {
                eachIndexArray(url, array, function (mdValue, mdKey) {
                    url = url.replace(mdKey, mdValue)
                    rootUrl = baseUrl
                })
            })
        }
        var ext = this.ext
        if (ext && usePath && url.slice(-ext.length) === ext) {
            url = url.slice(0, -ext.length)
        }
        //4. 转换为绝对路径
        if (!isAbsUrl(url)) {
            rootUrl = this.built || /^\w/.test(url) ? baseUrl : rootUrl
            url = joinPath(rootUrl, url)
        }
        //5. 还原扩展名，query
        var urlNoQuery = url + ext
        url = urlNoQuery + this.query
        urlNoQuery = url.replace(rquery, function (a) {
            this.query = a
            return ""
        })
        //6. 处理urlArgs
        eachIndexArray(id, kernel.urlArgs, function (value) {
            url += (url.indexOf("?") === -1 ? "?" : "&") + value;
        })
        this.url = url
        return this.urlNoQuery = urlNoQuery
    }

    function makeIndexArray(hash, useStar, part) {
        //创建一个经过特殊算法排好序的数组
        var index = hash2array(hash, useStar, part)
        index.sort(descSorterByName)
        return index
    }

    function makeMatcher(prefix) {
        return new RegExp('^' + prefix + '(/|$)')
    }

    function makeExports(value) {
        return function () {
            var ret
            if (value.init) {
                ret = value.init.apply(window, arguments)
            }
            return ret || (value.exports && getGlobal(value.exports))
        }
    }


    function hash2array(hash, useStar, part) {
        var array = [];
        for (var key in hash) {
            if (ohasOwn.call(hash, key)) {
                var item = {
                    name: key,
                    val: hash[key]
                }
                array.push(item)
                item.reg = key === "*" && useStar ? /^/ : makeMatcher(key)
                if (part && key !== "*") {
                    item.reg = new RegExp('\/' + key.replace(/^\//, "") + '(/|$)')
                }
            }
        }
        return array
    }

    function eachIndexArray(moduleID, array, matcher) {
        array = array || []
        for (var i = 0, el; el = array[i++]; ) {
            if (el.reg.test(moduleID)) {
                matcher(el.val, el.name, el)
                return false
            }
        }
    }
    // 根据元素的name项进行数组字符数逆序的排序函数
    function descSorterByName(a, b) {
        var aaa = a.name
        var bbb = b.name
        if (bbb === "*") {
            return -1
        }
        if (aaa === "*") {
            return 1
        }
        return bbb.length - aaa.length
    }

    var rdeuce = /\/\w+\/\.\./

    function joinPath(a, b) {
        if (a.charAt(a.length - 1) !== "/") {
            a += "/"
        }
        if (b.slice(0, 2) === "./") { //相对于兄弟路径
            return a + b.slice(2)
        }
        if (b.slice(0, 2) === "..") { //相对于父路径
            a += b
            while (rdeuce.test(a)) {
                a = a.replace(rdeuce, "")
            }
            return a
        }
        if (b.slice(0, 1) === "/") {
            return a + b.slice(1)
        }
        return a + b
    }

    function getGlobal(value) {
        if (!value) {
            return value
        }
        var g = window
        value.split(".").forEach(function (part) {
            g = g[part]
        })
        return g
    }

    var mainNode = DOC.scripts[DOC.scripts.length - 1]
    var dataMain = mainNode.getAttribute("data-main")
    if (dataMain) {
        plugins.baseUrl(dataMain)
        var href = kernel.baseUrl
        kernel.baseUrl = href.slice(0, href.lastIndexOf("/") + 1)
        loadJS(href.replace(rjsext, "") + ".js")
    } else {
        var loaderUrl = trimQuery(getFullUrl(mainNode, "src"))
        kernel.baseUrl = loaderUrl.slice(0, loaderUrl.lastIndexOf("/") + 1)
    }
} // jshint ignore:line
