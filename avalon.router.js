define(["avalon"], function(avalon) {
    avalon.bindingHandlers.view = function(data, vmodels) {
        var first = vmodels[0]
        data.element.innerHTML = "&nbsp;"
        first.$watch("routeChangeStart", function(fragment) {
            data.element.innerHTML = fragment || new Date - 0
        })
    }

    var IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()
    var oldIE = window.VBArray && IEVersion <= 7
    var supportPushState = !!(window.history.pushState)
    var supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))



    var History = function() {
        this.handlers = []
        this.started = false
        this.location = window.location
        this.history = window.history
    }

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g

    // Cached regex for stripping urls of hash.
    var pathStripper = /#.*$/


    avalon.mix(History.prototype, {
        interval: 50,
        atRoot: function() {
            var path = this.location.pathname.replace(/[^\/]$/, '$&/')
            return path === this.root && !this.location.search
        },
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/)
            return match ? match[1] : ''
        },
        getPath: function() {
            var path = decodeURI(this.location.pathname + this.location.search)
            var root = this.root.slice(0, -1)
            if (!path.indexOf(root))
                path = path.slice(root.length)
            return path.slice(1)
        },
        //根据monitorMode调用getPath或getHash
        getFragment: function(fragment) {
            if (fragment == null) {
                if (this.monitorMode === "popstate") {
                    fragment = this.getPath();
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, "")
        },
        start: function(options) {
            if (options === true) {
                options = {
                    html5Mode: true
                }
            }
            if (this.started)
                throw new Error('history has already been started')
            this.started = true
            this.options = avalon.mix({root: '/'}, this.options, options)
            this.root = this.options.root
            this.supportPushState = supportPushState
            this.supportHashChange = supportHashChange
            this.monitorMode = this.options.html5Mode ? "popstate" : "hashchange"

            if (!this.supportPushState) {
                this.monitorMode = "hashchange"
            }
            if (!this.supportHashChange) {
                this.monitorMode = "iframepool"
            }

            this.fragment = this.getFragment()
            avalon.log("start monitoring")
            //确认前后都存在斜线， 如"aaa/ --> /aaa/" , "/aaa --> /aaa/", "aaa --> /aaa/", "/ --> /"
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');
            //   alert(this.root)
            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            switch (this.monitorMode) {
                case "popstate":
                    this._checkUrl = avalon.bind(window, 'popstate', this.checkUrl)
                    break
                case  "hashchange":
                    this._checkUrl = avalon.bind(window, 'hashchange', this.checkUrl);
                    break
                case "iframepool":
                    var iframe = document.createElement('iframe');
                    iframe.src = 'javascript:0'
                    iframe.style.display = 'none'
                    iframe.tabIndex = -1
                    this.iframe = true
                    var body = document.body || document.documentElement;
                    this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
                    this.navigate(this.fragment);
                    avalon.ready(function() {
                        body.appendChild(iframe).contentWindow;
                    })
                    this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
                    break;
            }

            if (!this.options.silent) {
                this.fireRouteChange()
            }
        },
        stop: function() {
            //移除之前绑定的popstate/hashchange事件
            switch (this.monitorMode) {
                case "popstate":
                    avalon.unbind(window, "popstate", this._checkUrl)
                    break
                case "popstate":
                    avalon.unbind(window, "hashchange", this._checkUrl)
                    break
                case  "iframepool":
                    // 移除之前动态插入的iframe
                    if (this.iframe) {
                        document.body.removeChild(this.iframe.frameElement)
                        this.iframe = null
                    }
                    clearInterval(this._checkUrlInterval)// 中断轮询
                    break;
            }
            this.started = false
        },
        //用于添加路则规则及对应的回调
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback})
        },
        //比较前后的路径或hash是否发生改变,如果发生改变则调用navigate与fireRouteChange方法
        checkUrl: function() {
            var that = avalon.history
            var current = that.getFragment();
            if (current === that.fragment && that.iframe) {
                current = that.getHash(that.iframe)
            }
            if (current === that.fragment)
                return false;
            if (that.iframe)
                that.navigate(current)
            avalon.log("checkUrl")
            that.fireRouteChange(current)
        },
        fireRouteChange: function(fragment) {
            var vs = avalon.vmodels
            for (var v in vs) {
                vs[v].$fire("routeChangeStart", fragment)
            }
        },
//    规则中的*（星号）会在Router内部被转换为表达式(.*?)，表示零个或多个任意字符，
//    与:（冒号）规则相比，*（星号）没有/（斜线）分隔的限制，就像我们在上面的例子中定义的*error规则一样。
//　　Router中的*（星号）规则在被转换为正则表达式后使用非贪婪模式，因此你可以使用例如这样的组合规则
//  ：*type/:id，它能匹配#hot/1023，同时会将hot和1023作为参数传递给Action方法。
        //此方法用于修改地址栏的可变部分（IE67还负责产生新历史）
        navigate: function(fragment, options) {
            if (!this.started)
                return false;
            if (!options || options === true)
                options = {trigger: !!options};

            var url = this.root + (fragment = this.getFragment(fragment || ''));

            fragment = decodeURI(fragment.replace(pathStripper, ''));
            //fragment就是路由可变动的部分,被decodeURI过的
            if (this.fragment === fragment)
                return;
            this.fragment = fragment;

            // Don't include a trailing slash on the root.
            if (fragment === '' && url !== '/')
                url = url.slice(0, -1);

            //如果支持pushState,那么就使用replaceState,pushState,API
            //注意replace是不会产生历史
            if (this._hasPushState) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url)
            } else if (this._wantsHashChange) {
                //更新当前页面的地址栏的hash值
                this._updateHash(this.location, fragment, options.replace)
                if (this.iframe && (fragment !== this.getHash(this.iframe))) {
                    //在IE67下需要通过创建或关闭一个iframe来产生历史
                    if (!options.replace)
                        this.iframe.document.open().close()
                    //更新iframe的地址栏的hash值
                    this._updateHash(this.iframe.location, fragment, options.replace)
                }
            } else {
                //直接刷新页面
                return this.location.assign(url)
            }
        },
        //更新hash
        _updateHash: function(location, fragment, replace) {
            if (replace) {//如果不产生历史
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }

    })

    //创建一个History单例
    avalon.history = new History
    return avalon
})
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
 */