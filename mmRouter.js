define(["mmHistory"], function() {
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
        }
    }

    var optionalParam = /\((.*?)\)/g
    var namedParam = /(\(\?)?:\w+/g
    var splatParam = /\*\w+/g
    var escapeRegExp = /[\-{}\[\]+?.,\\\^$|#\s]/g
    Router.prototype = {
        error: function(callback) {
            this.errorback = callback
        },
        _pathToRegExp: function(path, names) {
            path = path.replace(escapeRegExp, '\\$&')
                    .replace(optionalParam, '(?:$1)?')
                    .replace(namedParam, function(match, optional) {
                        names.push(match.slice(1))
                        return optional ? match : '([^/?]+)'
                    })
                    .replace(splatParam, '([^?]*?)');
            return new RegExp('^' + path + '(?:\\?([\\s\\S]*))?$')
        },
        //添加一个路由规则
        add: function(method, path, callback) {
            var array = this.routingTable[method]
            if (!array) {
                array = this.routingTable[method] = []
            }
            var regexp = path, names = []
            if (avalon.type(path) !== "regexp") {
                regexp = this._pathToRegExp(regexp, names)
            }
            var obj = avalon.isPlainObject(callback) ? callback :
                    avalon.type(callback) === "function" ? {
                callback: callback
            } : {}
            obj.regexp = regexp
            obj.names = names
            obj.templates = {}
            obj.callback = obj.callback || avalon.noop
            obj.view = typeof obj.view === "string" ? obj.view : ""
            array.push(obj)
        },
        routeWithQuery: function(method, path) {
            var parsed = parseQuery(path)
            return this.route(method, parsed.pathname, parsed.query);
        },
        _extractParameters: function(route, path, query) {
            var array = route.regexp.exec(path) || []
            array = array.slice(1)
            var args = [], params = {}
            var n = route.names.length

            for (var i = 0; i < n; i++) {
                if (typeof array[i] === "string") {
                    args[i] = decodeURIComponent(array[i])
                } else {
                    args[i] = void 0
                }
                params[ route.names[i] || i  ] = args[i]
            }
            return avalon.mix(route, {
                query: query,
                args: args,
                params: params,
                path: path
            })
        },
        route: function(method, path, query) {//判定当前URL与预定义的路由规则是否符合
            path = path.trim()
            var array = this.routingTable[method] || []
            for (var i = 0, el; el = array[i++]; ) {
                if (el.regexp.test(path)) {
                    return this._extractParameters(el, path, query)
                }
            }
        },
        getLastPath: function() {
            return getCookie("msLastPath")
        },
        setLastPath: function(path) {
            setCookie("msLastPath", path)
        },
        navigate: function(url) {//传入一个URL，触发预定义的回调
            // routeWithQuery --> route --> _extractParameters
            var match = this.routeWithQuery("GET", url)
            if (match) {
                var element = match.element = avalon.views[match.view]
                if (!element) {//如果还没有扫描到，需要手动扫描
                    var all = document.getElementsByTagName("*")
                    for (var i = 0, node; node = all[i++]; ) {
                        if (node.getAttribute("ms-view") === match.view) {
                            match.element = element = node
                            break
                        }
                    }
                }
                function get(match, name) {
                    return typeof match[name] === "function" ? match[name].apply(match, match.args) : match[name]
                }
                function callback() {
                    if (match.template) {
                        avalon.innerHTML(element, get(match, "template"))
                    }
                    match.callback.apply(match, match.args)
                }
                if (element) {
                    if (match.templateUrl || match.templateUrl === "") {
                        url = get(match, "templateUrl")
                        if (match.templates[url]) {
                            match.template = match.templates[url]
                            callback()
                        } else {
                            avalon.require("text!" + url, function(template) {
                                match.template = match.templates[url] = template
                                callback()
                            })
                        }
                    } else if (match.template || match.template === "") {
                        callback()
                    }
                } else {
                    match.callback.apply(match, match.args)
                }
            } else if (typeof this.errorback === "function") {
                this.errorback(url)
            }
        }
    }

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
            return encodeURIComponent(character)
        });
    }
    function setCookie(key, value) {
        var date = new Date()//将date设置为10天以后的时间 
        date.setTime(date.getTime() + 60 * 60 * 24)
        document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ";expires=" + date.toGMTString()
    }
    function getCookie(name) {
        var m = String(document.cookie).match(new RegExp('(?:^| )' + name + '(?:(?:=([^;]*))|;|$)')) || ["", ""]
        return decodeURIComponent(m[1])
    }

    avalon.router = new Router

    return avalon
})