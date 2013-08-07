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
    History.IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })();
    var defaults = {root: '/', html5Mode: true}


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
            this.options = avalon.mix({}, defaults, this.options, options);
            this.root = this.options.root;
            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释

            var oldIE = window.VBArray && History.IEVersion <= 7
            this.supportPushState = !!(this.history && this.history.pushState);
            this.supportHashChange = !!('onhashchange' in window && (window.VBArray || oldIE))

            this.html5Mode = this.options.html5Mode;
            if (!this.supportPushState) {
                avalon.log("当然浏览器不支持HTML5 pushState，强制使用hash hack!")
                this.html5Mode = false
            }

            var fragment = this.getFragment();

            // Normalize root to always include a leading and trailing slash.
            this.root = ('/' + this.root + '/').replace(rootStripper, '/');
            avalon.log(this.root)
            if (oldIE && !this.html5Mode) {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                avalon.log("IE6,7， 需要注入一个iframe来产生历史")
                var iframe = avalon.parseHTML('<iframe src="javascript:0" tabindex="-1" style="display:none" />').firstChild
                document.body.appendChild(iframe)
                this.iframe = iframe.contentWindow;
                this.navigate(fragment);
            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            var instance = this
            function checkUrl(e) {
                var current = instance.getFragment();
                if (current === instance.fragment && instance.iframe) {
                    current = instance.getFragment(instance.getHash(instance.iframe));
                }
                if (current === instance.fragment)
                    return false;
                if (instance.iframe)
                    instance.navigate(current);
                instance.loadUrl();
            }

            if (this.html5Mode) {
                this.checkUrl = avalon.bind(window, 'popstate', checkUrl);
            } else if (this.supportHashChange) {
                this.checkUrl = avalon.bind(window, 'hashchange', checkUrl);
            } else {
                this.checkUrlID = setInterval(checkUrl, this.interval);
            }
            return
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

            if (!this.options.silent) {
                //   return this.loadUrl();
            }

        },
        // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
        // but possibly useful for unit testing Routers.
        stop: function() {
            avalon.unbind(window, "popstate", this.checkUrl)
            avalon.unbind(window, "hashchange", this.checkUrl)
            clearInterval(this.checkUrlID);
            History.started = false;
        },
        // Add a route to be tested when the fragment changes. Routes added later
        // may override previous routes.
        route: function(route, callback) {
            this.handlers.unshift({route: route, callback: callback});
        },
        //处理路由函数
        loadUrl: function(fragmentOverride) {
            var fragment = this.fragment = this.getFragment(fragmentOverride);
            for (var i = 0, handler; handler = this.handlers[i++]; ) {
                if (handler.route.test(fragment)) {
                    handler.callback(fragment);
                    return true;
                }
            }
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
    //判定A标签的target属性是否指向自身
    History.targetIsThisWindow = function targetIsThisWindow(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self') {
            return true;
        }
        if (targetWindow === '_blank') {
            return false;
        }
        if (targetWindow === 'top' && window === window.top) {
            return true;
        }
        return false;
    };
    //https://github.com/quirkey/sammy/blob/master/lib/sammy.js
    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
    //https://github.com/jashkenas/backbone/blob/master/backbone.js
    avalon.bind(document, "click", function(event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false
        if (defaultPrevented || event.ctrlKey || event.metaKey || event.which == 2)
            return;
        var target = event.target
        while (target.nodeName !== "A") {
            target = target.parentNode
            if (!target || target.nodeName === "Body") {
                return
            }
        }

        var full_path = target.href, hostname = target.hostname
        alert(hostname == window.location.hostname && History.targetIsThisWindow(target.target))
        if (hostname == window.location.hostname &&
                History.targetIsThisWindow(target.target)) {
            event.preventDefault();
            alert(1)
            //  proxy.setLocation(full_path);
            return false;
        }


    })
    avalon.history = new History;
    avalon.require("ready!", function() {

        avalon.history.start()
    })



    return avalon
})
