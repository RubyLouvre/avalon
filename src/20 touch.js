new function() {
    var ua = navigator.userAgent
    var isAndroid = ua.indexOf("Android") > 0
    var isIOS = /iP(ad|hone|od)/.test(ua)
    var self = bindingHandlers.on

    var IE11touch = navigator.pointerEnabled
    var IE9_10touch = navigator.msPointerEnabled
    var w3ctouch = (function() {
        var supported = false
        //http://stackoverflow.com/questions/5713393/creating-and-firing-touch-events-on-a-touch-enabled-browser
        try {
            var div = document.createElement("div")
            div.ontouchstart = function() {
                supported = true
            }
            var e = document.createEvent("TouchEvent")
            e.initTouchEvent("touchstart", true, true)
            div.dispatchEvent(e)
        } catch (err) {
        }
        div = div.ontouchstart = null
        return supported
    })()
    var touchSupported = w3ctouch || IE11touch || IE9_10touch
    //合成做成触屏事件所需要的各种原生事件
    var touchNames = ["mousedown", "mousemove", "mouseup", ""]
    if (w3ctouch) {
        touchNames = ["touchstart", "touchmove", "touchend", "touchcancel"]
    } else if (IE11touch) {
        touchNames = ["pointerdown", "pointermove", "pointerup", "pointercancel"]
    } else if (IE9_10touch) {
        touchNames = ["MSPointerDown", "MSPointerMove", "MSPointerUp", "MSPointerCancel"]
    }
    //判定滑动方向
    function swipeDirection(x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >=
                Math.abs(y1 - y2) ? (x1 - x2 > 0 ? "left" : "right") : (y1 - y2 > 0 ? "up" : "down")
    }
    self["clickHook"] = function(data) {
        var tapping = false,
                element = data.element,
                fastclick = avalon.fastclick,
                doubleIndex = 0, //用于决定何时重置doubleStartTime
                doubleStartTime, //双击开始时间,
                holdTimeout, //长按的定时器
                startTime, // 单击开始时间
                touchStartX,
                touchStartY
        function resetState() {
            tapping = false
            if (holdTimeout) {
                clearTimeout(holdTimeout)
                holdTimeout = null
            }
            avalon(element).removeClass(fastclick.activeClass)
        }
        function longTap() {
            if (tapping) {
                W3CFire(element, "hold")
            }
        }
        function touchstart(event) {
            doubleIndex++
            if (doubleIndex === 1) {
                doubleStartTime = Date.now()
            }
            startTime = Date.now()
            tapping = true
            if (avalon.fastclick.canClick(element) && /click|tap$/.test(data.param)) {
                avalon(element).addClass(fastclick.activeClass)
            }
            var touches = event.touches && event.touches.length ? event.touches : [event]
            var e = touches[0]
            touchStartX = e.clientX
            touchStartY = e.clientY
            if (data.param === "hold") {
                holdTimeout = setTimeout(longTap, 750)
            }
        }
        function touchend(event) {
            var touches = (event.changedTouches && event.changedTouches.length) ? event.changedTouches :
                    ((event.touches && event.touches.length) ? event.touches : [event])
            var e = touches[0]
            var touchEndX = e.clientX
            var touchEndY = e.clientY
            var diff = Date.now() - startTime //经过时间
            var totalX = Math.abs(touchEndX - touchStartX);
            var totalY = Math.abs(touchEndY - touchStartY);
            //  var dist = Math.sqrt(Math.pow(touchEndX - touchStartX, 2) + Math.pow(touchEndY - touchStartY, 2)) //移动距离
            var canDoubleClick = false
            if (doubleIndex === 2) {
                doubleIndex = 0
                canDoubleClick = true
            }
            //如果按住时间满足触发click, dbclick, hold, swipe
            if (diff < fastclick.clickDuration && fastclick.canClick(element)) {
                //如果移动的距离太少，则认为是tap,click,hold,dblclick
                if (totalX < fastclick.dragDistance && totalY < fastclick.dragDistance) {
                    if (!tapping)
                        return
                    ghostPrevent = true //在这里阻止浏览器的默认事件
                    setTimeout(function() {
                        ghostPrevent = false
                    }, fastclick.preventTime)
                    // 失去焦点的处理
                    if (document.activeElement && document.activeElement !== element) {
                        document.activeElement.blur()
                    }
                    //如果此元素不为表单元素,或者它没有disabled

                    var forElement
                    if (element.tagName.toLowerCase() === "label") {
                        forElement = element.htmlFor ? document.getElementById(element.htmlFor) : null
                    }
                    if (forElement) {
                        fastclick.focus(forElement)
                    } else {
                        fastclick.focus(element)
                    }
                    avalon.fastclick.fireEvent(element, "click", event)//触发click事件
                    W3CFire(element, "tap")//触发tap事件
                    if (forElement) {
                        avalon.fastclick.fireEvent(forElement, "click", event)
                        W3CFire(element, "tap")//触发tap事件
                    }
                    if (canDoubleClick) {
                        //Windows default double-click time is 500 ms (half a second)
                        //http://ux.stackexchange.com/questions/40364/what-is-the-expected-timeframe-of-a-double-click
                        //http://msdn.microsoft.com/en-us/library/windows/desktop/bb760404(v=vs.85).aspx
                        if (new Date - doubleStartTime < 500) {
                            avalon.fastclick.fireEvent(element, "dblclick", event)//触发dblclick事件
                            W3CFire(element, "doubletap")//触发doubletap事件
                        }
                        doubleIndex = 0
                    }

                } else {
                    //如果用户滑动的距离有点大，就认为是swipe事件
                    W3CFire(element, "swipe")
                    W3CFire(element, "swipe" + (swipeDirection(touchStartX, touchEndX, touchStartY, touchEndY)))
                }
            }
            resetState()
        }
        var isClick = data.param === "click"
        if (isClick ? avalon.fastclick.canFix(element) : true) {
            data.specialBind = function(element, callback) {
                element.addEventListener(touchNames[0], touchstart)
                element.addEventListener(touchNames[1], resetState)
                element.addEventListener(touchNames[2], touchend)
                if (touchNames[3]) {
                    element.addEventListener(touchNames[3], resetState)
                }

                element.addEventListener(data.param, callback)
            }
            data.specialUnbind = function(element, callback) {
                element.removeEventListener(touchNames[0], touchstart)
                element.removeEventListener(touchNames[1], resetState)
                element.removeEventListener(touchNames[2], touchend)
                if (touchNames[3]) {
                    element.removeEventListener(touchNames[3], resetState)
                }
                element.removeEventListener(data.param, callback)
            }
        }
    }

    var ghostPrevent = false
    document.addEventListener("click", function(e) {
        if (ghostPrevent) {
            if (!e.markFastClick) {//阻止浏览器自己触发的点击事件
                e.stopPropagation()
                e.preventDefault()
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
        dragDistance: 10, //最大移动的距离
        preventTime: 2500, //2500ms还原ghostPrevent
        fireEvent: function(element, type, event) {
            var clickEvent = document.createEvent("MouseEvents")
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
                case "textarea":
                case "select":
                case "input":
                    return !target.disabled
                default:
                    return true
            }
        },
        canFocus: function(target) {
            switch (target.nodeName.toLowerCase()) {
                case "textarea":
                    return true;
                case "select":
                    return !isAndroid
                case "input":
                    switch (target.type) {
                        case "button":
                        case "checkbox":
                        case "file":
                        case "image":
                        case "radio":
                        case "submit":
                            return false
                    }
                    // No point in attempting to focus disabled inputs
                    return !target.disabled && !target.readOnly
                default:
                    return false
            }
        },
        canFix: function(element) {
            // 如果设备不支持触摸就不需要修复了
            if (!touchSupported) {
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
            var chromeVersion = +(/Chrome\/([0-9]+)/.exec(ua) || [0, 0])[1]
            if (chromeVersion) {//chrome 安卓版如果指定了特定的meta也不需要修复
                if (isAndroid) {
                    var metaViewport = document.querySelector('meta[name=viewport]')
                    if (metaViewport) {
                        if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                            return false
                        }
                        if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                            return false
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
                return false
            }
            return true
        }
    };


    ["swipe", "swipeleft", "swiperight", "swipeup", "swipedown", "doubletap", "tap", "hold"].forEach(function(method) {
        self[method + "Hook"] = self["clickHook"]
    })

    //各种摸屏事件的示意图 http://quojs.tapquo.com/  http://touch.code.baidu.com/

}



