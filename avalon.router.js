/*********************************************************************
 *                            History                              *
 **********************************************************************/
//暴露如下接口：avalon.history.start, avalon.history.stop, avalon.history.interval
//avalon.Router.extend, avalon.Router.navigate
if (![].reduce) {
    Array.prototype.reduce = function(fn, lastResult, scope) {
        if (this.length == 0)
            return lastResult;
        var i = lastResult !== undefined ? 0 : 1;
        var result = lastResult !== undefined ? lastResult : this[0];
        for (var n = this.length; i < n; i++)
            result = fn.call(scope, result, this[i], i, this);
        return result;
    }
}
avalon.history = new function() {
    var oldIE = !"1" [0];
    var started = false;
    var self = this;
    var firstCheck;
    var iframeWin, iframe, history_hash, timeoutID;
    var last_hash = "#!" + getFragment();
    var supportPushState = /[native code]/.test(history.pushState);
    var html = '<!doctype html><html><body>@</body></html>';
    if (this.domain) {
        html = html.replace("<body>", "<script>document.domain =" + this.domain + "</script><body>");
    }
    function createIframe() {
        if (!iframe && oldIE) {
            iframe = document.createElement("iframe");
            iframe.tabIndex = -1;
            iframe.style.display = "none";
            iframe.src = "javascript:false";
            (document.body || document.documentElement).appendChild(iframe);
            var doc = iframe.contentDocument || iframe.contentWindow.document;
            doc.write(html.replace("@", last_hash));
            doc.close();
            timeoutID = setInterval(poll, self.interval);
        }
    }
    // IE6直接用location.hash取hash，可能会取少一部分内容
    // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
    // ie6 => location.hash = #stream/xxxxx
    // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
    // firefox 会自作多情对hash进行decodeURIComponent
    // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
    // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
    // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}
    function getHash(url, shim) {//用于取得当前窗口或iframe窗口的hash值
        url = url || document.URL;
        return  url.slice(url.indexOf("#") + (~~shim));
    }
    function getHistory() {
        return getHash(iframeWin.location);
    }
    function setHistory(hash, history_hash) {
        if (hash !== history_hash) {//只有当新hash不等于iframe中的hash才重写
            //用于产生历史
            try {
                var iframeDoc = getDoc();
                iframeDoc.open();
                iframeDoc.write(html.replace("@", hash));
                iframeDoc.close();
            } catch (e) {
                clearInterval(timeoutID);
            }
        }
    }
    function getFragment() {
        var href = location.href;
        var index = href.indexOf(location.pathname.slice(1));
        return href.slice(index);
    }
    function getDoc() {
        return iframe.contentDocument || iframe.contentWindow.document;
    }

    function poll(e) {
        if (iframe) {
            var iframeDoc = getDoc(),
                    hash = getHash();//取得主窗口中的hash
            history_hash = iframeDoc.body.innerText;//取得现在iframe中的hash
            if (hash !== last_hash) {//如果是主窗口的hash发生变化
                if (hash.indexOf("#!") !== 0) {
                    hash = "#!" + getFragment();
                    location.hash = hash;
                }
                if (!firstCheck) {
                    firstCheck = true;
                } else {
                    var path = hash.split("#")[2];
                    avalon.Router.navigate(typeof path === "string" ? path : new Date-0);
                    setHistory(last_hash = hash, history_hash);
                }
            } else if (history_hash !== last_hash) {//如果按下回退键，
                //  avalon.log("用户点了回退键,导致iframe中的hash发生变化" + history_hash);
                location.href = location.href.replace(/#.*/, '') + history_hash;
            }
        }
    }
    avalon.mix(this, {
        interval: 35,
        start: function(html5mode) {
            if (started)
                avalon.error("start已经触发过了");
            started = true;
            createIframe();
            this.html5mode = !!html5mode;
            if (window.opera || window.VBArray || !supportPushState) {
                this.html5mode = false;
            }
            //如果我们想在改动URL时不刷新地址
            // http://foo.com/bar?baz=23#bar
            // http://foo.com/#!/bar?bar=23#bar

            this.checkUrl = function() {
                if (!firstCheck) {
                    return firstCheck = true
                }
                var path = getHash(getFragment(), true);
                avalon.Router.navigate(path)
            }
            if (this.html5mode) { //如果支持pushState
                //http://caniuse.com/#search=pushstate
                window.addEventListener("popstate", this.checkUrl);
            } else if (window.opera || document.documentMode >= 8) {
                //http://caniuse.com/#search=pushstate
                this.checkUrl = avalon.bind(window, "hashchange", this.checkUrl);
            }
        },
        stop: function() {
            //停止事件监听或interval
            avalon.unbind(window, "popstate", this.checkUrl).unbind(window, "hashchange", this.checkUrl);
            clearInterval(timeoutID);
            started = false;
        }
    });
}
/*********************************************************************
 *                            Router                              *
 **********************************************************************/
new function() {
    //表的结构：method+segments.length 普通字段
    function _tokenize(pathStr) {
        var stack = [''];
        for (var i = 0; i < pathStr.length; i++) {
            var chr = pathStr.charAt(i);
            if (chr === '/') {//用于让后面的字符串相加
                stack.push('');
                continue;
            } else if (chr === '(') {
                stack.push('(');
                stack.push('');
            } else if (chr === ')') {
                stack.push(')');
                stack.push('');
            } else {
                stack[stack.length - 1] += chr;
            }
        }
        return stack.filter(function(str) {
            return str.length !== 0;
        });
    }
    ;
    //将(  ) 转换为数组的两端,最后构成一个多维数组返回
    function _parse(tokens) {
        var smallAst = [];
        var token;
        while ((token = tokens.shift()) !== void 0) {
            if (token.length <= 0) {
                continue;
            }
            switch (token) {
                case '(':
                    smallAst.push(_parse(tokens));
                    break;
                case ')':
                    return smallAst;
                default:
                    smallAst.push(token);
            }
        }
        return smallAst;
    }
    var combine = function(list, func) {
        var first = list.shift();
        var second = list.shift();
        if (second === undefined) {
            return first;
        }
        var combination = first.map(function(val1) {
            return second.map(function(val2) {
                return func(val1, val2);
            });
        }).reduce(function(val1, val2) {
            return val1.concat(val2);
        });
        if (list.length === 0) {
            return combination;
        } else {
            return combine([combination].concat(list), func);
        }
    };
    function parse(rule) {
        var tokens = _tokenize(rule);
        var ast = _parse(tokens);
        return ast;
    }

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

    Router.prototype = {
        _set: function(table, query, value) {
            var nextKey = query.shift();//构建一个前缀树，用于高速匹对给定的URL
            if (nextKey.length <= 0) {
                avalon.error('构建失败');
            }
            if (nextKey.charAt && nextKey.charAt(0) === ':') {//如果碰到参数
                var n = nextKey.substring(1);
                if (table.hasOwnProperty('^n') && table['^n'] !== n) {
                    return false;
                }
                table['^n'] = n;
                nextKey = '^v';
            }
            if (query.length === 0) {
                table[nextKey] = value;
                return true;
            } else {
                var nextTable = table.hasOwnProperty(nextKey) ?
                        table[nextKey] : table[nextKey] = {};
                return this._set(nextTable, query, value);
            }
        },
        add: function(method, path, value) {
            var ast = parse(path); //转换为抽象语法树

            var patterns = this._expandRules(ast);//进行全排列，应对可选的fragment

            if (patterns.length === 0) {
                var query = [method, 0];
                this._set(this.routingTable, query, value);
            } else {
                var self = this
                patterns.every(function(pattern) {
                    var length = pattern.length,
                            query = [method, length].concat(pattern);
                    return self._set(self.routingTable, query, value);
                });
            }
            return value;
        },
        routeWithQuery: function(method, path) {
            var parsedUrl = parseQuery(path),
                    ret = this.route(method, parsedUrl.pathname);
            if (ret) {
                ret.query = parsedUrl.query;
                return ret;
            }
        },
        route: function(method, path) {//将当前URL与
            path = path.trim();
            var splitted = path.split('/'),
                    query = Array(splitted.length),
                    index = 0,
                    params = {},
                    table = [],
                    args = [],
                    val, key, j;
            for (var i = 0; i < splitted.length; ++i) {
                val = splitted[i];
                if (val.length !== 0) {
                    query[index] = val;
                    index++;
                }
            }
            query.length = index;
            table = this.routingTable[method];
            if (table === void 0)
                return;
            table = table[query.length];
            if (table === void 0)
                return;
            for (j = 0; j < query.length; ++j) {
                key = query[j];
                if (table.hasOwnProperty(key)) {
                    table = table[key];
                } else if (table.hasOwnProperty('^v')) {
                    params[table['^n']] = key;
                    args.push(key)
                    table = table['^v'];
                } else {
                    return;
                }
            }
            return {
                query: {},
                args: args,
                params: params,
                value: table
            };
        },
        _expandRules: function(ast) {
            if (Array.isArray(ast) && ast.length === 0) {
                return [];
            }
            var self = this;
            var result = combine(ast.map(function(val) {
                if (typeof val === 'string') {
                    return [[val]];
                } else if (Array.isArray(val)) {
                    return self._expandRules(val).concat([[]]);
                } else {
                    throw new Error('这里的值只能是字符串或数组 {{' + val + '}}');
                }
            }), function(a, b) {
                return a.concat(b);
            });
            return result;
        }
    };
    var callbacks = {}, errback, router = new Router();
    avalon.Router = {
        extend: function(obj) {//定义所有路由规则
            if (typeof obj.routes === "object") {
                for (var i in obj.routes) {
                    if (i === "*error") {
                        errback = obj.routes[i]
                    } else {
                        router.add("GET", i, obj.routes[i]);
                    }
                }
            }
            for (var i in obj) {
                if (typeof obj[i] === "function") {
                    callbacks[i] = obj[i];
                }
            }
        },
        navigate: function(url) {//传入一个URL，触发预定义的回调
            var match = router.routeWithQuery("GET", url);
            if (match) {
                var key = match.value;
                if (typeof callbacks[key] === "function") {
                    return  callbacks[key].apply(match, match.args);
                }
            }
            if (typeof callbacks[errback] === "function") {
                callbacks[errback](url);
            }
        }
    };

}
