/*********************************************************************
 *                      AMD加载器                                   *
 **********************************************************************/
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

    function trimHashAndQuery(url) {
        return (url || "").replace(/[?#].*/, "")
    }

    var cur = getCurrentScript(true) //求得当前avalon.js 所在的JS文件的路径
    if (!cur) { //处理window safari的Error没有stack的问题
        cur = avalon.slice(DOC.scripts).pop().src
    }
    var url = trimHashAndQuery(cur)
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

    innerRequire = avalon.require = function(array, factory, parent) {
        if (!Array.isArray(array)) {
            avalon.error("require的第一个参数必须是依赖列数,类型为数组 " + array)
        }
        var args = [] // 放置所有依赖项的完整路径
        var deps = {} // args的另一种表现形式，为的是方便去重
        var dn = 0  //需要安装的模块数
        var cn = 0  // 已安装完的模块数
        var id = parent || "callback" + setTimeout("1")
        parent = parent || basepath

        array.forEach(function(el) {
            var url = loadResources(el, parent) //加载资源，并返回能加载资源的完整路径
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
        modules[id] = {//保存此模块的相关信息
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
        //safari可通过onload+delay闭包组合解决
        var url = modules[id] && modules[id].state >= 1 ? id : trimHashAndQuery(getCurrentScript())
        if (!modules[url] && id) {
            modules[url] = {
                id: url,
                factory: factory,
                state: 1
            }
        }
        factory = args[1]
        factory.id = id //用于调试
        factory.delay = function(d) {
            args.push(d)
            var isCycle = true
            try {
                isCycle = checkCycle(modules[d].deps, d)
            } catch (e) {
            }
            if (isCycle) {
                avalon.error(d + "模块与之前的模块存在循环依赖，请不要直接用script标签引入" + d + "模块")
            }
            delete factory.delay //释放内存
            innerRequire.apply(null, args) //0,1,2 --> 1,2,0
        }
        if (url) {
            factory.delay(url)
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
        var id = trimHashAndQuery(node.src) //检测是否死链
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
    var rdeuce = /\/\w+\/\.\./

    function loadResources(url, parent, ret, shim) {
        //1. 特别处理mass|ready标识符
        if (url === "ready!" || (modules[url] && modules[url].state === 2)) {
            return url
        }
        //2.  处理text!  css! 等资源
        var plugin
        url = url.replace(/^\w+!/, function(a) {
            plugin = a.slice(0, -1)
            return ""
        })
        plugin = plugin || "js"
        plugin = plugins[plugin] || noop
        //3. 转化为完整路径
        if (typeof kernel.shim[url] === "object") {
            shim = kernel.shim[url]
        }
        url = url.split('/');
        //For each module name segment, see if there is a path
        //registered for it. Start with most specific name
        //and work up from it.
        for (var i = url.length, parentModule, parentPath; i > 0; i -= 1) {
            parentModule = url.slice(0, i).join('/');

            parentPath = kernel.paths[parentModule];
            if (parentPath) {
                //If an array, it means there are a few choices,
                //Choose the one that is desired
                if (Array.isArray(parentPath)) {
                    parentPath = parentPath[0];
                }
                url.splice(0, i, parentPath);
                break;
            }
        }
        //Join the path parts together, then figure out if baseUrl is needed.
        url = url.join('/');

        //4. 补全路径
        if (/^(\w+)(\d)?:.*/.test(url)) {
            ret = url
        } else {
            parent = parent.substr(0, parent.lastIndexOf("/"))
            var tmp = url.charAt(0)
            if (tmp !== "." && tmp !== "/") { //相对于根路径
                ret = basepath + url
            } else if (url.slice(0, 2) === "./") { //相对于兄弟路径
                ret = parent + url.slice(1)
            } else if (url.slice(0, 2) === "..") { //相对于父路径
                ret = parent + "/" + url
                while (rdeuce.test(ret)) {
                    ret = ret.replace(rdeuce, "")
                }
            } else if (tmp === "/") {
                ret = url //相对于根路径
            } else {
                avalon.error("不符合模块标识规则: " + url)
            }
        }
        //5. 补全扩展名
        url = trimHashAndQuery(ret)
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
                    log("debug: 已成功加载 " + url)
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

    plugins.js = function(url, shim) {
        var id = trimHashAndQuery(url)
        if (!modules[id]) { //如果之前没有加载过
            modules[id] = {
                id: id,
                exports: {}
            }
            if (shim) { //shim机制
                innerRequire(shim.deps || "", function() {
                    loadJS(url, id, function() {
                        modules[id].state = 2
                        var s = shim.exports
                        if (s && modules[id].exports === void 0) {
                            modules[id].exports = typeof s === "function" ?
                                    s() : window[s]
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
        var id = trimHashAndQuery(url).replace(/\W/g, "_") ////用于处理掉href中的hash与所有特殊符号
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
        var id = trimHashAndQuery(url)
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
