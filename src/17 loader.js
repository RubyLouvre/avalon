/*********************************************************************
 *                      AMD加载器                                   *
 **********************************************************************/
//https://www.devbridge.com/articles/understanding-amd-requirejs/
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
//http://stackoverflow.com/questions/25175914/bundles-in-requirejs
//http://maxogden.com/nested-dependencies.html
new function() {
    var loadings = [] //正在加载中的模块列表
    var factorys = [] //储存需要绑定ID与factory对应关系的模块（标准浏览器下，先parse的script节点会先onload）
    var queryReg = /(\?[^#]*)$/
    function trimQuery(url) {
        return (url || "").replace(queryReg, "")
    }
    var cur = getCurrentScript(true) //求得当前avalon.js 所在的JS文件的路径
    if (!cur) { //处理window safari的Error没有stack的问题
        cur = DOC.scripts[DOC.scripts.length - 1].src
    }
    var url = trimQuery(cur)
    kernel.loaderUrl = url.slice(0, url.lastIndexOf("/") + 1)

    function getBaseUrl(parentUrl) {
        return kernel.baseUrl ? kernel.baseUrl : parentUrl ?
                parentUrl.substr(0, parentUrl.lastIndexOf("/")) :
                kernel.loaderUrl
    }

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
                var url = "1"[0] ? node.src : node.getAttribute("src", 4)
                return node.className = url
            }
        }
    }

    innerRequire = avalon.require = function(array, factory, parentUrl) {
        if (!Array.isArray(array)) {
            avalon.error("require的第一个参数必须是依赖列数,类型为数组 " + array)
        }
        var args = [] // 放置所有依赖项的完整路径
        var deps = {} // args的另一种表现形式，为的是方便去重
        var id = parentUrl || "callback" + setTimeout("1")
        parentUrl = getBaseUrl(parentUrl)
        array.forEach(function(el) {
            var url = loadResources(el, parentUrl) //加载资源，并返回能加载资源的完整路径
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

    innerRequire.define = function(urlOrId, deps, factory) { //模块名,依赖列表,模块本身
        var args = aslice.call(arguments)
        if (typeof urlOrId === "string") {
            var id = args.shift()
        }
        if (typeof args[0] === "function") {
            args.unshift([])
        }
        //上线合并后能直接得到模块ID,否则寻找当前正在解析中的script节点的src作为模块ID
        //现在除了safari5,1-外，我们都能直接通过getCurrentScript一步到位得到当前执行的script节点，
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
    innerRequire.define.amd = modules

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

    function isAbsUrl(path) {
        //http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
        return  /^(?:[a-z]+:)?\/\//i.test(String(path))
    }
    var allpaths = kernel["orig.paths"] = {}
    var allmaps = kernel["orig.maps"] = {}
    var allpackages = kernel["packages"] = []
    var allargs = kernel["orig.args"] = {}
    avalon.mix(plugins, {
        paths: function(hash) {
            avalon.mix(allpaths, hash)
            kernel.paths = createIndexArray(allpaths)
        },
        map: function(hash) {
            avalon.mix(allmaps, hash)
            var maps = createIndexArray(allmaps, 1, 1)
            avalon.each(maps, function(_, item) {
                item.v = createIndexArray(item.v)
            })
            kernel.maps = maps
        },
        packages: function(array) {
            array = array.concat(allpackages)
            var uniq = {}
            var ret = []
            for (var i = 0, el; el = array[i++]; ) {
                var pkg = el
                if (typeof el === "string") {
                    pkg = {
                        name: el.split("/")[0],
                        location: el,
                        main: "main"
                    }
                }
                if (!uniq[pkg.name]) {
                    uniq[pkg.name] = 1
                    ret.push(pkg)
                    pkg.location = pkg.location || pkg.name
                    pkg.main = (pkg.main || "main").replace(/\.js$/i, "")
                    pkg.reg = createPrefixRegexp(pkg.name)
                }
            }
            kernel.packages = ret.sort()
        },
        urlArgs: function(hash) {
            if (typeof hash === "string") {
                hash = {"*": hash}
            }
            avalon.mix(allargs, hash)
            kernel.urlArgs = createIndexArray(allargs, 1)
        },
        bundles: function(obj) {
            var bundles = kernel.bundles = {}
            for (var key in obj) {
                avalon.each(obj[key], function(val, id) {
                    bundles[id] = key
                })
            }
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
    //创建一个经过特殊算法排好序的数组
    function createIndexArray(hash, useStar, part) {
        var index = hash2array(hash, useStar, part);
        index.sort(descSorterByKOrName);
        return index;
    }
    function createPrefixRegexp(prefix) {
        return new RegExp('^' + prefix + '(/|$)');
    }
    function hash2array(hash, useStar, part) {
        var array = [];
        for (var key in hash) {
            if (hash.hasOwnProperty(key)) {
                var item = {
                    k: key,
                    v: hash[key]
                }
                array.push(item)
                item.reg = key === '*' && useStar
                        ? /^/
                        : createPrefixRegexp(key)
                if (part && key !== "*") {
                    item.reg = new RegExp('\/' + key.replace(/^\//, "") + '(/|$)');
                }
            }
        }
        return array
    }
    // 根据元素的k或name项进行数组字符数逆序的排序函数
    function descSorterByKOrName(a, b) {
        var aValue = a.k || a.name
        var bValue = b.k || b.name
        if (bValue === '*') {
            return -1
        }
        if (aValue === '*') {
            return 1
        }
        return bValue.length - aValue.length
    }


    function getAbsUrl(url, baseUrl) {
        //http://stackoverflow.com/questions/470832/getting-an-absolute-url-from-a-relative-one-ie6-issue
        var oldBase = DOC.getElementsByTagName("base")[0]
        var oldHref = oldBase && oldBase.href
        var ourBase = oldBase || head.appendChild(DOC.createElement("base"))
        var node = DOC.createElement("a")
        ourBase.href = baseUrl
        node.href = url
        try {
            return  "1"[0] ? node.href : node.getAttribute("href", 4)
        } finally {
            if (oldBase) {
                oldBase.href = oldHref
            } else {
                head.removeChild(ourBase)
            }
        }
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

    function makeShimExports(value) {
        function fn() {
            var ret;
            if (value.init) {
                ret = value.init.apply(window, arguments);
            }
            return ret || (value.exports && getGlobal(value.exports));
        }
        return fn
    }

    function indexRetrieve(moduleID, array, matcher) {
        array = array || []
        for (var i = 0, el; el = array[i++]; ) {
            if (el.reg.test(moduleID)) {
                matcher(el.v, el.k, el)
                return false
            }
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

    function getGlobal(value) {
        if (!value) {
            return value;
        }
        var g = window
        value.split('.').forEach(function(part) {
            g = g[part]
        })
        return g;
    }

    function loadResources(url, parentUrl) {
        //1. 特别处理ready标识符及已经加载好的模块
        if (url === "ready!" || (modules[url] && modules[url].state === 2)) {
            return url
        }
        //2. 获取模块ID(去掉资源前缀，扩展名 hash, query)
        var match = url.match(/(\w+!)?(.+)/)
        var plugin = match[1] || "js"
        plugin = plugins[plugin] || noop
        var id = match[2]
        var query = ""
        if (queryReg.test(id)) {
            query = RegExp.$1;
            id = id.replace(queryReg, "");
        }
        var ext = plugin.ext || ""
        if (ext && id.substr(id.length - ext.length) === ext) {//去掉扩展名
            url = id.slice(0, -ext.length)
            id = id.slice(-ext.length)
        }
        //3. 是否命中paths配置项
        var usePath
        indexRetrieve(id, kernel.paths, function(value, key) {
            url = url.replace(key, value)
            usePath = 1
        })
        //4. 是否命中packages配置项
        if (!usePath) {
            indexRetrieve(id, kernel.packages, function(value, key, item) {
                url = url.replace(item.name, item.location)
            })
        }
        //5. 是否命中packages配置项
        indexRetrieve(parentUrl, kernel.maps, function(array) {
            indexRetrieve(url, array, function(mdValue, mdKey) {
                url = url.replace(mdKey, mdValue)
                parentUrl = getBaseUrl()
            })
        })
        //6. 转换为绝对路径
        if (!isAbsUrl(url)) {
            if (parentUrl === getBaseUrl()) {
                url = getAbsUrl(url, parentUrl)
            } else {
                url = joinPath(parentUrl, url)
            }
        }
        //7. 还原扩展名，query
        url += ext + query
        //8. 处理urlArgs
        indexRetrieve(id, kernel.urlArgs, function(value) {
            url += (url.indexOf("?") === -1 ? "?" : "&") + value;
        })
        return plugin(url, kernel.shim[id])
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


    plugins.js = function(url, shim) {
        var id = trimQuery(url)
        if (!modules[id]) { //如果之前没有加载过
            var module = modules[id] = makeModule(id)
            if (shim) { //shim机制
                innerRequire(shim.deps || [], function() {
                    var args = avalon.slice(arguments)
                    loadJS(url, id, function() {
                        module.state = 2
                        if (shim.exportsFn) {
                            module.exports = shim.exportsFn.apply(0, args)
                        }
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
        var id = trimQuery(url).replace(/\W/g, "_") ////用于处理掉href中的hash与所有特殊符号
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

    plugins.text = function(url) {
        var xhr = getXHR()
        var id = trimQuery(url)
        modules[id] = {}
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                if (status > 399 && status < 600) {
                    avalon.error(url + " 对应资源不存在或没有开启 CORS")
                } else {
                    modules[id].state = 2
                    modules[id].exports = xhr.responseText
                    innerRequire.checkDeps()
                }
            }
        }
        xhr.open("GET", url, true)
        if ("withCredentials" in xhr) {
            xhr.withCredentials = true
        }
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
        xhr.send()
        return id
    }

    innerRequire.config = kernel
    innerRequire.checkDeps = checkDeps
}
