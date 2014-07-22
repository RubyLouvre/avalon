define(["avalon"], function(avalon) {
    avalon.bindingHandlers.view = function(data, vmodels) {
        var first = vmodels[0]
        data.element.innerHTML = "&nbsp;"
        first.$watch("routeChangeStart", function(fragment) {
            data.element.innerHTML = fragment || new Date - 0
        })
    }
    var defaults = {
        basepath: '/',
        html5Mode: true,
        hashPrefix: "!",
        interval: 50, //IE6-7,使用轮询，这是其时间时隔
        fireAnchor: true//决定是否将滚动条定位于与hash同ID的元素上
    }
    var History = avalon.History = function() {
        this.location2hash = {}
        this.location = location
    }

    var rthimSlant = /^\/+|\/+$/g  // 去最左右两边的斜线
    var rleftSlant = /^\//         //最左的斜线
    var routeStripper = /^[#\/]|\s+$/g
    var anchorElement = document.createElement('a')

    History.started = false
    History.IEVersion = (function() {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    })()

    var oldIE = window.VBArray && History.IEVersion <= 7
    History.prototype = {
        constructor: History,
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
        getHash: function(window) {
            // IE6直接用location.hash取hash，可能会取少一部分内容
            // 比如 http://www.cnblogs.com/rubylouvre#stream/xxxxx?lang=zh_c
            // ie6 => location.hash = #stream/xxxxx
            // 其他浏览器 => location.hash = #stream/xxxxx?lang=zh_c
            // firefox 会自作多情对hash进行decodeURIComponent
            // 又比如 http://www.cnblogs.com/rubylouvre/#!/home/q={%22thedate%22:%2220121010~20121010%22}
            // firefox 15 => #!/home/q={"thedate":"20121010~20121010"}
            // 其他浏览器 => #!/home/q={%22thedate%22:%2220121010~20121010%22}

            var path = (window || this).location.href
            path = path.slice(path.indexOf("#"))
            if (path.indexOf(this.prefix) === 0) {
                return path.slice(this.prefix.length)
            }
            return ""
        },
        getPath: function() {
            var path = decodeURI(this.location.pathname + this.location.search)
            var root = this.basepath.slice(0, -1)
            if (!path.indexOf(root))
                path = path.slice(root.length)
            return path.slice(1)
        },
        _getAbsolutePath: function(a) {
            return !a.hasAttribute ? a.getAttribute("href", 4) : a.href
        },
        start: function(options) {
            if (History.started)
                throw new Error("avalon.history has already been started")
            History.started = true
            this.options = avalon.mix({}, defaults, options)
            //IE6不支持maxHeight, IE7支持XMLHttpRequest, IE8支持window.Element，querySelector, 
            //IE9支持window.Node, window.HTMLElement, IE10不支持条件注释

            this.supportPushState = !!(window.history.pushState)
            this.supportHashChange = !!('onhashchange' in window && (!window.VBArray || !oldIE))
            //确保html5Mode属性存在,并且是一个布尔
            this.html5Mode = !!this.options.html5Mode
            //监听模式
            this.monitorMode = this.html5Mode ? "popstate" : "hashchange"
            if (!this.supportPushState) {
                if (this.html5Mode) {
                    avalon.log("如果浏览器不支持HTML5 pushState，强制使用hash hack!")
                    this.html5Mode = false
                }
                this.monitorMode = "hashchange"
            }
            if (!this.supportHashChange) {
                this.monitorMode = "iframepoll"
            }
            this.prefix = "#" + this.options.hashPrefix + "/"
            avalon.log(this.monitorMode)
            ////确认前后都存在斜线， 如"aaa/ --> /aaa/" , "/aaa --> /aaa/", "aaa --> /aaa/", "/ --> /"
            this.basepath = ('/' + this.options.basepath + '/').replace(rthimSlant, '/')
            this.fragment = this.getFragment()

            anchorElement.href = this.basepath
            this.rootpath = this._getAbsolutePath(anchorElement)
            var that = this


            var html = '<!doctype html><html><body>@</body></html>'
            if (this.options.domain) {
                html = html.replace("<body>", "<script>document.domain =" + this.options.domain + "</script><body>")
            }
            if (this.monitorMode === "iframepoll") {
                //IE6,7在hash改变时不会产生历史，需要用一个iframe来共享历史
                avalon.ready(function() {
                    var iframe = document.createElement('iframe');
                    iframe.src = 'javascript:0'
                    iframe.style.display = 'none'
                    iframe.tabIndex = -1
                    document.body.appendChild(iframe)
                    that.iframe = iframe.contentWindow
                    var idoc = proxy.iframe.document
                    idoc.open()
                    idoc.write(html)
                    idoc.close()
                })

            }

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange
            // 否则的话只能每隔一段时间进行检测了
            function checkUrl() {
                var iframe = that.iframe
                if (that.monitorMode === "iframepoll" && !iframe) {
                    return false
                }
                var pageHash = that.getFragment(), hash
                if (iframe) {//IE67
                    var iframeHash = that.getHash(iframe)
                    //与当前页面hash不等于之前的页面hash，这主要是用户通过点击链接引发的
                    if (pageHash !== that.fragment) {
                        iframe.document.open().close()
                        iframe.location.hash = that.prefix + pageHash
                        hash = pageHash
                        //如果是后退按钮触发hash不一致
                    } else if (iframeHash !== that.fragment) {
                        that.location.hash = that.prefix + iframeHash
                        hash = iframeHash
                    }
                } else if (pageHash !== that.fragment) {
                    hash = pageHash
                }
                if (hash) {
                    that.fragment = hash
                    that.fireRouteChange(hash)
                }
            }

            //thanks https://github.com/browserstate/history.js/blob/master/scripts/uncompressed/history.html4.js#L272

            // 支持popstate 就监听popstate
            // 支持hashchange 就监听hashchange(IE8,IE9,FF3)
            // 否则的话只能每隔一段时间进行检测了(IE6, IE7)
            if (this.monitorMode === "popstate") {
                this.checkUrl = avalon.bind(window, 'popstate', checkUrl)
                this._fireLocationChange = checkUrl
            } else if (this.monitorMode === "hashchange") {
                this.checkUrl = avalon.bind(window, 'hashchange', checkUrl)
            } else {
                this.checkUrl = setInterval(checkUrl, this.options.interval)
            }

            if (this.html5Mode) {
                this.fireRouteChange(this.getPath())
            } else {
                if (this.rootpath === location.href.replace(/\/$/, "")) {
                    return this.fireRouteChange("/")
                }
                var hash = this.getHash()
                if (hash) {
                    return this.fireRouteChange(hash)
                }
            }

        },
        fireRouteChange: function(hash) {
            avalon.log(hash + "  change!!!!!!!!!!")
            if (this.options.fireAnchor) {
                scrollToAnchorId(hash)
            }
        },
        // 中断URL的监听
        stop: function() {
            avalon.unbind(window, "popstate", this.checkUrl)
            avalon.unbind(window, "hashchange", this.checkUrl)
            clearInterval(this.checkUrl)
            History.started = false
        },
        setLocation: function(hash) {
            var prefix = "#" + this.options.hashPrefix + "/"
            if (this.monitorMode === "popstate") {
                var path = this.rootpath + hash
                history.pushState({path: path}, document.title, path)
                this._fireLocationChange()
            } else {
                this.location.hash = prefix + hash
            }
        }
    }

    //得到页面第一个符合条件的A标签
    function getFirstAnchor(list) {
        for (var i = 0, el; el = list[i++]; ) {
            if (el.nodeName === "A") {
                return el
            }
        }
    }

    function scrollToAnchorId(hash, el) {
        hash = hash.replace(rleftSlant, "").replace(/#.*/, '')
        hash = decodeURIComponent(hash)
        if ((el = document.getElementById(hash))) {
            el.scrollIntoView()
        } else if ((el = getFirstAnchor(document.getElementsByName(hash)))) {
            el.scrollIntoView()
        } else {
            window.scrollTo(0, 0)
        }
    }

    //判定A标签的target属性是否指向自身
    //thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
    History.targetIsThisWindow = function targetIsThisWindow(targetWindow) {
        if (!targetWindow || targetWindow === window.name || targetWindow === '_self' || (targetWindow === 'top' && window == window.top)) {
            return true
        }
        return false
    }

    //https://github.com/asual/jquery-address/blob/master/src/jquery.address.js
    proxy = avalon.history = new History
    var rurl = /^([\w\d]+):\/\/([\w\d\-_]+(?:\.[\w\d\-_]+)*)/
    //当用户点击页面的链接时，如果链接是指向当前网站并且以"#/"或"#!/"开头，那么触发setLocation方法
    avalon.bind(document, "click", function(event) {
        var defaultPrevented = "defaultPrevented" in event ? event['defaultPrevented'] : event.returnValue === false
        if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2)
            return
        var target = event.target
        while (target.nodeName !== "A") {
            target = target.parentNode
            if (!target || target.tagName === "BODY") {
                return
            }
        }
        var hostname = target.hostname
        if (!hostname) {//fix IE下通过ms-href动态生成href，不存在hostname属性的BUG
            var fullHref = !oldIE ? target + "" : target.getAttribute("href", 4)
            hostname = (fullHref.match(rurl) || ["", "", ""])[2]//小心javascript:void(0)
        }
        if (hostname === window.location.hostname && History.targetIsThisWindow(target.target)) {
            var path = target.getAttribute("href", 2), prefix = proxy.prefix, hash
            if (path.indexOf(prefix) === 0) {
                hash = path.slice(prefix.length)
            }
            if (hash !== void 0) {
                event.preventDefault()
                proxy.setLocation(hash)
                return false
            }
        }

    })

    return avalon
})

// 主要参数有 basepath  html5Mode  hashPrefix  interval domain fireAnchor

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
