
void function() {
    var ua = navigator.userAgent
    var isAndroid = ua.indexOf('Android') > 0
    var isIOS = /iP(ad|hone|od)/.test(ua)

    var ghostPrevent = false
    document.addEventListener('click', function(e) {
        if (ghostPrevent) {
            if (!event.markFastClick) {//阻止浏览器自己触发的点击事件
                event.stopPropagation()
                event.preventDefault()
            }
        }
        var target = e.target

        if (target.href && target.href.match(/#(\w+)/)) {
            var id = RegExp.$1
            if (id) {
                var el = document.getElementById(id)
                //这里做锚点的滚动处理,或做在scroll插件中
            }
        }
    }, true)
//fastclick只要是处理移动端点击存在300ms延迟的问题
//这是苹果乱搞异致的，他们想在小屏幕设备上通过快速点击两次，将放大了的网页缩放至原始比例。
    avalon.fastclick = {
        activeClass: "ms-click-active",
        clickDuration: 750, //小于750ms是点击，长于它是长按或拖动
        dragDistance: 14, //最大移动的距离
        preventTime: 2500, //2500ms还原ghostPrevent
        fireEvent: function(element, type, event) {
            var clickEvent = document.createEvent('MouseEvents')
            clickEvent.initMouseEvent(type, true, true, window, 1, event.screenX, event.screenY, event.clientX, event.clientY, false, false, false, false, 0, null)
            clickEvent.markFastClick = "司徒正美";
            element.dispatchEvent(clickEvent)
        },
        focus: function(target) {
            if (this.canFocus(target)) {
                //https://github.com/RubyLouvre/avalon/issues/254
                var value = target.value
                target.value = value
                if (isIOS && target.setSelectionRange && target.type.indexOf("date") !== 0 && target.type !== 'time') {
                    // iOS 7, date datetime等控件直接对selectionStart,selectionEnd赋值会抛错
                    var n = value.length
                    target.setSelectionRange(n, n)
                } else {
                    target.focus()
                }
            }
        },
        canClick: function(target) {
            switch (target.nodeName.toLowerCase()) {
                case 'textarea':
                case 'select':
                case 'input':
                    return !target.disabled
                default:
                    return true
            }
        },
        canFocus: function(target) {
            switch (target.nodeName.toLowerCase()) {
                case 'textarea':
                    return true;
                case 'select':
                    return !isAndroid
                case 'input':
                    switch (target.type) {
                        case 'button':
                        case 'checkbox':
                        case 'file':
                        case 'image':
                        case 'radio':
                        case 'submit':
                            return false;
                    }
                    // No point in attempting to focus disabled inputs
                    return !target.disabled && !target.readOnly;
                default:
                    return false
            }
        },
        canFix: function(element) {
            // 如果是PC端就不需要修复了
            if (typeof window.ontouchstart === 'undefined') {
                return false
            }
            //在Android 平台的chrome 32，为了避免点击延迟，允许用户设置如下代码
            // <meta name="viewport" content="user-scalable=no">
            // <meta name="viewport" content="initial-scale=1,maximum-scale=1">
            // 可禁用双击缩放
            // 此外，iPhone 诞生时就有的另一个约定是，在渲染桌面端站点的时候，
            // 使用 980 像素的视口宽度，而非设备本身的宽度（iPhone 是 320 像素宽）时，
            // 即用户定义了<meta name="viewport" content="width=device-width">时
            // 也禁用双击缩放
            // 另外，如果页面宽度少于viewport宽度（document.documentElement.scrollWidth <= window.outerWidth）
            // 也禁用双击缩放
            var chromeVersion = +(/Chrome\/([0-9]+)/.exec(ua) || [0, 0])[1];
            if (chromeVersion) {//chrome 安卓版如果指定了特定的meta也不需要修复
                if (isAndroid) {
                    var metaViewport = document.querySelector('meta[name=viewport]')
                    if (metaViewport) {
                        if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                            return false;
                        }
                        if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                            return false;
                        }
                    }
                }
            }
            //IE10-11中为元素节点添加了一个touch-action属性决定能否进行双指缩放或者双击缩放
            //  a[href], button {
            //    -ms-touch-action: none; /* IE10 */
            //    touch-action: none;     /* IE11 */
            //}
            //参考自 http://thx.alibaba-inc.com/mobile/300ms-click-delay/
            if (element.style.msTouchAction === 'none') {
                return false;
            }
            return true;
        }
    }

