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
            var index = tail.indexOf("?")
            if (index > 0) {
                var seg = tail.slice(index + 1).split("&"),
                        len = seg.length, i = 0, s;
                for (; i < len; i++) {
                    if (!seg[i]) {
                        continue
                    }
                    s = seg[i].split("=")
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
        _pathToRegExp: function(pattern, opts) {
            var keys = opts.keys = []

            var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g,
                    compiled = '^', last = 0, m, name, regexp, segment,
                    segments = opts.segments = []

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
                segments.push(segment)
                last = placeholder.lastIndex
            }
            segment = pattern.substring(last);
            compiled += quoteRegExp(segment) + (opts.strict ? opts.last : "\/?") + '$';
            segments.push(segment);
            opts.regexp = new RegExp(compiled, opts.caseInsensitive ? 'i' : undefined);
            return opts

        },
        //添加一个路由规则
        add: function(method, path, callback) {

            var array = this.routingTable[method.toLowerCase()]

            if (path.charAt(0) !== "/") {
                throw "path必须以/开头"
            }
            var opts = {
                callback: callback
            }
            if (path.length > 2 && path[path.length - 1] === "/") {
                path = path.slice(0, -1)
                opts.last = "/"
            }

            avalon.Array.ensure(array, this._pathToRegExp(path, opts))
           // console.log(array)
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
                            var key = keys[j]
                            var value = args[j] || ""
                            if (typeof key.decode === "function") {//在这里尝试转换参数的类型
                                var val = key.decode(value)
                            } else {
                                try {
                                    val = JSON.parse(value)         
                                } catch (e) {
                                    val = value
                                }
                            }
                            args[j] = params[key.name] = val
                        }
                    }
                    return el.callback.apply(el, args)
                }
            }
            if (this.errorback) {
                this.errorback()
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
        },
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
                    return new Date(val)
                }
            },
            string: {
                pattern: "[^\/]*"
            },
            bool: {
                decode: function(val) {
                    return parseInt(val, 10) === 0 ? false : true;
                },
                pattern: "0|1"
            },
            int: {
                decode: function(val) {
                    return parseInt(val, 10);
                },
                pattern: "\d+"
            }
        }
    }


    "get,put,delete,post".replace(avalon.rword, function(method) {
        return  Router.prototype[method] = function(path, fn) {
            this.add(method, path, fn)
        }
    })
    function quoteRegExp(string, pattern, isOptional) {
        var result = string.replace(/[\\\[\]\^$*+?.()|{}]/g, "\\$&");
        if (!pattern)
            return result;
        var flag = isOptional ? '?' : '';
        return result + flag + '(' + pattern + ')' + flag;
    }
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
/*
 <!DOCTYPE html>
 <html>
 <head>
 <meta charset="utf-8">
 <title>路由系统</title>
 <script src="avalon.js"></script>
 <script>
 require(["mmRouter"], function() {
 var model = avalon.define('xxx', function(vm) {
 vm.currPath = ""
 })
 avalon.router.get("/aaa", function(a) {
 model.currPath = this.path
 })
 avalon.router.get("/bbb", function(a) {
 model.currPath = this.path
 })
 avalon.router.get("/ccc", function(a) {
 model.currPath = this.path
 })
 avalon.router.get("/ddd/:ddd", function(a) {//:ddd为参数
 avalon.log(a)
 model.currPath = this.path
 })
 avalon.router.get("/eee", function(a) {
 model.currPath = this.path
 })
 avalon.history.start({
 html5Mode: true,
 basepath: "/avalon"
 })
 avalon.scan()
 })
 </script>
 </head>
 <body >
 <div ms-controller="xxx">
 <ul>
 <li><a href="#!/aaa">aaa</a></li>
 <li><a href="#!/bbb">bbb</a></li>
 <li><a href="#!/ccc">ccc</a></li>
 <li><a href="#!/ddd/222">ddd</a></li>
 <li><a href="#!/eee">eee</a></li>
 </ul>
 <div style="color:red">{{currPath}}</div>
 <div style="height: 600px;width:1px;">
 
 </div>
 <p id="eee">会定位到这里</p>
 </div>
 
 </body>
 </html>
 
 */