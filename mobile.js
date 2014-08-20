

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

avalon.fastclick = {
    activeClass: "ms-click-active",
    clickDuration: 750, //小于750ms是点击，长于它是长按或拖动
    dragDistance: 14, //最大移动的距离
    preventTime: 2500, //2500ms还原ghostPrevent
    fireEvent: function(element, type, event) {
        var clickEvent = document.createEvent('MouseEvents');
        clickEvent.initMouseEvent(type, true, true, window, 1, event.screenX, event.screenY, event.clientX, event.clientY, false, false, false, false, 0, null);
        clickEvent.markFastClick = "司徒正美";
        element.dispatchEvent(clickEvent)
    },
    focus: function(targetElement) {
        if (this.canFocus(targetElement)) {
            var length;
            // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
            if (isIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
                length = targetElement.value.length;
                targetElement.setSelectionRange(length, length);
            } else {
                targetElement.focus()
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
    canFix: function(element) {//判定是否需要对300ms延迟的点击事件进行修复
        // 如果是PC端就不需要修复了
        if (typeof window.ontouchstart === 'undefined') {
            return false;
        }
        var chromeVersion = +(/Chrome\/([0-9]+)/.exec(ua) || [0, 0])[1];
        if (chromeVersion) {//chrome 安卓版如果指定了特定的meta也不需要修复
            if (isAndroid) {
                var metaViewport = document.querySelector('meta[name=viewport]');
                if (metaViewport) {
                    // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
                    if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                        return false;
                    }
                    // Chrome 32 and above with width=device-width or less don't need FastClick
                    if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                        return false;
                    }
                }
            }
        }
        //fastClick的原版还对黑莓手机进行检测， 不过它在国内的市场份额太少了，因此不管它
        //IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
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
                touchStartY;
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
            avalon(element).addClass(fastclick.activeClass)
            startTime = Date.now()
            var touches = event.touches && event.touches.length ? event.touches : [event];
            var e = touches[0]
            touchStartX = e.clientX
            touchStartY = e.clientY
        }
        function touchend(event) {
            var touches = (event.changedTouches && event.changedTouches.length) ? event.changedTouches :
                    ((event.touches && event.touches.length) ? event.touches : [event]);
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
            resetState();
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



