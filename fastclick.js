/**
 avalon.mobile特别版，改良chrome32-中的点击事件
 */
window.FastClick == function(layer) {
    
    var oldOnClick, self = this;


//是否触发中
    this.trackingClick = false;

//触发时间
    this.trackingClickStart = 0;
    //事件源对象
    this.targetElement = null;


    //方位
    this.touchStartX = 0;
    this.touchStartY = 0;
    /**
     每个触摸事件都包括了三个触摸列表：
     1. touches：当前位于屏幕上的所有手指的一个列表。
     2. targetTouches：位于当前DOM元素上的手指的一个列表。
     3. changedTouches：涉及当前事件的手指的一个列表。
     例如，在一个touchend事件中，这就会是移开的手指。
     这些列表由包含了触摸信息的对象组成：
     1. identifier：一个数值，唯一标识触摸会话（touch session）中的当前手指。
     2. target：DOM元素，是动作所针对的目标。
     3. 客户/页面/屏幕坐标：动作在屏幕上发生的位置。
     4. 半径坐标和 rotationAngle：画出大约相当于手指形状的椭圆形。
     */
    this.lastTouchIdentifier = 0;


    //可充许的移动偏离值

    this.touchBoundary = 10;

    //绑定监听器的元素（相当于currentTarget， event.target是可变的，event.currentTarget是不会变的））
    this.layer = layer;

    if (!layer || !layer.nodeType) {
        throw new TypeError('Layer must be a document node');
    }
    if (FastClick.notNeeded(layer)) {
        return;
    }
    this.onClick = function() {
        return FastClick.prototype.onClick.apply(self, arguments);
    }
    this.onMouse = function() {
        return FastClick.prototype.onMouse.apply(self, arguments);
    };
    this.onTouchStart = function() {
        return FastClick.prototype.onTouchStart.apply(self, arguments);
    };
    this.onTouchMove = function() {
        return FastClick.prototype.onTouchMove.apply(self, arguments);
    };

    this.onTouchEnd = function() {
        return FastClick.prototype.onTouchEnd.apply(self, arguments);
    };

    this.onTouchCancel = function() {
        return FastClick.prototype.onTouchCancel.apply(self, arguments);
    };
    if (this.deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);
    // 模拟stopImmediatePropagation方法
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
                rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
                rmv.call(layer, type, callback, capture);
            }
        };

        layer.addEventListener = function(type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    if (!event.propagationStopped) {
                        callback(event);
                    }
                }), capture);
            } else {
                adv.call(layer, type, callback, capture);
            }
        };
    }

    // 将已有的内联事件也放进多投事件列表中
    if (typeof layer.onclick === 'function') {
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
            oldOnClick(event);
        }, false);
        layer.onclick = null;
    }
}


FastClick.prototype.onTouchStart = function(event) {
    var touches = event.targetTouches
    //忽略多点触摸
    if (!touches || touches.length > 1) {
        return true;
    }
    var targetElement = event.target
    if (targetElement.nodeType === 3) {
        targetElement = targetElement.parentNode
    }
    var touch = touches[0];

    if (this.deviceIsIOS) {
        // Only trusted events will deselect text on iOS (issue #49)
        var selection = window.getSelection();
        //如果存在文字选中，那么返回
        if (selection.rangeCount && !selection.isCollapsed) {
            return true;
        }

        if (!this.deviceIsIOS4) {
            if (touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false;
            }
            this.lastTouchIdentifier = touch.identifier;
            //如果点击的A标签，需要更新scrollParent的滚动条状态
            this.updateScrollParent(targetElement);
        }
    }

    this.trackingClick = true;
    //记录事件发生的时间与事件源与页面位置
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;
    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    //阻止多击事件
    if ((event.timeStamp - this.lastClickTime) < 200) {
        event.preventDefault();
    }

    return true;
};


FastClick.prototype.onTouchMove = function(event) {
    
    if (!this.trackingClick) {
        return true;
    }
    var targetElement = event.target
    if (targetElement.nodeType === 3) {
        targetElement = targetElement.parentNode
    }
    if (this.targetElement !== targetElement || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
    }
    return true;
}
//判定有没有发生移动
FastClick.prototype.touchHasMoved = function(event) {
    var touch = event.changedTouches[0], boundary = this.touchBoundary;
    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
    }
    return false;
}

FastClick.prototype.onTouchEnd = function(event) {
    
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
        return true;
    }

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < 200) {
        this.cancelNextClick = true;
        return true;
    }

    // Reset to prevent wrong click cancel on input (issue #156).
    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    //IOS得到的事件源对象可能是错的  See issue #57
    if (this.deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];
        //通过document.elementFromPoint得到发生事件的那个元素节点
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (this.deviceIsAndroid) {
                return false;
            }

            targetElement = forElement;
        }
    } else if (this.needsFocus(targetElement)) {

        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (this.deviceIsIOS && window.top !== window && targetTagName === 'input')) {
            this.targetElement = null;
            return false;
        }

        this.focus(targetElement);

        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        if (!this.deviceIsIOS4 || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
        }

        return false;
    }

    if (this.deviceIsIOS && !this.deviceIsIOS4) {

        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
        }
    }

    // Prevent the actual click from going though - unless the target node is marked as requiring
    // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
    }

    return false;
};


