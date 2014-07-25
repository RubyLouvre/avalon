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
        add: function(method, path, callback) {
            var array = this.routingTable[method]
            if (!array) {
                array = this.routingTable[method] = []
            }
            var regexp = path, params = []
            if (avalon.type(path) !== "regexp") {
                regexp = this._pathToRegExp(regexp, params)
            }
            var obj = avalon.isPlainObject(callback) ? callback :
                    avalon.type(callback) === "function" ? {
                callback: callback
            } : {}
            obj.regexp = regexp
            obj.params = params
            obj.callback = obj.callback || avalon.noop
            obj.view = typeof obj.view === "string" ? obj.view : ""
            array.push(obj)
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
                params[ route.params[i] || i  ] = args[i]
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
            var array = this.routingTable[method] || [], ret = []
            for (var i = 0, el; el = array[i++]; ) {
                if (el.regexp.test(path)) {
                    return this._extractParameters(el, path, query)
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
            if (match) {
                var element = match.element = avalon.views[match.view]
                function callback() {
                    if (match.template) {
                        avalon.innerHTML(element, match.template)
                    }
                    match.callback.apply(match, match.args)
                }
                if (element) {
                    if (match.template) {
                        callback()
                    } else if (match.templateUrl) {
                        var request = typeof match.templateUrl === "function" ?
                                match.templateUrl.call(match, match.args) : match.templateUrl
                        avalon.require("text!" + request, function(template) {
                            match.template = template
                            callback()
                        })
                    }
                } else {
                    match.callback.apply(match, match.args)
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
            return encodeURIComponent(character)
        });
    }
    function setCookie(key, value) {
        var date = new Date()//将date设置为10天以后的时间 
        date.setTime(date.getTime() + 60 * 60 * 24)
        document.cookie = escapeCookie(key) + '=' + escapeCookie(value) + ";expires=" + date.toGMTString()
    }
    function getCookie(name) {
        var result = {};
        if (document.cookie !== '') {
            var cookies = document.cookie.split('; ')
            for (var i = 0, l = cookies.length; i < l; i++) {
                var item = cookies[i].split('=')
                result[decodeURIComponent(item[0])] = decodeURIComponent(item[1]);
            }
        }
        return name ? result[name] : result
    }

    avalon.router = new Router

    return avalon
})