//==============================================
//重写原bindingHandlers.on处理函数
    var rdash = /\(([^)]*)\)/
    avalon.bindingHandlers.on = function(data, vmodels) {
        var value = data.value,
                four = "$event"
        var element = data.element
        if (data.param === "click") {
            var tapping = false,
                    fastclick = avalon.fastclick,
                    doubleIndex = 0, //用于决定何时重置doubleStartTime
                    doubleStartTime, //双击开始时间,
                    startTime, // 单击开始时间
                    touchStartX,
                    touchStartY
            function resetState() {
                tapping = false;
                avalon(element).removeClass(fastclick.activeClass)
            }
            function touchstart(event) {
                doubleIndex++
                if (doubleIndex === 1) {
                    doubleStartTime = Date.now()
                }
                tapping = true
                if (avalon.fastclick.canClick(element)) {
                    avalon(element).addClass(fastclick.activeClass)
                }
                startTime = Date.now()
                var touches = event.touches && event.touches.length ? event.touches : [event]
                var e = touches[0]
                touchStartX = e.clientX
                touchStartY = e.clientY
            }
            function touchend(event) {
                var touches = (event.changedTouches && event.changedTouches.length) ? event.changedTouches :
                        ((event.touches && event.touches.length) ? event.touches : [event])
                var e = touches[0];
                var x = e.clientX
                var y = e.clientY
                var diff = Date.now() - startTime //经过时间
                var dist = Math.sqrt(Math.pow(x - touchStartX, 2) + Math.pow(y - touchStartY, 2)) //移动距离
                var canDoubleClick = false
                if (doubleIndex === 2) {
                    doubleIndex = 0
                    canDoubleClick = true
                }
                if (tapping && diff < fastclick.clickDuration && dist < fastclick.dragDistance) {
                    ghostPrevent = true //在这里阻止浏览器的默认事件
                    setTimeout(function() {
                        ghostPrevent = false
                    }, fastclick.preventTime)
                    // 失去焦点的处理
                    if (document.activeElement && document.activeElement !== element) {
                        document.activeElement.blur()
                    }
                    if (fastclick.canClick(element)) {
                        var forElement
                        if (element.tagName.toLowerCase() === "label") {
                            forElement = element.htmlFor ? document.getElementById(element.htmlFor) : null
                        }
                        if (forElement) {
                            fastclick.focus(forElement)
                        } else {
                            fastclick.focus(element)
                        }

                        avalon.fastclick.fireEvent(element, "click", event)
                        if (forElement) {
                            avalon.fastclick.fireEvent(forElement, "click", event)
                        }

                        if (canDoubleClick) {
                            //Windows default double-click time is 500 ms (half a second)
                            //http://ux.stackexchange.com/questions/40364/what-is-the-expected-timeframe-of-a-double-click
                            //http://msdn.microsoft.com/en-us/library/windows/desktop/bb760404(v=vs.85).aspx
                            if (new Date - doubleStartTime < 500) {
                                avalon.fastclick.fireEvent(element, "dblclick", event)
                            }
                            doubleIndex = 0
                        }
                    }
                }
                resetState()
            }
            if (avalon.fastclick.canFix(element)) {
                data.specialBind = function(element, callback) {
                    element.addEventListener("touchstart", touchstart)
                    element.addEventListener("touchmove", resetState)
                    element.addEventListener("touchcancel", resetState)
                    element.addEventListener("touchend", touchend)
                    element.addEventListener("click", callback)
                }
                data.specialUnbind = function(element, callback) {
                    element.removeEventListener("touchstart", touchstart)
                    element.removedEventListener("touchmove", resetState)
                    element.removeEventListener("touchcancel", resetState)
                    element.removeEventListener("touchend", touchend)
                    element.removeEventListener("click", callback)
                }
            }
        }

        if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
            var matched = (value.match(rdash) || ["", ""])[1].trim()
            if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
                four = void 0
                value = value.replace(rdash, "")
            }
        } else {
            four = void 0
        }
        data.hasArgs = four
        avalon.parseExprProxy(value, vmodels, data)
    }
}()




