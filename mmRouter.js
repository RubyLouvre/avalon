define(["mmHistory"], function() {

    function Router() {
        var table = {}
        "get,post,delete,put".replace(avalon.rword, function(name) {
            table[name] = []
        })
        this.routingTable = table
    }

    function parseQuery(url) {
        var array = url.split("?"), query = {}, path = array[0], querystring = array[1]
        if (querystring) {
            var seg = querystring.split("&"),
                    len = seg.length, i = 0, s;
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

    var placeholder = /([:*])(\w+)|\{(\w+)(?:\:((?:[^{}\\]+|\\.|\{(?:[^{}\\]+|\\.)*\})+))?\}/g
    Router.prototype = {
        error: function(callback) {
            this.errorback = callback
        },
        _pathToRegExp: function(pattern, opts) {
            var keys = opts.keys = [],
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
        add: function(method, path, callback, opts) {

            var array = this.routingTable[method.toLowerCase()]
            if (path.charAt(0) !== "/") {
                throw "path必须以/开头"
            }
            opts = opts || {}
            opts.callback = callback
            if (path.length > 2 && path.charAt(path.length - 1) === "/") {
                path = path.slice(0, -1)
                opts.last = "/"
            }

            avalon.Array.ensure(array, this._pathToRegExp(path, opts))
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
                    args.shift()
                    if (keys.length) {
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
        return  Router.prototype[method] = function(a, b, c) {
            this.add(method, a, b, c)
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
        Router.prototype.getLastPath = function() {
            return localStorage.getItem("msLastPath")
        }
        Router.prototype.setLastPath = function(path) {
            localStorage.setItem("msLastPath", path)
        }
    }

    var findNode = function(str) {
        var match = str.match(ravalon)
        var all = document.getElementsByTagName(match[1] || "*")
        for (var i = 0, el; el = all[i++]; ) {
            if (el.getAttribute(match[2]) === match[3]) {
                return el
            }
        }
    }
    var ravalon = /(\w+)\[(avalonctrl)="(\d+)"\]/

    function getViews(ctrl) {
        var v = avalon.vmodels[ctrl]
        var expr = v && v.$events.expr || "[ms-controller='" + ctrl + "']"
        var nodes = []
        if (expr) {
            if (document.querySelectorAll) {
                nodes = document.querySelectorAll(expr + " [ms-view]")
            } else {
                var root = findNode(expr)
                if (root) {
                    nodes = Array.prototype.filter.call(root.getElementsByTagName("*"), function(node) {
                        return typeof node.getAttribute("ms-view") === "string"
                    })
                }
            }
        }
        return nodes
    }
    function getNamedView(nodes, name) {
        for (var i = 0, el; el = nodes[i++]; ) {
            if (el.getAttribute("ms-view") === name) {
                return el
            }
        }
    }

    function fromString(template, params) {
        return typeof template === "function" ? template(params) : template
    }
    function fromUrl(url, params) {
        if (typeof url === "function")
            url = url(params)
        if (url == null)
            return null
        var reject, resolve
        var promise = new Promise(function(a, b) {
            a = resolve, b = reject
        })
        var xhr = getXHR()
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                var status = xhr.status;
                if (status > 399 && status < 600) {
                    reject(new Error(url + " 对应资源不存在或没有开启 CORS"))
                } else {
                    resolve(xhr.responseText)
                }
            }
        }
        xhr.open("GET", url, true)
        if ("withCredentials" in xhr) {
            xhr.withCredentials = true
        }
        xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest")
        xhr.send()
        return promise
    }
    function fromConfig(config, params) {
        return (config.template ? fromString(config.template, params) :
                config.templateUrl ? fromUrl(config.templateUrl, params) :
                config.templateProvider)
    }
    avalon.state = function(name, opts) {
        opts.state = name
        avalon.router.get(opts.url, function() {
            var ctrl = opts.controller
            // var vmodel = avalon.vmodels[ctrl]
            var views = getViews(ctrl)
            if (!opts.views) {
                var node = getNamedView(views, "")
                if (node) {
                    var a = fromConfig(opts, this.params)
                    if (typeof a === "string") {
                        avalon.innerHTML(node, a)
                    } else if (a && a.then) {
                        a.then(function(s) {
                            avalon.innerHTML(node, s)
                        })
                    }
                }
            }
        }, opts)
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