FastClick.prototype.onTouchCancel = function() {
    this.targetElement = this.trackingClick = false
};


FastClick.prototype.onMouse = function(event) {

    // If a target element was never set (because a touch event was never fired) allow the event
    if (!this.targetElement) {
        return true;
    }

    if (event.forwardedTouchEvent) {
        return true;
    }

    // Programmatically generated events targeting a specific element should be permitted
    if (!event.cancelable) {
        return true;
    }

    // Derive and check the target element to see whether the mouse event needs to be permitted;
    // unless explicitly enabled, prevent non-touch click events from triggering actions,
    // to prevent ghost/doubleclicks.
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

        // Prevent any user-added listeners declared on FastClick element from being fired.
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
        }

        // Cancel the event
        event.stopPropagation();
        event.preventDefault();

        return false;
    }

    // If the mouse event is permitted, return true for the action to go through.
    return true;
};

FastClick.prototype.focus = function(target) {
    
    //在IOS7中，date, datetime控件，由于没有selectionStart selectionEnd属性，直接用setSelectionRange会抛错
    if (!isFinite(target.selectionStart)) {
        var n = target.value.length;
        target.setSelectionRange(n, n)//让光标定位于文本的最后
    } else {
        target.value = target.value//让光标定位于文本的最后
        target.focus()
    }
};

FastClick.prototype.onClick = function(event) {
    
    var permitted;
    if (this.trackingClick) {
        this.targetElement = this.trackingClick = false;
        return true;
    }
    if (event.target.type === 'submit' && event.detail === 0) {
        return true;
    }

    permitted = this.onMouse(event);
    if (!permitted) {
        this.targetElement = null;
    }

    // If clicks are permitted, return true for the action to go through.
    return permitted;
};


var UA = navigator.userAgent

FastClick.prototype.deviceIsAndroid = UA.indexOf('Android') > 0;


FastClick.prototype.deviceIsIOS = /iP(ad|hone|od)/.test(UA);

FastClick.prototype.deviceIsIOS4 = FastClick.prototype.deviceIsIOS && (/OS 4_\d(_\d)?/).test(UA);

FastClick.prototype.deviceIsIOSWithBadTarget = FastClick.prototype.deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(UA);


FastClick.prototype.needsClick = function(target) {
    
    switch (target.nodeName.toLowerCase()) {

        // Don't send a synthetic click to disabled inputs (issue #62)
        case 'button':
        case 'select':
        case 'textarea':
            if (target.disabled) {
                return true;
            }

            break;
        case 'input':

            // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
            if ((this.deviceIsIOS && target.type === 'file') || target.disabled) {
                return true;
            }

            break;
        case 'label':
        case 'video':
            return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};

FastClick.prototype.needsFocus = function(target) {
    
    switch (target.nodeName.toLowerCase()) {
        case 'textarea':
            return true;
        case 'select':
            return !this.deviceIsAndroid;
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
            return (/\bneedsfocus\b/).test(target.className);
    }
};


//手动实现点击事件向上冒泡
FastClick.prototype.sendClick = function(targetElement, event) {
    
    var clickEvent, touch;

    // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
    }

    touch = event.changedTouches[0];
    // Synthesise a click event, with an extra attribute so it can be tracked
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent(this.determineEventType(targetElement), true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
};

FastClick.prototype.determineEventType = function(targetElement) {
    
    //Issue #159: Android Chrome Select Box does not open with a synthetic click event
    if (this.deviceIsAndroid && targetElement.tagName.toLowerCase() === 'select') {
        return 'mousedown';
    }

    return 'click';
};



FastClick.prototype.updateScrollParent = function(targetElement) {
    
    var scrollParent, parentElement;

    scrollParent = targetElement.fastClickScrollParent;

    // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
    // target element was moved to another parent.
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break;
            }

            parentElement = parentElement.parentElement;
        } while (parentElement);
    }

    // Always update the scroll top tracker if possible.
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
    }
};


FastClick.prototype.findControl = function(labelElement) {
    

    // Fast path for newer browsers supporting the HTML5 control attribute
    if (labelElement.control !== undefined) {
        return labelElement.control;
    }

    // All browsers under test that support touch events also support the HTML5 htmlFor attribute
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
    }

    // If no for attribute exists, attempt to retrieve the first labellable descendant element
    // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
    
    var layer = this.layer;

    if (this.deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
    
    var metaViewport;
    var chromeVersion;

    // Devices that don't support touch don't need FastClick
    if (typeof window.ontouchstart === 'undefined') {
        return true;
    }

    // Chrome version - zero for other browsers
    chromeVersion = +(/Chrome\/([0-9]+)/.exec(UA) || [, 0])[1];

    if (chromeVersion) {

        if (FastClick.prototype.deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
                // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
                if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                    return true;
                }
                // Chrome 32 and above with width=device-width or less don't need FastClick
                if (chromeVersion > 31 && window.innerWidth <= window.screen.width) {
                    return true;
                }
            }

            // Chrome desktop doesn't need FastClick (issue #15)
        } else {
            return true;
        }
    }

    // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
    if (layer.style.msTouchAction === 'none') {
        return true;
    }

    return false;
};

FastClick.attach = function(layer) {
    
    return new FastClick(layer);
};

