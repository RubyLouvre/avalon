new function() {
    var ua = navigator.userAgent
    var isAndroid = ua.indexOf("Android") > 0
    var isIOS = /iP(ad|hone|od)/.test(ua)
    var self = bindingHandlers.on
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


    if (touchSupported) {
        //我们经由ms-click, ms-on-tap绑定事件, 其实没有直接绑在元素,全部放到一个数组中
        //当通过touchstart, touchend等事件混合计算得当前场景应该需要执行click, tap,那么
        //直接执行el["msdispatch"]方法
        "click,tap".replace(/\w+/g, function(method) {
            avalon.eventHooks[method] = {
                type: method,
                deel: function(el, type, fn, isAdd) {
                    var listName = "ms" + method + "list"
                    var fns = el[listName] || (el[listName] = [])
                    if (!el["msdispatch"]) {
                        el["msdispatch"] = function(event) {
                            if (event.fireByAvalon) {
                                for (var i = 0, fn; fn = fns[i++]; ) {
                                    fn.call(el, event)
                                }
                            }
                        }
                        el.addEventListener(type, el["msdispatch"])
                    }
                    if (isAdd) {
                        fns.push(fn)
                    } else {
                        avalon.Array.remove(fns, fn)
                    }
                    fn.unbind = true
                    return fn
                }
            }
        })
    }

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

    function touchend(event) {
        var element = touchProxy.element
        if (!element)
            return
        var e = getCoordinates(event)
        var diff = Date.now() - touchProxy.startTime //经过时间
        var totalX = Math.abs(touchProxy.x - e.x)
        var totalY = Math.abs(touchProxy.y - e.y)

        var canDoubleClick = false
        if (touchProxy.doubleIndex === 2) {//如果已经点了两次,就可以触发dblclick 回调
            touchProxy.doubleIndex = 0
            canDoubleClick = true
            if (avalon.config.stopZoom) {
                event.preventDefault()
            }
        }
        if (totalX > 30 || totalY > 30) {
            //如果用户滑动的距离有点大，就认为是swipe事件
            var direction = swipeDirection(touchProxy.x, e.x, touchProxy.y, e.y)
            var details = {
                direction: direction
            }
            W3CFire(element, "swipe", details)
            W3CFire(element, "swipe" + direction, details)
        } else {
            //如果移动的距离太少，则认为是tap,click,hold,dblclick
            if (fastclick.canClick(element) &&
                    touchProxy.mx < fastclick.dragDistance &&
                    touchProxy.my < fastclick.dragDistance) {
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
                    if (diff < 250) {
                        avalon.fastclick.fireEvent(element, "dblclick", event)//触发dblclick事件
                        W3CFire(element, "doubletap")//触发doubletap事件
                    }
                    touchProxy.doubleIndex = 0
                }
                if (diff > fastclick.clickDuration) {
                    W3CFire(element, "hold")
                    W3CFire(element, "longtap")
                }
            }
        }
        avalon(element).removeClass(fastclick.activeClass)
        touchProxy.element = null
    }
    document.addEventListener(touchNames[1], function(event) {
        if (!touchProxy.element)
            return
        var e = getCoordinates(event)
        touchProxy.mx += Math.abs(touchProxy.cx - e.x)
        touchProxy.my += Math.abs(touchProxy.cy - e.y)
        if (touchProxy.tapping && (touchProxy.mx > fastclick.dragDistance || touchProxy.my > fastclick.dragDistance)) {
            touchProxy.element = null
        }
    })
    document.addEventListener(touchNames[2], touchend)
    if (touchNames[3]) {
        document.addEventListener(touchNames[3], touchend)
    }
    self["clickHook"] = function(data) {
        function touchstart(event) {
            var element = data.element
            avalon.mix(touchProxy, getCoordinates(event))
            touchProxy.cx = touchProxy.x
            touchProxy.cy = touchProxy.y
            touchProxy.mx = 0 //计算总结移动了多少距离，指在移动距离重分
            touchProxy.my = 0
            touchProxy.startTime = Date.now()
            touchProxy.event = data.param
            touchProxy.tapping = /click|tap|hold$/.test(touchProxy.event)

            touchProxy.element = element
            //--------------处理双击事件--------------
            if (touchProxy.element !== element) {
                touchProxy.doubleIndex = 1
                touchProxy.doubleStartTime = Date.now()
            } else {
                if (!touchProxy.doubleIndex) {
                    touchProxy.doubleIndex = 1
                } else {
                    touchProxy.doubleIndex = 2
                }
            }
            if (touchProxy.tapping && avalon.fastclick.canClick(element)) {
                avalon(element).addClass(fastclick.activeClass)
            }
        }
        function needFixClick(type) {
            return type === "click"
        }
        if (needFixClick(data.param) ? touchSupported : true) {
            data.specialBind = function(element, callback) {
                element.addEventListener(touchNames[0], touchstart)
                data.msCallback = callback
                avalon.bind(element, data.param, callback)
            }
            data.specialUnbind = function() {
                element.removeEventListener(touchNames[0], touchstart)
                avalon.bind(data.element, data.param, data.msCallback)
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
        self[method + "Hook"] = self["clickHook"]
    })

    //各种摸屏事件的示意图 http://quojs.tapquo.com/  http://touch.code.baidu.com/
}
