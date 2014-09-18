define(["mmHistory"], function() {
    function Router() {
        var table = {}
        "get,post,delete,put".replace(avalon.rword, function(name) {
            table[name] = []
        })
        this.routingTable = table
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
                        continue
                    }
                    s = seg[i].split('=');
                    query[decodeURIComponent(s[0])] = decodeURIComponent(s[1])
                }
            }
        }
        return {
            path: array[0],
            query: query
        }
    }


    Router.prototype = {
        error: function(callback) {
            this.errorback = callback
        },
        _pathToRegExp: function(path, opts) {
            var insensitive = opts.caseInsensitiveMatch
            var keys = opts.keys = []
            path = path
                    .replace(/([().])/g, '\\$1')
                    .replace(/(\/)?:(\w+)([\?\*])?/g, function(_, slash, key, option) {
                        var optional = option === '?' ? option : null;
                        var star = option === '*' ? option : null;
                        keys.push({name: key, optional: !!optional});
                        slash = slash || '';
                        return ''
                                + (optional ? '' : slash)
                                + '(?:'
                                + (optional ? slash : '')
                                + (star && '(.+?)' || '([^/]+)')
                                + (optional || '')
                                + ')'
                                + (optional || '')
                    })
                    .replace(/([\/$\*])/g, '\\$1')

            opts.regexp = new RegExp('^' + path + '$', insensitive ? 'i' : '');
            return opts;

        },
        //添加一个路由规则
        add: function(method, path, callback) {
          
            var array = this.routingTable[method.toLowerCase()]

            if (path.charAt(0) !== "/") {
                throw "path必须以/开头"
            }
            avalon.Array.ensure(array,
                    this._pathToRegExp(path, {callback: callback}))
            var redirectPath = (path[path.length - 1] === "/")
                    ? path.substr(0, path.length - 1)
                    : path + "/"
            avalon.Array.ensure(array,
                    this._pathToRegExp(redirectPath, {redirectTo: path, callback: callback}))
                  
        },
        route: function(method, path, query) {//判定当前URL与预定义的路由规则是否符合
            path = path.trim()
            var array = this.routingTable[method]
            for (var i = 0, el; el = array[i++]; ) {
                var args = path.match(el.regexp)
                if (args) {
                    el.query = query || {}
                    el.path = path
                    var params = el.params = {}
                    var keys = el.keys
                    if (keys.length) {
                        args.shift()
                        for (var j = 0, jn = keys.length; j < jn; j++) {
                            params[keys[j]] = args[j] || ""
                        }
                    }
                    el.callback.apply(el, args)
                    break
                }
            }
        },
        getLastPath: function() {
            return getCookie("msLastPath")
        },
        setLastPath: function(path) {
            setCookie("msLastPath", path)
        },
        navigate: function(hash) {
            var parsed = parseQuery(hash)
            this.route("get", parsed.path, parsed.query)
        }
    }

    Router.prototype.getLatelyPath = Router.prototype.getLastPath
    Router.prototype.setLatelyPath = Router.prototype.setLastPath
    "get,put,delete,post".replace(avalon.rword, function(method) {
        return  Router.prototype[method] = function(path, fn) {
            this.add(method, path, fn)
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