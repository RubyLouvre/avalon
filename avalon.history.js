define(["avalon"], function(avalon) {
    var History = avalon.History = function() {
        this.handlers = [];
        // _.bindAll(this, 'checkUrl');
        this.location = window.location;
        this.history = window.history;

    };

    //去掉最左的斜线或# 或最右的空格
    var routeStripper = /^[#\/]|\s+$/g;

    // 去最左右两边的斜线
    var rootStripper = /^\/+|\/+$/g;

    // Cached regex for removing a trailing slash.
    var trailingSlash = /\/$/;

    // Has the history handling already been started?
    History.started = false;
    History.getIEVersion = function() {
        var ret, v = 3, div = document.createElement('div'), a = div.all || [];
        while (div.innerHTML = '<!--[if gt IE ' + (++v) + ']><br><![endif]-->', a[0])
            ret = v > 4 ? v : !v;
        History.getIEVersion = function() {//惰性函数，重写自身
            return ret
        }
        return ret
    }

    // Set up all inheritable **Backbone.History** properties and methods.
    avalon.mix(History.prototype, {
        // The default interval to poll for hash changes, if necessary, is
        // twenty times a second.
        interval: 50,
        // Gets the true hash value. Cannot use location.hash directly due to bug
        // in Firefox where location.hash will always be decoded.
        getHash: function(window) {
            var match = (window || this).location.href.match(/#(.*)$/);
            return match ? match[1] : '';
        },
        // Get the cross-browser normalized URL fragment, either from the URL,
        // the hash, or the override.
        getFragment: function(fragment) {
            if (fragment == null) {
                if (this.html5Mode) {
                    fragment = this.location.pathname;
                    var root = this.root.replace(trailingSlash, '');
                    if (!fragment.indexOf(root))
                        fragment = fragment.slice(root.length);
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
                throw new Error("avalon.history has already been started");
            History.started = true;

            // Figure out the initial configuration. Do we need an iframe?
            // Is pushState desired ... is it available?
            this.options = avalon.mix({}, {root: '/'}, this.options, options);
            this.root = this.options.root;

            this.supportPushState = !!(this.history && this.history.pushState);
            this.supportHashChange = (('onhashchange' in window) ||
                    ('onhashchange' in document)) && (!window.VBArray || History.getIEVersion())
            this.html5Mode = this.options.html5Mode;
            if (!this.supportPushState) {
                avalon.log("当然浏览器不支持HTML5 pushState，强制使用hash hack!")
                this.html5Mode = false
            }

            var fragment = this.getFragment();

            var oldIE = window.VBArray && History.getIEVersion() <= 7

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');

            if (oldIE && !this.html5Mode) {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                var iframe = avalon.parseHTML('<iframe src="javascript:0" tabindex="-1" style="display:none" />')[0]
                document.body.appendChild(iframe)
                this.iframe = iframe.contentWindow;
                this.navigate(fragment);
            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            if (this.html5Mode) {
                this.checkUrlCallback = avalon.bind(window, 'popstate', this.checkUrl);
            } else if (this.supportHashChange) {
                this.checkUrlCallback = avalon.bind(window, 'hashchange', this.checkUrl);
            } else {
                this._checkUrlInterval = setInterval(this.checkUrl, this.interval);
            }

            // Determine if we need to change the base url, for a pushState link
            // opened by a non-pushState browser.
            this.fragment = fragment;
            var loc = this.location;
            var atRoot = loc.pathname.replace(/[^\/]$/, '$&/') === this.root;

            // 兼容性处理 参数设置与当前浏览器支持情况冲突的时候
            if (!this.supportPushState && !atRoot) {
                this.fragment = this.getFragment(null, true);
                this.location.replace(this.root + this.location.search + '#' + this.fragment);
                // Return immediately as browser will do redirect to new url
                return true;


            } else if (this.supportPushState && atRoot && loc.hash) {
                this.fragment = this.getHash().replace(routeStripper, '');
                this.history.replaceState({}, document.title, this.root + this.fragment + loc.search);
            }

            if (!this.options.silent)
                return this.loadUrl();
        },
        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function() {
            avalon.unbind(window, "popstate", this.checkUrlCallback)
            avalon.unbind(window, "hashchange", this.checkUrlCallback)
            clearInterval(this._checkUrlInterval);
            History.started = false;
        },
        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },
        // Checks the current URL to see if it has changed, and if it has,
        // calls `loadUrl`, normalizing across the hidden iframe.
        checkUrl: function(e) {
            var current = this.getFragment();
            if (current === this.fragment && this.iframe) {
                current = this.getFragment(this.getHash(this.iframe));
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
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride);
            return _.any(this.handlers, function(handler) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            });
        },
        navigate: function(fragment, options) {
            if (!History.started)
                return false;
            if (!options || options === true)
                options = {trigger: !!options};

            fragment = this.getFragment(fragment || '');
            if (this.fragment === fragment)
                return;
            this.fragment = fragment;

            var url = this.root + fragment;

            // Don't include a trailing slash on the root.
            if (fragment === '' && url !== '/')
                url = url.slice(0, -1);

            // If pushState is available, we use it to set the fragment as a real URL.
            if (this.html5Mode) {
                this.history[options.replace ? 'replaceState' : 'pushState']({}, document.title, url);

                // If hash changes haven't been explicitly disabled, update the hash
                // fragment to store history.
            } else {
                this._updateHash(this.location, fragment, options.replace);
                if (this.iframe && (fragment !== this.getFragment(this.getHash(this.iframe)))) {
                    // Opening and closing the iframe tricks IE7 and earlier to push a
                    // history entry on hash-tag change.  When replace is true, we don't
                    // want this.
                    if (!options.replace)
                        this.iframe.document.open().close();
                    this._updateHash(this.iframe.location, fragment, options.replace);
                }

            } 
            if (options.trigger)
                return this.loadUrl(fragment);
        },
        // Update the hash location, either replacing the current entry, or adding
        // a new one to the browser history.
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


    avalon.history = new History;

    return avalon
})
