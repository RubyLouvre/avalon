new function() {// jshint ignore:line
    // http://www.cnblogs.com/yexiaochai/p/3462657.html
    var ua = navigator.userAgent
    var isAndroid = ua.indexOf("Android") > 0
    var isIOS = /iP(ad|hone|od)/.test(ua)
    var me = bindingHandlers.on
    var touchProxy = {}

    var IE11touch = navigator.pointerEnabled
    var IE9_10touch = navigator.msPointerEnabled
    var w3ctouch = (function() {
        var supported = isIOS || false
        //http://stackoverflow.com/questions/5713393/creating-and-firing-touch-events-on-a-touch-enabled-browser
        try {
            var div = document.createElement("div")
            div.ontouchstart = function() {
                supported = true
            }
            var e = document.createEvent("TouchEvent")
            e.initUIEvent("touchstart", true, true)
            div.dispatchEvent(e)
        } catch (err) {
        }
        div = div.ontouchstart = null
        return supported
    })()
    var touchSupported = !!(w3ctouch || IE11touch || IE9_10touch)
    //合成做成触屏事件所需要的各种原生事件
    var touchNames = ["mousedown", "mousemove", "mouseup", ""]
    if (w3ctouch) {
        touchNames = ["touchstart", "touchmove", "touchend", "touchcancel"]
    } else if (IE11touch) {
        touchNames = ["pointerdown", "pointermove", "pointerup", "pointercancel"]
    } else if (IE9_10touch) {
        touchNames = ["MSPointerDown", "MSPointerMove", "MSPointerUp", "MSPointerCancel"]
    }
    function isPrimaryTouch(event){
        return (event.pointerType === 'touch' || event.pointerType === event.MSPOINTER_TYPE_TOUCH) && event.isPrimary
    }

    function isPointerEventType(e, type){
        return (e.type === 'pointer'+type || e.type.toLowerCase() === 'mspointer'+type)
    }

    var touchTimeout, longTapTimeout
    //判定滑动方向
    function swipeDirection(x1, x2, y1, y2) {
        return Math.abs(x1 - x2) >=
                Math.abs(y1 - y2) ? (x1 - x2 > 0 ? "left" : "right") : (y1 - y2 > 0 ? "up" : "down")
    }
    function getCoordinates(event) {
        var touches = event.touches && event.touches.length ? event.touches : [event];
        var e = event.changedTouches ? event.changedTouches[0] : touches[0]
        return {
            x: e.clientX,
            y: e.clientY
        }
    }
    function fireEvent(el, name, detail) {
        var event = document.createEvent("Events")
        event.initEvent(name, true, true)
        event.fireByAvalon = true//签名，标记事件是由avalon触发
        //event.isTrusted = false 设置这个opera会报错
        if (detail)
            event.detail = detail
        el.dispatchEvent(event)
    }
    function onMouse(event) { 
        if (event.fireByAvalon) { 
            return true
        }
        if (touchProxy.element && event.target.tagName.toLowerCase()!=='select') { // 如果是pc端,不判断touchProxy.element的话此监听函数先触发的话之后所有的事件都不能正常触发
            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation()
            } else {
                event.propagationStopped = true
            }
            event.stopPropagation() 
            event.preventDefault()
            if (event.type === 'click') {
                touchProxy.element = null
            }
        }
    }
    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null
    }
    function touchstart(event) {
        var _isPointerType = isPointerEventType(event, 'down'),
            firstTouch = _isPointerType ? event : (event.touches && event.touches[0] || event),
            element = 'tagName' in firstTouch.target ? firstTouch.target: firstTouch.target.parentNode,
            now = Date.now(),
            delta = now - (touchProxy.last || now)
        if (_isPointerType && !isPrimaryTouch(event)) return
        avalon.mix(touchProxy, getCoordinates(event))
        touchProxy.mx = 0
        touchProxy.my = 0
        if (delta > 0 && delta <= 250) {
            touchProxy.isDoubleTap = true
        }
        touchProxy.last = now
        touchProxy.element = element
        /*
            当触发hold和longtap事件时会触发touchcancel事件，从而阻止touchend事件的触发，继而保证在同时绑定tap和hold(longtap)事件时只触发其中一个事件
        */
        avalon(element).addClass(fastclick.activeClass)
        longTapTimeout = setTimeout(function() {
            longTapTimeout = null
            fireEvent(element, "hold")
            fireEvent(element, "longtap")
            touchProxy = {}
            avalon(element).removeClass(fastclick.activeClass)
        }, fastclick.clickDuration)
        return true
    }
    function touchmove(event) {
        var _isPointerType = isPointerEventType(event, 'down'),
            e = getCoordinates(event)
        /*
            android下某些浏览器触发了touchmove事件的话touchend事件不触发，禁用touchmove可以解决此bug
            http://stackoverflow.com/questions/14486804/understanding-touch-events
        */
        if (isAndroid && Math.abs(touchProxy.x - e.x) > 10) {
            event.preventDefault()
        }
        if (_isPointerType && !isPrimaryTouch(event)) return
          
        cancelLongTap()
        touchProxy.mx += Math.abs(touchProxy.x - e.x)
        touchProxy.my += Math.abs(touchProxy.y - e.y)
    }
    function touchend(event) { 
        var _isPointerType = isPointerEventType(event, 'down')
            element = touchProxy.element

        if (_isPointerType && !isPrimaryTouch(event)) return

        if (!element) { // longtap|hold触发后touchProxy为{}
            return
        }
        cancelLongTap()
        var e = getCoordinates(event)
        var totalX = Math.abs(touchProxy.x - e.x)
        var totalY = Math.abs(touchProxy.y - e.y)
        if (totalX > 30 || totalY > 30) {
            //如果用户滑动的距离有点大，就认为是swipe事件
            var direction = swipeDirection(touchProxy.x, e.x, touchProxy.y, e.y)
            var details = {
                direction: direction
            }
            fireEvent(element, "swipe", details)
            fireEvent(element, "swipe" + direction, details)
            avalon(element).removeClass(fastclick.activeClass)
            touchProxy = {}
            touchProxy.element = element
        } else {
            if (fastclick.canClick(element) && touchProxy.mx < fastclick.dragDistance && touchProxy.my < fastclick.dragDistance) {
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
                if (event.target.tagName.toLowerCase() !== 'select') { //select无法通过click或者focus事件触发其下拉款的显示，只能让其通过原生的方式触发
                    event.preventDefault()
                }
                fireEvent(element, 'tap')
                avalon.fastclick.fireEvent(element, "click", event)
                avalon(element).removeClass(fastclick.activeClass)
                if (touchProxy.isDoubleTap) {
                    fireEvent(element, "doubletap")
                    avalon.fastclick.fireEvent(element, "dblclick", event)
                    touchProxy = {}
                    avalon(element).removeClass(fastclick.activeClass)
                    touchProxy.element = element
                } else {
                    touchTimeout = setTimeout(function() {
                        clearTimeout(touchTimeout)
                        touchTimeout = null
                        touchProxy = {}
                        avalon(element).removeClass(fastclick.activeClass)
                        touchProxy.element = element
                    }, 250)
                }
            }
        }
    }
    document.addEventListener('mousedown', onMouse, true)
    document.addEventListener('click', onMouse, true)
    document.addEventListener(touchNames[0], touchstart)
    document.addEventListener(touchNames[1], touchmove)
    document.addEventListener(touchNames[2], touchend)
    if (touchNames[3]) {
        document.addEventListener(touchNames[3], function(event) {
            if (longTapTimeout) clearTimeout(longTapTimeout)
            if (touchTimeout) clearTimeout(touchTimeout)
            longTapTimeout = touchTimeout = null
            touchProxy = {}
        })
    }
    //fastclick只要是处理移动端点击存在300ms延迟的问题
    //这是苹果乱搞异致的，他们想在小屏幕设备上通过快速点击两次，将放大了的网页缩放至原始比例。
    var fastclick = avalon.fastclick = {
        activeClass: "ms-click-active",
        clickDuration: 750, //小于750ms是点击，长于它是长按或拖动
        dragDistance: 30, //最大移动的距离
        fireEvent: function(element, type, event) {
            var clickEvent = document.createEvent("MouseEvents")
            clickEvent.initMouseEvent(type, true, true, window, 1, event.screenX, event.screenY,
                    event.clientX, event.clientY, false, false, false, false, 0, null)
            Object.defineProperty(clickEvent, "fireByAvalon", {
                value: true
            })
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
        }
    };


    ["swipe", "swipeleft", "swiperight", "swipeup", "swipedown", "doubletap", "tap", "dblclick", "longtap", "hold"].forEach(function(method) {
        me[method + "Hook"] = me["clickHook"]
    })

    //各种摸屏事件的示意图 http://quojs.tapquo.com/  http://touch.code.baidu.com/
}// jshint ignore:line