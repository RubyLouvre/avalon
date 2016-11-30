/******/
(function(modules) { // webpackBootstrap
    /******/ // The module cache
    /******/
    var installedModules = {};

    /******/ // The require function
    /******/
    function __webpack_require__(moduleId) {

        /******/ // Check if module is in cache
        /******/
        if (installedModules[moduleId])
        /******/
            return installedModules[moduleId].exports;

        /******/ // Create a new module (and put it into the cache)
        /******/
        var module = installedModules[moduleId] = {
            /******/
            exports: {},
            /******/
            id: moduleId,
            /******/
            loaded: false
                /******/
        };

        /******/ // Execute the module function
        /******/
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

        /******/ // Flag the module as loaded
        /******/
        module.loaded = true;

        /******/ // Return the exports of the module
        /******/
        return module.exports;
        /******/
    }


    /******/ // expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules;

    /******/ // expose the module cache
    /******/
    __webpack_require__.c = installedModules;

    /******/ // __webpack_public_path__
    /******/
    __webpack_require__.p = "";

    /******/ // Load entry module and return exports
    /******/
    return __webpack_require__(0);
    /******/
})
/************************************************************************/
/******/
([
    /* 0 */
    /***/
    function(module, exports, __webpack_require__) {

        /*
         * 
         * version 1.0
         * built in 2015.11.19
         */

        var mmHistory = __webpack_require__(6)
        var storage = __webpack_require__(7)

        function Router() {
            this.rules = []
        }


        var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g
        Router.prototype = storage
        avalon.mix(storage, {
            error: function(callback) {
                this.errorback = callback
            },
            _pathToRegExp: function(pattern, opts) {
                var keys = opts.keys = [],
                    //      segments = opts.segments = [],
                    compiled = '^',
                    last = 0,
                    m, name, regexp, segment;

                while ((m = placeholder.exec(pattern))) {
                    name = m[2] || m[3]; // IE[78] returns '' for unmatched groups instead of null
                    regexp = m[4] || (m[1] == '*' ? '.*' : 'string')
                    segment = pattern.substring(last, m.index);
                    var type = this.$types[regexp]
                    var key = {
                        name: name
                    }
                    if (type) {
                        regexp = type.pattern
                        key.decode = type.decode
                    }
                    keys.push(key)
                    compiled += quoteRegExp(segment, regexp, false)
                        //  segments.push(segment)
                    last = placeholder.lastIndex
                }
                segment = pattern.substring(last);
                compiled += quoteRegExp(segment) + (opts.strict ? opts.last : "\/?") + '$';
                var sensitive = typeof opts.caseInsensitive === "boolean" ? opts.caseInsensitive : true
                    //  segments.push(segment);
                opts.regexp = new RegExp(compiled, sensitive ? 'i' : undefined);
                return opts

            },
            //添加一个路由规则
            add: function(path, callback, opts) {
                var array = this.rules
                if (path.charAt(0) !== "/") {
                    avalon.error("avalon.router.add的第一个参数必须以/开头")
                }
                opts = opts || {}
                opts.callback = callback
                if (path.length > 2 && path.charAt(path.length - 1) === "/") {
                    path = path.slice(0, -1)
                    opts.last = "/"
                }
                avalon.Array.ensure(array, this._pathToRegExp(path, opts))
            },
            //判定当前URL与已有状态对象的路由规则是否符合
            route: function(path, query) {
                path = path.trim()
                var rules = this.rules
                for (var i = 0, el; el = rules[i++];) {
                    var args = path.match(el.regexp)
                    if (args) {
                        el.query = query || {}
                        el.path = path
                        el.params = {}
                        var keys = el.keys
                        args.shift()
                        if (keys.length) {
                            this._parseArgs(args, el)
                        }
                        return el.callback.apply(el, args)
                    }
                }
                if (this.errorback) {
                    this.errorback()
                }
            },
            _parseArgs: function(match, stateObj) {
                var keys = stateObj.keys
                for (var j = 0, jn = keys.length; j < jn; j++) {
                    var key = keys[j]
                    var value = match[j] || ''
                    if (typeof key.decode === 'function') { //在这里尝试转换参数的类型
                        var val = key.decode(value)
                    } else {
                        try {
                            val = JSON.parse(value)
                        } catch (e) {
                            val = value
                        }
                    }
                    match[j] = stateObj.params[key.name] = val
                }
            },
            /*
             *  @interface avalon.router.navigate 设置历史(改变URL)
             *  @param hash 访问的url hash   
             */
            navigate: function(hash, mode) {
                var parsed = parseQuery(hash)
                var newHash = this.route(parsed.path, parsed.query)
                if (isLegalPath(newHash)) {
                    hash = newHash
                }
                //保存到本地储存或cookie
                avalon.router.setLastPath(hash)
                    // 模式0, 不改变URL, 不产生历史实体, 执行回调
                    // 模式1, 改变URL, 不产生历史实体,   执行回调
                    // 模式2, 改变URL, 产生历史实体,    执行回调
                if (mode === 1) {

                    avalon.history.setHash(hash, true)
                } else if (mode === 2) {
                    avalon.history.setHash(hash)
                }
                return hash
            },
            /*
             *  @interface avalon.router.when 配置重定向规则
             *  @param path 被重定向的表达式，可以是字符串或者数组
             *  @param redirect 重定向的表示式或者url
             */
            when: function(path, redirect) {
                var me = this,
                    path = path instanceof Array ? path : [path]
                avalon.each(path, function(index, p) {
                    me.add(p, function() {
                        var info = me.urlFormate(redirect, this.params, this.query)
                        me.navigate(info.path + info.query)
                    })
                })
                return this
            },
            urlFormate: function(url, params, query) {
                var query = query ? queryToString(query) : "",
                    hash = url.replace(placeholder, function(mat) {
                        var key = mat.replace(/[\{\}]/g, '').split(":")
                        key = key[0] ? key[0] : key[1]
                        return params[key] !== undefined ? params[key] : ''
                    }).replace(/^\//g, '')
                return {
                    path: hash,
                    query: query
                }
            },
            /* *
             `'/hello/'` - 匹配'/hello/'或'/hello'
             `'/user/:id'` - 匹配 '/user/bob' 或 '/user/1234!!!' 或 '/user/' 但不匹配 '/user' 与 '/user/bob/details'
             `'/user/{id}'` - 同上
             `'/user/{id:[^/]*}'` - 同上
             `'/user/{id:[0-9a-fA-F]{1,8}}'` - 要求ID匹配/[0-9a-fA-F]{1,8}/这个子正则
             `'/files/{path:.*}'` - Matches any URL starting with '/files/' and captures the rest of the
             path into the parameter 'path'.
             `'/files/*path'` - ditto.
             */
            // avalon.router.get("/ddd/:dddID/",callback)
            // avalon.router.get("/ddd/{dddID}/",callback)
            // avalon.router.get("/ddd/{dddID:[0-9]{4}}/",callback)
            // avalon.router.get("/ddd/{dddID:int}/",callback)
            // 我们甚至可以在这里添加新的类型，avalon.router.$type.d4 = { pattern: '[0-9]{4}', decode: Number}
            // avalon.router.get("/ddd/{dddID:d4}/",callback)
            $types: {
                date: {
                    pattern: "[0-9]{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[1-2][0-9]|3[0-1])",
                    decode: function(val) {
                        return new Date(val.replace(/\-/g, "/"))
                    }
                },
                string: {
                    pattern: "[^\\/]*",
                    decode: function(val) {
                        return val;
                    }
                },
                bool: {
                    decode: function(val) {
                        return parseInt(val, 10) === 0 ? false : true;
                    },
                    pattern: "0|1"
                },
                'int': {
                    decode: function(val) {
                        return parseInt(val, 10);
                    },
                    pattern: "\\d+"
                }
            }
        })


        module.exports = avalon.router = new Router


        function parseQuery(url) {
            var array = url.split("?"),
                query = {},
                path = array[0],
                querystring = array[1]
            if (querystring) {
                var seg = querystring.split("&"),
                    len = seg.length,
                    i = 0,
                    s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue
                    }
                    s = seg[i].split("=")
                    query[decodeURIComponent(s[0])] = decodeURIComponent(s[1])
                }
            }
            return {
                path: path,
                query: query
            }
        }

        function isLegalPath(path) {
            if (path === '/')
                return true
            if (typeof path === 'string' && path.length > 1 && path.charAt(0) === '/') {
                return true
            }
        }

        function queryToString(obj) {
            if (typeof obj === 'string')
                return obj
            var str = []
            for (var i in obj) {
                if (i === "query")
                    continue
                str.push(i + '=' + encodeURIComponent(obj[i]))
            }
            return str.length ? '?' + str.join("&") : ''
        }


        function quoteRegExp(string, pattern, isOptional) {
            var result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
            if (!pattern)
                return result;
            var flag = isOptional ? '?' : '';
            return result + flag + '(' + pattern + ')' + flag;
        }


        /***/
    },
    /* 1 */
    ,
    /* 2 */
    ,
    /* 3 */
    ,
    /* 4 */
    ,
    /* 5 */
    ,
    /* 6 */
    /***/
    function(module, exports) {

        /*!
         * mmHistory
         * 用于监听地址栏的变化
         * https://github.com/flatiron/director/blob/master/lib/director/browser.js
         * https://github.com/visionmedia/page.js/blob/master/page.js
         */

        var location = document.location
        var oldIE = avalon.msie <= 7
        var supportPushState = !!(window.history.pushState)
        var supportHashChange = !!("onhashchange" in window && (!window.VBArray || !oldIE))
        var defaults = {
            root: "/",
            html5: false,
            hashPrefix: "!",
            iframeID: null, //IE6-7，如果有在页面写死了一个iframe，这样似乎刷新的时候不会丢掉之前的历史
            interval: 50, //IE6-7,使用轮询，这是其时间时隔,
            autoScroll: false
        }
        var mmHistory = {
            hash: getHash(location.href),
            check: function() {
                var h = getHash(location.href)
                if (h !== this.hash) {
                    this.hash = h
                    this.onHashChanged()
                }
            },
            start: function(options) {
                if (this.started)
                    throw new Error('avalon.history has already been started')
                this.started = true
                    //监听模式
                if (typeof options === 'boolean') {
                    options = {
                        html5: options
                    }
                }

                options = avalon.mix({}, defaults, options || {})
                if (options.fireAnchor) {
                    options.autoScroll = true
                }
                var rootPath = options.root
                if (!/^\//.test(rootPath)) {
                    avalon.error('root配置项必须以/字符开始, 以非/字符结束')
                }
                if (rootPath.length > 1) {
                    options.root = rootPath.replace(/\/$/, '')
                }
                var html5Mode = options.html5
                this.options = options
                this.mode = html5Mode ? "popstate" : "hashchange"
                if (!supportPushState) {
                    if (html5Mode) {
                        avalon.warn("浏览器不支持HTML5 pushState，平稳退化到onhashchange!")
                    }
                    this.mode = "hashchange"
                }
                if (!supportHashChange) {
                    this.mode = "iframepoll"
                }
                avalon.log('avalon run mmHistory in the ', this.mode, 'mode')
                    // 支持popstate 就监听popstate
                    // 支持hashchange 就监听hashchange(IE8,IE9,FF3)
                    // 否则的话只能每隔一段时间进行检测了(IE6, IE7)
                switch (this.mode) {
                    case "popstate":
                        // At least for now HTML5 history is available for 'modern' browsers only
                        // There is an old bug in Chrome that causes onpopstate to fire even
                        // upon initial page load. Since the handler is run manually in init(),
                        // this would cause Chrome to run it twise. Currently the only
                        // workaround seems to be to set the handler after the initial page load
                        // http://code.google.com/p/chromium/issues/detail?id=63040
                        setTimeout(function() {
                            window.onpopstate = mmHistory.onHashChanged
                        }, 500)
                        break
                    case "hashchange":
                        window.onhashchange = mmHistory.onHashChanged
                        break
                    case "iframepoll":
                        //也有人这样玩 http://www.cnblogs.com/meteoric_cry/archive/2011/01/11/1933164.html
                        avalon.ready(function() {
                            var iframe = document.createElement('iframe')
                            iframe.id = options.iframeID
                            iframe.style.display = 'none'
                            document.body.appendChild(iframe)
                            mmHistory.iframe = iframe
                            mmHistory.writeFrame('')
                            if (avalon.msie) {
                                function onPropertyChange() {
                                    if (event.propertyName === 'location') {
                                        mmHistory.check()
                                    }
                                }
                                document.attachEvent('onpropertychange', onPropertyChange)
                                mmHistory.onPropertyChange = onPropertyChange
                            }

                            mmHistory.intervalID = window.setInterval(function() {
                                mmHistory.check()
                            }, options.interval)

                        })
                        break
                }
                //页面加载时触发onHashChanged
                this.onHashChanged()
            },
            stop: function() {
                switch (this.mode) {
                    case "popstate":
                        window.onpopstate = avalon.noop
                        break
                    case "hashchange":
                        window.onhashchange = avalon.noop
                        break
                    case "iframepoll":
                        if (this.iframe) {
                            document.body.removeChild(this.iframe)
                            this.iframe = null
                        }
                        if (this.onPropertyChange) {
                            document.detachEvent('onpropertychange', this.onPropertyChange)
                        }
                        clearInterval(this.intervalID)
                        break
                }
                this.started = false
            },
            setHash: function(s, replace) {
                switch (this.mode) {
                    case 'iframepoll':
                        if (replace) {
                            var iframe = this.iframe
                            if (iframe) {
                                //contentWindow 兼容各个浏览器，可取得子窗口的 window 对象。
                                //contentDocument Firefox 支持，> ie8 的ie支持。可取得子窗口的 document 对象。
                                iframe.contentWindow._hash = s
                            }
                        } else {
                            this.writeFrame(s)
                        }
                        break
                    case 'popstate':
                        var path = (this.options.root + '/' + s).replace(/\/+/g, '/')
                        var method = replace ? 'replaceState' : 'pushState'
                        history[method]({}, document.title, path)
                            // 手动触发onpopstate event
                        this.onHashChanged()
                        break
                    default:
                        //http://stackoverflow.com/questions/9235304/how-to-replace-the-location-hash-and-only-keep-the-last-history-entry
                        var newHash = this.options.hashPrefix + s
                        if (replace && location.hash !== newHash) {
                            history.back()
                        }
                        location.hash = newHash
                        break
                }
            },
            writeFrame: function(s) {
                // IE support...
                var f = mmHistory.iframe
                var d = f.contentDocument || f.contentWindow.document
                d.open()
                d.write("<script>_hash = '" + s + "'; onload = parent.avalon.history.syncHash;<script>")
                d.close()
            },
            syncHash: function() {
                // IE support...
                var s = this._hash
                if (s !== getHash(location.href)) {
                    location.hash = s
                }
                return this
            },
            getPath: function() {
                var path = location.pathname
                var path = path.split(this.options.root)[1]
                if (path.charAt(0) !== '/') {
                    path = '/' + path
                }
                return path
            },
            onHashChanged: function(hash, clickMode) {
                if (!clickMode) {
                    hash = mmHistory.mode === 'popstate' ? mmHistory.getPath() :
                        location.href.replace(/.*#!?/, '')
                }
                hash = decodeURIComponent(hash)
                hash = hash.charAt(0) === '/' ? hash : '/' + hash
                if (hash !== mmHistory.hash) {
                    mmHistory.hash = hash

                    if (avalon.router) { //即mmRouter
                        hash = avalon.router.navigate(hash, 0)
                    }

                    if (clickMode) {
                        mmHistory.setHash(hash)
                    }
                    if (clickMode && mmHistory.options.autoScroll) {
                        autoScroll(hash.slice(1))
                    }
                }

            }
        }

        function getHash(path) {
            // IE6直接用location.hash取hash，可能会取少一部分内容
            // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
            // ie6 => location.hash = #stream/xxxxx
            // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
            // firefox 会自作多情对hash进行decodeURIComponent
            // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
            // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
            // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
            var index = path.indexOf("#")
            if (index === -1) {
                return ''
            }
            return decodeURI(path.slice(index))
        }



        //劫持页面上所有点击事件，如果事件源来自链接或其内部，
        //并且它不会跳出本页，并且以"#/"或"#!/"开头，那么触发updateLocation方法
        avalon.bind(document, "click", function(e) {
            //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
            //https://github.com/angular/angular.js/blob/master/src/ng/location.js
            //下面十种情况将阻止进入路由系列
            //1. 路由器没有启动
            if (!mmHistory.started) {
                return
            }
            //2. 不是左键点击或使用组合键
            if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2 || e.button === 2) {
                return
            }
            //3. 此事件已经被阻止
            if (e.returnValue === false) {
                return
            }
            //4. 目标元素不A标签,或不在A标签之内
            var el = e.path ? e.path[0] : e.target || e.srcElement || {}
            while (el.nodeName !== "A") {
                el = el.parentNode
                if (!el || el.tagName === "BODY") {
                    return
                }
            }
            //5. 没有定义href属性或在hash模式下,只有一个#
            //IE6/7直接用getAttribute返回完整路径
            var href = el.getAttribute('href', 2) || el.getAttribute("xlink:href") || ''
            if (href.slice(0, 2) !== '#!') {
                return
            }

            //6. 目标链接是用于下载资源或指向外部
            if (el.hasAttribute('download') || el.getAttribute('rel') === 'external')
                return

            //7. 只是邮箱地址
            if (href.indexOf('mailto:') > -1) {
                return
            }
            //8. 目标链接要新开窗口
            if (el.target && el.target !== '_self') {
                return
            }

            e.preventDefault()
                //终于达到目的地
            mmHistory.onHashChanged(href.replace('#!', ''), true)

        })

        //得到页面第一个符合条件的A标签
        function getFirstAnchor(name) {
            var list = document.getElementsByTagName('A')
            for (var i = 0, el; el = list[i++];) {
                if (el.name === name) {
                    return el
                }
            }
        }

        function getOffset(elem) {
            var position = avalon(elem).css('position'),
                offset
            if (position !== 'fixed') {
                offset = 0
            } else {
                offset = elem.getBoundingClientRect().bottom
            }

            return offset
        }

        function autoScroll(hash) {
            //取得页面拥有相同ID的元素
            var elem = document.getElementById(hash)
            if (!elem) {
                //取得页面拥有相同name的A元素
                elem = getFirstAnchor(hash)
            }
            if (elem) {
                elem.scrollIntoView()
                var offset = getOffset(elem)
                if (offset) {
                    var elemTop = elem.getBoundingClientRect().top
                    window.scrollBy(0, elemTop - offset.top)
                }
            } else {
                window.scrollTo(0, 0)
            }
        }


        module.exports = avalon.history = mmHistory


        /***/
    },
    /* 7 */
    /***/
    function(module, exports) {


        function supportLocalStorage() {
            try { //看是否支持localStorage
                localStorage.setItem("avalon", 1)
                localStorage.removeItem("avalon")
                return true
            } catch (e) {
                return false
            }
        }

        function escapeCookie(value) {
            return String(value).replace(/[,;"\\=\s%]/g, function(character) {
                return encodeURIComponent(character)
            });
        }
        var ret = {}
        if (supportLocalStorage()) {
            ret.getLastPath = function() {
                return localStorage.getItem('msLastPath')
            }
            var cookieID
            ret.setLastPath = function(path) {
                if (cookieID) {
                    clearTimeout(cookieID)
                    cookieID = null
                }
                localStorage.setItem("msLastPath", path)
                cookieID = setTimeout(function() { //模拟过期时间
                    localStorage.removItem("msLastPath")
                }, 1000 * 60 * 60 * 24)
            }
        } else {

            ret.getLastPath = function() {
                return getCookie.getItem('msLastPath')
            }
            ret.setLastPath = function(path) {
                setCookie('msLastPath', path)
            }

            function setCookie(key, value) {
                var date = new Date() //将date设置为1天以后的时间 
                date.setTime(date.getTime() + 1000 * 60 * 60 * 24)
                document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ';expires=' + date.toGMTString()
            }

            function getCookie(name) {
                var m = String(document.cookie).match(new RegExp('(?:^| )' + name + '(?:(?:=([^;]*))|;|$)')) || ["", ""]
                return decodeURIComponent(m[1])
            }
        }

        module.exports = ret

        /***/
    }
    /******/
]);