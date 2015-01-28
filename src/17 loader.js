/*********************************************************************
 *                      AMD加载器                                   *
 **********************************************************************/
//https://www.devbridge.com/articles/understanding-amd-requirejs/
//http://maxogden.com/nested-dependencies.html
var modules = avalon.modules = {
    "ready!": {
        exports: avalon
    },
    "avalon": {
        exports: avalon,
        state: 2
    }
}
modules.exports = modules.avalon
new function() {
    var loadings = [] //正在加载中的模块列表
    var factorys = [] //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var rjsext = /\.js$/i
    //核心API之一 require
    innerRequire = avalon.require = function(array, factory, parentUrl) {
        if (!Array.isArray(array)) {
            avalon.error("require的第一个参数必须是依赖列数,类型为数组 " + array)
        }
        var args = [] // 放置所有依赖项的完整路径
        var deps = {} // args的另一种表现形式，为的是方便去重
        var id = parentUrl || "callback" + setTimeout("1")
        var mapUrl = parentUrl && parentUrl.replace(rjsext, "")
        parentUrl = getBaseUrl(parentUrl)

        array.forEach(function(el) {
            var url = loadResources(el, parentUrl, mapUrl) //加载资源，并返回.能加载资源的完整路径
            if (url) {
                if (!deps[url]) {
                    args.push(url)
                    deps[url] = "司徒正美" //去重
                }
            }
        })
        var module = modules[id]
        if (!module || module.state !== 2) {
            modules[id] = makeModule(id, 1, factory, deps, args)//更新此模块信息
        }
        if (!module) {
            //如果此模块是定义在另一个JS文件中, 那必须等该文件加载完毕, 才能放到检测列队中
            loadings.push(id)
        }
        checkDeps()
    }
    //核心API之二 require
    innerRequire.define = function(urlOrId, deps, factory) { //模块名,依赖列表,模块本身
        var args = aslice.call(arguments)
        if (typeof urlOrId === "string") {
            var id = args.shift()
        }
        if (typeof args[0] === "function") {
            args.unshift([])
        }
        //上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
        //现在除了safari5.1-外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，
        //safari可通过onload+ factory.require闭包组合解决
        var url = modules[id] && modules[id].state >= 1 ? id : trimQuery(getCurrentScript())
        factory = args[1]
        factory.id = id //用于调试

        if (!modules[url] && id) {
            //必须先行定义，并且不存在deps，用于checkCycle方法
            modules[url] = makeModule(url, 1, factory)
        }

        factory.require = function(url) {
            args.push(url)
            var isCycle = true
            try {
                isCycle = checkCycle(modules[url].deps, url)
            } catch (e) {
            }
            if (isCycle) {
                avalon.error(url + "模块与之前的模块存在循环依赖，请不要直接用script标签引入" + url + "模块")
            }
            delete factory.require //释放内存
            innerRequire.apply(null, args) //0,1,2 --> 1,2,0
        }
        if (url) {
            factory.require(url)
        } else { //先进先出
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
        paths: function(hash) {
            avalon.mix(allpaths, hash)
            kernel.paths = makeIndexArray(allpaths)
        },
        map: function(hash) {
            avalon.mix(allmaps, hash)
            var list = makeIndexArray(allmaps, 1, 1)
            avalon.each(list, function(_, item) {
                item.val = makeIndexArray(item.val)
            })
            kernel.map = list
        },
        packages: function(array) {
            array = array.concat(allpackages)
            var uniq = {}
            var ret = []
            for (var i = 0, pkg; pkg = array[i++]; ) {
                var pkg = typeof pkg === "string" ? {name: pkg} : pkg
                var name = pkg.name
                if (!uniq[name]) {
                    var url = pkg.location ? pkg.location : joinPath(name, pkg.main || "main")
                    url = url.replace(rjsext, "")
                    ret.push(pkg)
                    uniq[name] = pkg.location = url
                    pkg.reg = makeMatcher(name)
                }
            }
            kernel.packages = ret.sort()
        },
        urlArgs: function(hash) {
            if (typeof hash === "string") {
                hash = {"*": hash}
            }
            avalon.mix(allargs, hash)
            kernel.urlArgs = makeIndexArray(allargs, 1)
        },
        baseUrl: function(url) {
            if (!isAbsUrl(url)) {
                var baseElement = head.getElementsByTagName("base")[0]
                if (baseElement) {
                    head.removeChild(baseElement)
                }
                var node = DOC.createElement("a")
                node.href = url
                url = "1"[0] ? node.href : node.getAttribute("href", 4)
                if (baseElement) {
                    head.insertBefore(baseElement, head.firstChild)
                }
            }
            kernel.baseUrl = url
        },
        shim: function(obj) {
            for (var i in obj) {
                var value = obj[i]
                if (Array.isArray(value)) {
                    value = obj[i] = {
                        deps: value
                    }
                }
                if (!value.exportsFn && (value.exports || value.init)) {
                    value.exportsFn = makeShimExports(value)
                }
            }
            kernel.shim = obj
        }

    })


    //==============================内部方法=================================
    function checkCycle(deps, nick) {
        //检测是否存在循环依赖
        for (var id in deps) {
            if (deps[id] === "司徒正美" && modules[id].state !== 2 && (id === nick || checkCycle(modules[id].deps, nick))) {
                return true
            }
        }
    }

    function checkFail(node, onError, fuckIE) {
        var id = trimQuery(node.src) //检测是否死链
        node.onload = node.onreadystatechange = node.onerror = null
        if (onError || (fuckIE && !modules[id].state)) {
            setTimeout(function() {
                head.removeChild(node)
                node = null // 处理旧式IE下的循环引用问题
            })
            log("debug: 加载 " + id + " 失败" + onError + " " + (!modules[id].state))
        } else {
            return true
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
    var resources = innerRequire.plugins = {
        //三大常用资源插件 js!, css!, text!, ready!
        ready: {
            load: noop
        },
        js: {
            load: function(name, req, onLoad) {
                var url = req.url
                var id = trimQuery(url)
                var shim = kernel.shim[name.replace(rjsext, "")]
                if (shim) { //shim机制
                    innerRequire(shim.deps || [], function() {
                        var args = avalon.slice(arguments)
                        loadJS(url, id, function() {
                            onLoad(shim.exportsFn ? shim.exportsFn.apply(0, args) : void 0)
                        })
                    })
                } else {
                    loadJS(url, id)
                }
            }
        },
        css: {
            load: function(name, req, onLoad) {
                var url = req.url
                var id = trimQuery(url).replace(/\W/g, "")
                if (!DOC.getElementById(id)) {
                    var node = DOC.createElement("link")
                    node.rel = "stylesheet"
                    node.href = url
                    node.id = id
                    head.insertBefore(node, head.firstChild)
                    onLoad()
                }
            }
        },
        text: {
            load: function(name, req, onLoad) {
                var url = req.url
                var xhr = getXHR()
                xhr.onreadystatechange = function() {
                    if (xhr.readyState === 4) {
                        var status = xhr.status;
                        if (status > 399 && status < 600) {
                            avalon.error(url + " 对应资源不存在或没有开启 CORS")
                        } else {
                            onLoad(xhr.responseText)
                        }
                    }
                }
                xhr.open("GET", url, true)
                if ("withCredentials" in xhr) {
                    xhr.withCredentials = true
                }
                xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
                xhr.send()
            }
        }
    }
    innerRequire.checkDeps = checkDeps

    var rquery = /(\?[^#]*)$/
    function trimQuery(url) {
        return (url || "").replace(rquery, "")
    }

    function isAbsUrl(path) {
        //http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
        return  /^(?:[a-z]+:)?\/\//i.test(String(path))
    }

    function getBaseUrl(parentUrl) {
        return  parentUrl ?
                parentUrl.substr(0, parentUrl.lastIndexOf("/")) :
                kernel.baseUrl ? kernel.baseUrl :
                kernel.loaderUrl
    }

    function getCurrentScript(base) {
        // inspireb by https://github.com/samyk/jiagra/blob/master/jiagra.js
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
                var url = "1"[0] ? node.src : node.getAttribute("src", 4)
                return node.className = url
            }
        }
    }

    function loadResources(url, parentUrl, mapUrl) {
        //1. 特别处理ready标识符及已经加载好的模块
        if (modules[url] && modules[url].state === 2) {
            return url
        }

        var res = "js"
        url = url.replace(/^(\w+)\!/, function(a, b) {
            res = b
            return ""
        })
        var req = {
            toUrl: toUrl,
            parentUrl: parentUrl,
            mapUrl: mapUrl,
            res: res
        }

        var urlNoQuery = trimQuery(req.toUrl(url))
        if (!modules[urlNoQuery]) {
            var module = modules[urlNoQuery] = makeModule(urlNoQuery)
            function wrap(obj) {
                resources[res] = obj
                obj.load(url, req, function(a) {
                    if (arguments.length && a !== void 0) {
                        module.exports = a
                    }
                    module.state = 2
                    innerRequire.checkDeps()
                })
            }
            if (!resources[res]) {
                innerRequire([res], wrap)
            } else {
                wrap(resources[res])
            }
        }
        return urlNoQuery
    }
    function toUrl(url) {
        //1. 处理querystring, hash
        var query = ""
        var id = url.replace(rquery, function(a) {
            query = a
            return ""
        })
        //2. 处理后缀名
        var res = "." + this.res
        var ext = /js|css/.test(res) ? res : ""
        url = id = id.replace(/\.[a-z0-9]+$/g, function(a) {
            if (a === res) {
                ext = a
                return ""
            } else {
                return a
            }
        })
        this.id = id
        //3. 是否命中paths配置项
        var usePath = 0
        eachIndexArray(id, kernel.paths, function(value, key) {
            url = url.replace(key, value)
            usePath = 1
        })
        //4. 是否命中packages配置项
        if (!usePath) {
            eachIndexArray(id, kernel.packages, function(value, key, item) {
                url = url.replace(item.name, item.location)
            })
        }
        //5. 是否命中map配置项
        if (this.mapUrl) {
            eachIndexArray(this.mapUrl, kernel.map, function(array) {
                eachIndexArray(url, array, function(mdValue, mdKey) {
                    url = url.replace(mdKey, mdValue)
                })
            })
        }
        //6. 转换为绝对路径
        if (!isAbsUrl(url)) {
            url = joinPath(/\w/.test(url.charAt(0)) ? getBaseUrl() : this.parentUrl, url)
        }
        //7. 还原扩展名，query
        url += ext + query
        //8. 处理urlArgs
        eachIndexArray(id, kernel.urlArgs, function(value) {
            url += (url.indexOf("?") === -1 ? "?" : "&") + value;
        })
        return this.url = url
    }

    function loadJS(url, id, callback) {
        //通过script节点加载目标模块
        var node = DOC.createElement("script")
        node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
        node[W3C ? "onload" : "onreadystatechange"] = function() {
            if (W3C || /loaded|complete/i.test(node.readyState)) {
                //mass Framework会在_checkFail把它上面的回调清掉，尽可能释放回存，尽管DOM0事件写法在IE6下GC无望
                var factory = factorys.pop()
                factory && factory.require(id)
                if (callback) {
                    callback()
                }
                if (checkFail(node, false, !W3C)) {
                    log("debug: 已成功加载 " + url)
                    loadings.push(id)
                    checkDeps()
                }
            }
        }
        node.onerror = function() {
            checkFail(node, true)
        }
        node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错
        head.insertBefore(node, head.firstChild) //chrome下第二个参数不能为null
        log("debug: 正准备加载 " + url) //更重要的是IE6下可以收窄getCurrentScript的寻找范围
    }

    function fireFactory(id, deps, factory) {
        var module = Object(modules[id])
        module.state = 2
        for (var i = 0, array = [], d; d = deps[i++]; ) {
            if (d === "exports") {
                var obj = module.exports || (module.exports = {})
                array.push(obj)
            } else {
                array.push(modules[d].exports)
            }
        }
        var ret = factory.apply(window, array)
        if (ret !== void 0) {
            modules[id].exports = ret
        }
        return ret
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

    function makeShimExports(value) {
        return function() {
            var ret
            if (value.init) {
                ret = value.init.apply(window, arguments)
            }
            return ret || (value.exports && getGlobal(value.exports))
        }
    }

    function makeModule(id, state, factory, deps, args) {
        return {
            id: id,
            state: state || 1,
            factory: factory || noop,
            deps: deps || {},
            args: args || []
        }
    }

    function hash2array(hash, useStar, part) {
        var array = [];
        for (var key in hash) {
            if (hash.hasOwnProperty(key)) {
                var item = {
                    name: key,
                    val: hash[key]
                }
                array.push(item)
                item.reg = key === "*" && useStar
                        ? /^/
                        : makeMatcher(key)
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
        value.split(".").forEach(function(part) {
            g = g[part]
        })
        return g
    }


    var cur = getCurrentScript(true) //求得当前avalon.js 所在的JS文件的路径
    if (!cur) { //处理window safari的Error没有stack的问题
        cur = DOC.scripts[DOC.scripts.length - 1].src
    }
    var url = trimQuery(cur)
    kernel.loaderUrl = url.slice(0, url.lastIndexOf("/") + 1)

}
