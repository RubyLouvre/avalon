define(["avalon"], function(avalon) {
    avalon.bindingHandlers.view = function(data, vmodels) {
        var first = vmodels[0]
        first.$watch("routeChange", function() {
            data.element.innerHTML = new Date - 0
        })
    }

    var IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()
    var oldIE = window.VBArray && IEVersion <= 7
    var supportPushState = !!(window.history.pushState)
    var supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))



    var History = Backbone.History = function() {
        this.handlers = [];
        _.bindAll(this, 'checkUrl');

        // Ensure that `History` can be used outside of the browser.
        if (typeof window !== 'undefined') {
            this.location = window.location;
            this.history = window.history;
        }
    };

    // Cached regex for stripping a leading hash/slash and trailing space.
    var routeStripper = /^[#\/]|\s+$/g;

    // Cached regex for stripping leading and trailing slashes.
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for stripping urls of hash.
    var pathStripper = /#.*$/;

    // Has the history handling already been started?
    History.started = false;

    // Set up all inheritable **Backbone.History** properties and methods.
    avalon.mix(History.prototype, {
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval: 50,
        // Are we at the app root?
        atRoot: function() {
            var path = this.location.pathname.replace(/[^\/]$/, '$&/');
            return path === this.root && !this.location.search;
        },
        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },
        // Get the pathname and search params, without the root.
        getPath: function() {
            var path = decodeURI(this.location.pathname + this.location.search);
            var root = this.root.slice(0, -1);
            if (!path.indexOf(root))
                path = path.slice(root.length);
            return path.slice(1);
        },
        // Get the cross-browser normalized URL fragment from the path or hash.
        getFragment: function(fragment) {
            if (fragment == null) {
                if (this._hasPushState || !this._wantsHashChange) {
                    fragment = this.getPath();
                } else {
                    fragment = this.getHash();
                }
            }
            return fragment.replace(routeStripper, '');
        },
        // Start the hash change handling, returning `true` if the current URL matches
        // an existing route, and `false` otherwise.
        start: function(options) {
            if (History.started)
                throw new Error('history has already been started');
            History.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options = avalon.mix({root: '/'}, this.options, options);
            this.root = this.options.root;
            this._wantsHashChange = this.options.hashChange !== false;
            this._hasHashChange = supportHashChange
            this._wantsPushState = !!this.options.pushState
            this._hasPushState = !!(this.options.pushState && supportPushState);
            this.fragment = this.getFragment();



            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            // Proxy an iframe to handle location events if the browser doesn't
            // support the `hashchange` event, HTML5 history, or the user wants
            // `hashChange` but not `pushState`.
            if (!this._hasHashChange && this._wantsHashChange && (!this._wantsPushState || !this._hasPushState)) {
                var iframe = document.createElement('iframe');
                iframe.src = 'javascript:0';
                iframe.style.display = 'none';
                iframe.tabIndex = -1;
                var body = document.body;
                // Using `appendChild` will throw on IE < 9 if the document is not ready.
                this.iframe = body.insertBefore(iframe, body.firstChild).contentWindow;
                this.navigate(this.fragment);
            }

            // Depending on whether we're using pushState or hashes, and whether
            // 'onhashchange' is supported, determine how we check the URL state.
            if (this._hasPushState) {
                this._checkUrl = avalon.bind(window, 'popstate', this.checkUrl);
            } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
                this._checkUrl = avalon.bind(window, 'hashchange', this.checkUrl);
            } else if (this._wantsHashChange) {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            // Transition from hashChange to pushState or vice versa if both are
            // requested.
            if (this._wantsHashChange && this._wantsPushState) {

                // If we've started off with a route from a `pushState`-enabled
                // browser, but we're currently in a browser that doesn't support it...
                if (!this._hasPushState && !this.atRoot()) {
                    this.location.replace(this.root + '#' + this.getPath());
                    // Return immediately as browser will do redirect to new url
                    return true;

                    // Or if we've started out with a hash-based route, but we're currently
                    // in a browser where it could be `pushState`-based instead...
                } else if (this._hasPushState && this.atRoot()) {
                    this.navigate(this.getHash(), {replace: true});
                }

            }

            if (!this.options.silent)
                return this.loadUrl();
        },

        stop: function() {
            //移除之前绑定的popstate/hashchange事件
            if (this._hasPushState) {
                avalon.unbind(window, 'popstate', this._checkUrl);
            } else if (this._wantsHashChange && this._hasHashChange && !this.iframe) {
                avalon.unbind(window, 'hashchange', this._checkUrl);
            }
            // 移除之前动态插入的iframe
            if (this.iframe) {
                document.body.removeChild(this.iframe.frameElement);
                this.iframe = null;
            }
            // 中断轮询
            if (this._checkUrlInterval)
                clearInterval(this._checkUrlInterval);
            History.started = false;
        },

        //用于添加路则规则及对应的回调
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },
        //比较前后的路径或hash是否发生改变,如果发生改变则调用navigate与loadUrl方法
        checkUrl: function(e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getHash(this.iframe);
            }
            if (current === this.fragment)
                return false;
            if (this.iframe)
                this.navigate(current);
            this.loadUrl();
        },
        // Attempt to load the current URL fragment. If a route succeeds with a
        // match, returns `true`. If no defined routes matches the fragment,
        // returns `false`.
        loadUrl: function(fragment) {
            fragment = this.fragment = this.getFragment(fragment);
            return this.handlers.some(function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },
//    规则中的*（星号）会在Router内部被转换为表达式(.*?)，表示零个或多个任意字符，
//    与:（冒号）规则相比，*（星号）没有/（斜线）分隔的限制，就像我们在上面的例子中定义的*error规则一样。
//　　Router中的*（星号）规则在被转换为正则表达式后使用非贪婪模式，因此你可以使用例如这样的组合规则
//  ：*type/:id，它能匹配#hot/1023，同时会将hot和1023作为参数传递给Action方法。
        //此方法用于修改地址栏的可变部分（IE67还负责产生新历史）
        navigate: function(fragment, options) {
            if (!History.started)
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
            if (options.trigger)
                return this.loadUrl(fragment)
        },
        //更新hash
        _updateHash: function(location, fragment, replace) {
            if (replace) {
                var href = location.href.replace(/(javascript:|#).*$/, '');
                location.replace(href + '#' + fragment);
            } else {
                // Some browsers require that `hash` contains a leading #.
                location.hash = '#' + fragment;
            }
        }

    });

    // Create the default Backbone.history.
    Backbone.history = new History;

})