define(["avalon"], function(avalon) {
    var views = {}
    avalon.bindingHandlers.view = function(data, vmodels) {
        var elem = data.element
        if (avalon.contains(document.body, elem)) {
            views[data.value] = elem
        }
        data.evaluator = avalon.noop
    }

    var anchorElement = document.createElement('a')

    var History = avalon.History = function() {
        this.location = location
    }

    History.started = false
    History.IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()

    History.defaults = {
        basepath: '/',
        html5Mode: false,
        hashPrefix: "!",
        interval: 50, //IE6-7,使用轮询，这是其时间时隔
        fireAnchor: true//决定是否将滚动条定位于与hash同ID的元素上
    }
    //判定A标签的target属性是否指向自身
    //thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
    History.targetIsThisWindow = function(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self' || (targetWindow === 'top' && window == window.top)) {
            return true
        }
        return false
    }
    var oldIE = window.VBArray && History.IEVersion <= 7
    History.prototype = {
        constructor: History,
        getFragment: function(fragment) {
            if (fragment == null) {
                if (this.monitorMode === "popstate") {
                    fragment = this.getPath();
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(/^[#\/]|\s+$/g, "")
        },
        getHash: function(window) {
            // IE6直接用location.hash取hash，可能会取少一部分内容
            // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
            // ie6 => location.hash = #stream/xxxxx
            // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
            // firefox 会自作多情对hash进行decodeURIComponent
            // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
            // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
            // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
            var path = (window || this).location.href
            return this._getHash(path.slice(path.indexOf("#")))
        },
        _getHash: function(path) {
            if (path.indexOf("#/") === 0) {
                return decodeURIComponent(path.slice(2))
            }
            if (path.indexOf("#!/") === 0) {
                return decodeURIComponent(path.slice(3))
            }
            return ""
        },
        getPath: function() {
            var path = decodeURIComponent(this.location.pathname + this.location.search)
            var root = this.basepath.slice(0, -1)
            if (!path.indexOf(root))
                path = path.slice(root.length)
            return path.slice(1)
        },
        _getAbsolutePath: function(a) {
            return !a.hasAttribute ? a.getAttribute("href", 4) : a.href
        },
        start: function(options) {
            if (History.started)
                throw new Error("avalon.history has already been started")
            History.started = true
            this.options = avalon.mix({}, History.defaults, options)
            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释

            this.supportPushState = !!(window.history.pushState)
            this.supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))
            //确保html5Mode属性存在,并且是一个布尔
            this.html5Mode = !!this.options.html5Mode
            //监听模式
            this.monitorMode = this.html5Mode ? "popstate" : "hashchange"
            if (!this.supportPushState) {
                if (this.html5Mode) {
                    avalon.log("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
                    this.html5Mode = false
                }
                this.monitorMode = "hashchange"
            }
            if (!this.supportHashChange) {
                this.monitorMode = "iframepoll"
            }
            this.prefix = "#" + this.options.hashPrefix + "/"
            //确认前后都存在斜线， 如"aaa/ --> /aaa/" , "/aaa --> /aaa/", "aaa --> /aaa/", "/ --> /"
            this.basepath = ("/" + this.options.basepath + "/").replace(/^\/+|\/+$/g, "/")  // 去最左右两边的斜线
            this.fragment = this.getFragment()

            anchorElement.href = this.basepath
            this.rootpath = this._getAbsolutePath(anchorElement)
            var that = this


            var html = '<!doctype html><html><body>@</body></html>'
            if (this.options.domain) {
                html = html.replace("<body>", "<script>document.domain =" + this.options.domain + "</script><body>")
            }
            this.iframeHTML = html
            if (this.monitorMode === "iframepoll") {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                avalon.ready(function() {
                    var iframe = document.createElement('iframe');
                    iframe.src = 'javascript:0'
                    iframe.style.display = 'none'
                    iframe.tabIndex = -1
                    document.body.appendChild(iframe)
                    that.iframe = iframe.contentWindow
                    var idoc = that.iframe.document
                    idoc.open()
                    idoc.write(that.iframeHTML)
                    idoc.close()
                })

            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            function checkUrl() {
                var iframe = that.iframe
                if (that.monitorMode === "iframepoll" && !iframe) {
                    return false
                }
                var pageHash = that.getFragment(), hash
                if (iframe) {//IE67
                    var iframeHash = that.getHash(iframe)
                    //与当前页面hash不等于之前的页面hash，这主要是用户通过点击链接引发的
                    if (pageHash !== that.fragment) {
                        var idoc = iframe.document
                        idoc.open()
                        idoc.write(that.iframeHTML)
                        idoc.close()
                        iframe.location.hash = that.prefix + pageHash
                        hash = pageHash
                        //如果是后退按钮触发hash不一致
                    } else if (iframeHash !== that.fragment) {
                        that.location.hash = that.prefix + iframeHash
                        hash = iframeHash
                    }

                } else if (pageHash !== that.fragment) {
                    hash = pageHash
                }
                if (hash !== void 0) {
                    that.fragment = hash
                    that.fireRouteChange(hash)
                }
            }

            //thanks https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange(IE8,IE9,FF3)
            // 否则的话只能每隔一段时间进行检测了(IE6, IE7)
            switch (this.monitorMode) {
                case "popstate":
                    this.checkUrl = avalon.bind(window, 'popstate', checkUrl)
                    this._fireLocationChange = checkUrl
                    break
                case  "hashchange":
                    this.checkUrl = avalon.bind(window, 'hashchange', checkUrl)
                    break;
                case  "iframepoll":
                    this.checkUrl = setInterval(checkUrl, this.options.interval)
                    break;
            }
            //根据当前的location立即进入不同的路由回调
            if (this.html5Mode) {
                this.fireRouteChange(this.getPath() || "/")
            } else {
                if (this.rootpath === location.href.replace(/\/$/, "")) {
                    return this.fireRouteChange("/")
                }
                var hash = this.getHash()
                if (hash) {
                    return this.fireRouteChange(hash)
                }
            }

        },
        fireRouteChange: function(hash) {
            var vms = avalon.vmodels
            for (var i in vms) {
                var v = vms[i]
                if (v && v.$events && v.$events.routeChangeStart) {
                    v.$fire("routeChangeStart", hash)
                    break;
                }
            }
            var router = avalon.router
            if (router && router.navigate) {
                router.setLatelyPath(hash)
                router.navigate("/" + hash)
            }
            if (this.options.fireAnchor) {
                scrollToAnchorId(hash)
            }
        },
        // 中断URL的监听
        stop: function() {
            avalon.unbind(window, "popstate", this.checkUrl)
            avalon.unbind(window, "hashchange", this.checkUrl)
            clearInterval(this.checkUrl)
            History.started = false
        },
        _updateLocation: function(hash) {
            if (this.monitorMode === "popstate") {
                var path = this.rootpath + hash
                history.pushState({path: path}, document.title, path)
                this._fireLocationChange()
            } else {
                this.location.hash = this.prefix + hash
            }
        }
    }
    avalon.history = new History

    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js

    var rurl = /^([\w\d]+):\/\/([\w\d\-_]+(?:\.[\w\d\-_]+)*)/
    //当用户点击页面的链接时，如果链接是指向当前网站并且以"#/"或"#!/"开头，那么触发_updateLocation方法
    avalon.bind(document, "click", function(event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false
        if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2)
            return
        var target = event.target
        while (target.nodeName !== "A") {
            target = target.parentNode
            if (!target || target.tagName === "BODY") {
                return
            }
        }
        var hostname = target.hostname
        if (!hostname) {//fix IE下通过ms-href动态生成href，不存在hostname属性的BUG
            var fullHref = !oldIE ? target + "" : target.getAttribute("href", 4)
            hostname = (fullHref.match(rurl) || ["", "", ""])[2]//小心javascript:void(0)
        }
        if (hostname === window.location.hostname && History.targetIsThisWindow(target.target)) {
            var path = target.getAttribute("href", 2)
            var hash = avalon.history._getHash(path)
            if (hash !== "") {
                event.preventDefault()
                avalon.history._updateLocation(hash)
                return false
            }
        }

    })

    //得到页面第一个符合条件的A标签
    function getFirstAnchor(list) {
        for (var i = 0, el; el = list[i++]; ) {
            if (el.nodeName === "A") {
                return el
            }
        }
    }

    function scrollToAnchorId(hash, el) {
        if ((el = document.getElementById(hash))) {
            el.scrollIntoView()
        } else if ((el = getFirstAnchor(document.getElementsByName(hash)))) {
            el.scrollIntoView()
        } else {
            window.scrollTo(0, 0)
        }
    }

    var root, states = {}, $state, queue = {}, abstractKey = 'abstract';
    root = registerState({
        name: '',
        url: '^',
        views: null,
        'abstract': true
    });
    root.navigable = null;
    avalon.state = function(name, definition) {
        /*jshint validthis: true */
        if (!avalon.isPlainObject(definition)) {
            definition = {}
        }
        definition.name = name;
        registerState(definition);
        return this;
    }


    function queueState(parentName, state) {
        if (!queue[parentName]) {
            queue[parentName] = [];
        }
        queue[parentName].push(state);
    }

    function registerState(state) {
        // Wrap a new object around the state so we can store our private details easily.
        state = avalon.mix(state, {
            self: state,
            resolve: state.resolve || {},
            toString: function() {
                return this.name;
            }
        });

        var name = state.name;
        if (avalon.type(name) !== "string" || name.indexOf('@') >= 0)
            throw new Error("State must have a valid name");
        if (states.hasOwnProperty(name))
            throw new Error("State '" + name + "'' is already defined");

        // 得到它的父点,如 "aaa.bbb.ccc" --> "aaa.bbb"
        var parentName = (name.indexOf(".") !== -1) ? name.substring(0, name.lastIndexOf('.'))
                : (avalon.type(state.parent) == "string") ? state.parent
                : '';

        //构建一个树
        if (parentName && !states[parentName]) {
            return queueState(parentName, state.self);
        }

//        for (var key in stateBuilder) {
//            if (isFunction(stateBuilder[key]))
//                state[key] = stateBuilder[key](state, stateBuilder.$delegates[key]);
//        }
//        states[name] = state;
//
//        // Register the state in the global state list and with $urlRouter if necessary.
//        if (!state[abstractKey] && state.url) {
//            $urlRouterProvider.when(state.url, ['$match', '$stateParams', function($match, $stateParams) {
//                    if ($state.$current.navigable != state || !equalForKeys($match, $stateParams)) {
//                        $state.transitionTo(state, $match, {location: false});
//                    }
//                }]);
//        }
//
//        // Register any queued children
//        if (queue[name]) {
//            for (var i = 0; i < queue[name].length; i++) {
//                registerState(queue[name][i]);
//            }
//        }

        return state;
    }



    //================================
    function Router() {
        this.routingTable = {};
    }
    function parseQuery(path) {
        var array = path.split("#"), query = {}, tail = array[1];
        if (tail) {
            var index = tail.indexOf("?");
            if (index > 0) {
                var seg = tail.slice(index + 1).split('&'),
                        len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue;
                    }
                    s = seg[i].split('=');
                    query[decodeURIComponent(s[0])] = decodeURIComponent(s[1]);
                }
            }
        }
        return {
            pathname: array[0],
            query: query
        };
    }


    var optionalParam = /\((.*?)\)/g
    var namedParam = /(\(\?)?:\w+/g
    var splatParam = /\*\w+/g
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g
    Router.prototype = {
        error: function(callback) {
            this.errorback = callback
        },
        _pathToRegExp: function(path, params) {
            path = path.replace(escapeRegExp, '\\$&')
                    .replace(optionalParam, '(?:$1)?')
                    .replace(namedParam, function(match, optional) {
                        params.push(match.slice(1))
                        return optional ? match : '([^/?]+)'
                    })
                    .replace(splatParam, '([^?]*?)');
            return new RegExp('^' + path + '(?:\\?([\\s\\S]*))?$')
        },
        //添加一个路由规则
        add: function(method, path, callback, subRoute) {
            var array = this.routingTable[method]
            if (!array) {
                array = this.routingTable[method] = []
            }
            var regexp = path, params = []
            if (avalon.type(path) !== "regexp") {
                regexp = this._pathToRegExp(regexp, params)
            }
            array.push({
                value: callback,
                regexp: regexp,
                params: params,
                subRoute: !!subRoute
            })
        },
        routeWithQuery: function(method, path) {
            var parsedUrl = parseQuery(path)
            return this.route(method, parsedUrl.pathname, parsedUrl.query);
        },
        _extractParameters: function(route, path, query) {
            var array = route.regexp.exec(path) || []
            array = array.slice(1)
            var args = [], params = {}
            var n = route.params.length
            for (var i = 0; i < n; i++) {
                if (typeof array[i] === "string") {
                    args[i] = decodeURIComponent(array[i])
                } else {
                    args[i] = void 0
                }
                args[ route.params[i] || i  ] = args[i]
            }
            return {
                query: query,
                value: route.value,
                args: args,
                params: params,
                path: path
            }
        },
        route: function(method, path, query) {//判定当前URL与预定义的路由规则是否符合
            path = path.trim()
            var array = this.routingTable[method] || [], ret = [], first = true
            for (var i = 0, el; el = array[i++]; ) {
                if (el.regexp.test(path)) {
                    var obj = this._extractParameters(el, path, query)
                    if (first) {
                        ret.push(obj)
                        first = false
                    } else if (el.subRoute) {
                        ret.push(obj)
                    }
                }
            }
            return ret
        },
        getLastPath: function() {
            return getCookie("msLastPath")
        },
        setLastPath: function(path) {
            setCookie("msLastPath", path)
        },
        navigate: function(url) {//传入一个URL，触发预定义的回调
            var match = this.routeWithQuery("GET", url)
            if (match.length) {
                for (var i = 0, el; el = match[i++]; ) {
                    var fn = el.value;
                    if (typeof fn === "function") {
                        fn.apply(el, el.args);
                    }
                }
            } else if (typeof this.errorback === "function") {
                this.errorback(url)
            }
        }
    };
    Router.prototype.getLatelyPath = Router.prototype.getLastPath
    Router.prototype.setLatelyPath = Router.prototype.setLastPath
    "get,put,delete,post".replace(avalon.rword, function(method) {
        return  Router.prototype[method] = function(path, fn) {
            return this.add(method.toUpperCase(), path, fn)
        }
    })
    function supportLocalStorage() {
        try {
            return 'localStorage' in window && window['localStorage'] !== null;
        } catch (e) {
            return false;
        }
    }
    if (supportLocalStorage()) {
        Router.prototype.getLatelyPath = function() {
            return localStorage.getItem("msLastPath")
        }
        Router.prototype.setLatelyPath = function(path) {
            localStorage.setItem("msLastPath", path)
        }
    }

    function escapeCookie(value) {
        return String(value).replace(/[,;"\\=\s%]/g, function(character) {
            return encodeURIComponent(character);
        });
    }
    function setCookie(key, value) {
        var date = new Date();//将date设置为10天以后的时间 
        date.setTime(date.getTime() + 60 * 60 * 24);
        document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ";expires=" + date.toGMTString()
    }
    function getCookie(name) {
        var result = {};
        if (document.cookie !== '') {
            var cookies = document.cookie.split('; ')
            for (var i = 0, l = cookies.length; i < l; i++) {
                var item = cookies[i].split('=');
                result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
            }
        }
        return name ? result[name] : result
    }

    avalon.router = new Router

    return avalon
})

// 主要参数有 basepath  html5Mode  hashPrefix  interval domain fireAnchor

/*
 移动解决方案
 
 活动/后台系统/前台系统
 •detective - 司徒
 •network monitor - 司徒
 •storage - 中文
 •amd - 林浩
 •manifest - 中文
 •route - 司徒
 •嵌入端支持(如微信) - 中文
 •native协议 - 瑶姐
 •响应式 - 瑶姐
 •手势和动画 - 中文
 •ui - 司徒
 <div ui-view></div> 
 $stateProvider.state("home", {
 template: "<h1>HELLO!</h1>"
 })
 </pre>
 
 
 <pre>
 $stateProvider.state("home", {
 views: {
 "": {
 template: "<h1>HELLO!</h1>"
 }
 }    
 })
 </pre>         
 <div ui-view="main"></div>
 </pre> 
 <pre>
 $stateProvider.state("home", {
 views: {
 "main": {
 template: "<h1>HELLO!</h1>"
 }
 }    
 }) 
 <pre>
 <div ui-view></div>
 <div ui-view="chart"></div> 
 <div ui-view="data"></div> 
 </pre>
 
 <pre>
 $stateProvider.state("home", {
 views: {
 "": {
 template: "<h1>HELLO!</h1>"
 },
 "chart": {
 template: "<chart_thing/>"
 },
 "data": {
 template: "<data_thing/>"
 }
 }    
 })
 </pre>
 */
