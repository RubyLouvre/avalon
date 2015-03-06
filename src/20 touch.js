new function() {
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
    function onMouse(event) {
        if (event.fireByAvalon) { //由touch库触发则执行监听函数，如果是事件自身触发则阻止事件传播并阻止默认行为
            return true
        } 
        if (touchProxy.element) { // 如果不加判断则会阻止所有的默认行为，对于a链接和submit button不该阻止，所以这里需要做区分
            if (event.stopImmediatePropagation) {
                event.stopImmediatePropagation()
            } else {
                event.propagationStopped = true
            }
            event.stopPropagation()
            event.preventDefault()
            if (event.type == 'click') { // mousedown会触发input的focus从而调出键盘，click会触发a链接的跳转
                touchProxy.element = null
            }
            return true    
        }
    }
    function cancelLongTap() {
        if (longTapTimeout) clearTimeout(longTapTimeout)
        longTapTimeout = null
    }
    function touchend(event) { 
        var element = touchProxy.element
        if (!element) {
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
            W3CFire(element, "swipe", details)
            W3CFire(element, "swipe" + direction, details)
            touchProxy = {}
            touchProxy.element = element
        } else {
            //如果移动的距离太少，则认为是tap,click,hold,dblclick
            // 如果hold(longtap)事件触发了，则touchProxy.mx为undefined，则不会进入条件，从而避免tap事件的触发
            // undefined与任何number比大小都会返回false(Number(undefined)为NaN)
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
                W3CFire(element, 'tap')
                avalon.fastclick.fireEvent(element, "click", event)
                if (touchProxy.isDoubleTap) {
                    W3CFire(element, "doubletap")
                    avalon.fastclick.fireEvent(element, "dblclick", event)
                    touchProxy = {}
                    touchProxy.element = element
                } else {
                    touchTimeout = setTimeout(function() {
                        clearTimeout(touchTimeout)
                        touchTimeout = null
                        if (touchProxy.element) {
                            touchProxy = {}
                            touchProxy.element = element
                        }
                    }, 250)
                }
            }
        }
        avalon(element).removeClass(fastclick.activeClass)
    }
    document.addEventListener('mousedown', onMouse, true)
    document.addEventListener('click', onMouse, true)
    document.addEventListener(touchNames[1], function(event) {
        var element = touchProxy.element
        if (!element) return
        cancelLongTap()
        var e = getCoordinates(event)
        touchProxy.mx += Math.abs(touchProxy.x - e.x)
        touchProxy.my += Math.abs(touchProxy.y - e.y)
        if (touchProxy.tapping && (touchProxy.mx > fastclick.dragDistance || touchProxy.my > fastclick.dragDistance)) {
            // 因为对于element的touchNames[0]事件只绑定了一次导致touchProxy.event仅仅是第一次绑定事件时的data.param，当同时绑定tap,hold,swipeleft时，这里的touchProxy.tapping为true而设置touchProxy.element = null,那么swipeleft或者swiperight事件就不会触发，因此我们在touchProxy.events中保存所有的events types并作进一步的判断从而保证每个事件都可以触发，并且触发了一个不会触发其他的事件
            if (!~touchProxy.events.indexOf('swipeleft') && !~touchProxy.events.indexOf('swiperight')) {
                touchProxy.element = null   
                avalon(element).removeClass(fastclick.activeClass) 
            }
        }
    })

    document.addEventListener(touchNames[2], touchend)
    if (touchNames[3]) {
        document.addEventListener(touchNames[3], function() {
            if (longTapTimeout) clearTimeout(longTapTimeout)
            if (touchTimeout) clearTimeout(touchTimeout)
            longTapTimeout = touchTimeout = null
            touchProxy = {}
        })
    }
    me["clickHook"] = function(data) {
        function touchstart(event) {
            var element = data.element,
                now = Date.now(),
                delta = now - (touchProxy.last || now)
            avalon.mix(touchProxy, getCoordinates(event))
            touchProxy.events = element.events
            touchProxy.mx = 0
            touchProxy.my = 0
            touchProxy.tapping = touchProxy.events.some(function(item, index) {
                return /click|tap|hold|longtap$/.test(item)
            })
            if (delta > 0 && delta <= 250) {
                touchProxy.isDoubleTap = true
            }
            touchProxy.last = now
            touchProxy.element = element
            /*
                当触发hold和longtap事件时会触发touchcancel事件，从而阻止touchend事件的触发，继而保证在同时绑定tap和hold(longtap)事件时只触发其中一个事件
            */
            longTapTimeout = setTimeout(function() {
                longTapTimeout = null
                W3CFire(element, "hold")
                W3CFire(element, "longtap")
                touchProxy = {}
                avalon(element).removeClass(fastclick.activeClass)
            }, fastclick.clickDuration)
            if (touchProxy.tapping && avalon.fastclick.canClick(element)) {
                avalon(element).addClass(fastclick.activeClass)
            }
        }

        function needFixClick(type) {
            return type === "click"
        }

        if (needFixClick(data.param) ? touchSupported : true) {
            data.specialBind = function(element, callback) {
                // 不将touchstart绑定在document上是为了获取绑定事件的element
                if (!element.bindStart) { // 如果元素上绑定了多个事件不做处理的话会绑定多个touchstart监听器，显然不需要
                    element.bindStart = true
                    element.events = [data.param]
                    element.addEventListener(touchNames[0], touchstart)
                } else {
                    avalon.Array.ensure(element.events, data.param)
                }
                data.msCallback = callback
                avalon.bind(element, data.param, callback)
            }
            data.specialUnbind = function() {
                element.removeEventListener(touchNames[0], touchstart)
                avalon.unbind(data.element, data.param, data.msCallback)
            }
        }
    }
    if (touchSupported) {
        me[touchNames[0] + "Hook"] = function(data) {
            if (needFixClick(data.param) ? touchSupported : true) {
                data.specialBind = function(element, callback) {
                    var _callback = callback
                    callback = function(event) {
                        touchProxy.element = data.element
                        _callback.call(this, event)
                    }
                    data.msCallback = callback
                    avalon.bind(element, data.param, callback)
                }
                data.specialUnbind = function() {
                    avalon.unbind(data.element, data.param, data.msCallback)
                }
            }
        }
        me[touchNames[2] + "Hook"] = function(data) {
            if (needFixClick(data.param) ? touchSupported : true) {
                data.specialBind = function(element, callback) {
                    var _callback = callback
                    callback = function(event) {
                        touchProxy.element = data.element
                        _callback.call(this, event)
                    }
                    data.msCallback = callback
                    avalon.bind(element, data.param, callback)
                }
                data.specialUnbind = function() {
                    avalon.unbind(data.element, data.param, data.msCallback)
                }
            }
        }
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
}