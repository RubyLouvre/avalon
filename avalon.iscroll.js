define(["avalon"], function() {
    var rAF = window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.oRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function(callback) {
                window.setTimeout(callback, 1000 / 60);
            };
    var noScroll = avalon.oneObject("TEXTAREA,INPUT,SELECT")
    var utils = {
        ease: {
            quadratic: {
                style: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                fn: function(k) {
                    return k * (2 - k);
                }
            },
            circular: {
                style: 'cubic-bezier(0.1, 0.57, 0.1, 1)', // Not properly "circular" but this looks better, it should be (0.075, 0.82, 0.165, 1)
                fn: function(k) {
                    return Math.sqrt(1 - (--k * k));
                }
            },
            back: {
                style: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                fn: function(k) {
                    var b = 4;
                    return (k = k - 1) * k * ((b + 1) * k + b) + 1;
                }
            },
            bounce: {
                style: '',
                fn: function(k) {
                    if ((k /= 1) < (1 / 2.75)) {
                        return 7.5625 * k * k;
                    } else if (k < (2 / 2.75)) {
                        return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
                    } else if (k < (2.5 / 2.75)) {
                        return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
                    } else {
                        return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
                    }
                }
            },
            elastic: {
                style: '',
                fn: function(k) {
                    var f = 0.22,
                            e = 0.4;

                    if (k === 0) {
                        return 0;
                    }
                    if (k == 1) {
                        return 1;
                    }

                    return (e * Math.pow(2, -10 * k) * Math.sin((k - f / 4) * (2 * Math.PI) / f) + 1);
                }
            }
        },
        offset: function(el) {
            var left = -el.offsetLeft,
                    top = -el.offsetTop;

            // jshint -W084
            while (el = el.offsetParent) {
                left -= el.offsetLeft;
                top -= el.offsetTop;
            }
            // jshint +W084

            return {
                left: left,
                top: top
            };
        },
        momentum: function(current, start, time, lowerMargin, wrapperSize, deceleration) {
            var distance = current - start,
                    speed = Math.abs(distance) / time,
                    destination,
                    duration;

            deceleration = deceleration === void 0 ? 0.0006 : deceleration;

            destination = current + (speed * speed) / (2 * deceleration) * (distance < 0 ? -1 : 1)
            duration = speed / deceleration

            if (destination < lowerMargin) {
                destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin
                distance = Math.abs(destination - current)
                duration = distance / speed
            } else if (destination > 0) {
                destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0
                distance = Math.abs(current) + destination
                duration = distance / speed
            }

            return {
                destination: Math.round(destination),
                duration: duration
            };
        },
        isBadAndroid: /Android /.test(window.navigator.appVersion) && !(/Chrome\/\d/.test(window.navigator.appVersion)),
        style: {
            transform: avalon.cssName("transform"),
            transitionTimingFunction: avalon.cssName("transitionTimingFunction"),
            transitionDuration: avalon.cssName("transitionDuration"),
            transitionDelay: avalon.cssName("transitionDelay"),
            transformOrigin: avalon.cssName("transformOrigin")
        },
        addEvent: function(el, type, fn, capture) {
            el.addEventListener(type, fn, !!capture);
        },
        removeEvent: function(el, type, fn, capture) {
            el.removeEventListener(type, fn, !!capture);
        }
    }

    if (!window.addEventListener) {
        utils.addEvent = function(el, type, fn, capture) {
            el.attachEvent("on" + type, fn)
        }
        utils.removeEvent = function(el, type, fn, capture) {
            el.detachEvent("on" + type, fn)
        }
    }



    avalon.mix(utils, {
        hasTransform: !!avalon.cssName("transform"),
        hasPerspective: !!avalon.cssName("perspective"),
        hasTransition: !!avalon.cssName("transition")
    })
    var touchNames = ["mousedown", "mousemove", "mouseup", ""]
    var IE11touch = navigator.pointerEnabled
    var IE9_10touch = navigator.msPointerEnabled
    if (IE11touch) { //IE11 与 W3C
        touchNames = ["pointerdown", "pointermove", "pointerup", "pointercancel"]
    } else if (IE9_10touch) { //IE9-10
        touchNames = ["MSPointerDown", "MSPointerMove", "MSPointerUp", "MSPointerCancel"]
    } else if ("ontouchstart" in window) {
        touchNames = ["touchstart", "touchmove", "touchend", "touchcancel"]
    }

//https://www.gitbook.io/book/iiunknown/iscroll-5-api-cn/reviews
    function IScroll(el, options) {
        this.wrapper = typeof el === 'string' ? document.querySelector(el) : el;
        this.scroller = this.wrapper.children[0];
        this.scrollerStyle = this.scroller.style;		// cache style for better performance
        //默认参数

        //options.useTransform
        //默认情况下引擎会使用CSStransform属性。如果现在还是2007年，那么可以设置这个属性为false，这就是说：引擎将使
        //用top/left属性来进行滚动。
        //这个属性在滚动器感知到Flash，iframe或者视频插件内容时会有用，但是需要注意：性能会有极大的损耗。
        //默认值：true
        //options.useTransition
        //iScroll使用CSS transition来实现动画效果（动量和弹力）。如果设置为false，那么将使用requestAnimationFrame代替。
        //在现在浏览器中这两者之间的差异并不明显。在老的设备上transitions执行得更好。
        //默认值：true
        //options.HWCompositing
        //这个选项尝试使用translateZ(0)来把滚动器附加到硬件层，以此来改变CSS属性。在移动设备上这将提高性能，但在有些
        //情况下,你可能想要禁用它(特别是如果你有太多的元素和硬件性能跟不上)。
        //默认值：true
        //如果不确定iScroll的最优配置。从性能角度出发，上面的所有选项应该设置为true。（或者更好的方式，让他们自动设置属
        //性为true）。你可以尝试这配置他们，但是要小心内存泄漏。
        this.options = {
            resizeScrollbars: true,
            mouseWheelSpeed: 20,
            snapThreshold: 0.334,
            startX: 0,
            startY: 0,
            scrollY: true,
            directionLockThreshold: 5,
            momentum: true,//动量效果，拖动惯性
            bounce: true,//是否超过实际位置反弹
            bounceTime: 600,
            bounceEasing: '',
            preventDefault: true,
            preventDefaultException: {tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT)$/},
            HWCompositing: true,
            useTransition: true,
            useTransform: true
        };
        avalon.mix(this.options, options)

        // 调整参数
        this.translateZ = this.options.HWCompositing && utils.hasPerspective ? ' translateZ(0)' : '';

        this.options.useTransition = utils.hasTransition && this.options.useTransition;
        this.options.useTransform = utils.hasTransform && this.options.useTransform;

        this.options.eventPassthrough = this.options.eventPassthrough === true ? 'vertical' : this.options.eventPassthrough;
        this.options.preventDefault = !this.options.eventPassthrough && this.options.preventDefault;

        // If you want eventPassthrough I have to lock one of the axes
        this.options.scrollY = this.options.eventPassthrough == 'vertical' ? false : this.options.scrollY;
        this.options.scrollX = this.options.eventPassthrough == 'horizontal' ? false : this.options.scrollX;

        // With eventPassthrough we also need lockDirection mechanism
        this.options.freeScroll = this.options.freeScroll && !this.options.eventPassthrough;
        this.options.directionLockThreshold = this.options.eventPassthrough ? 0 : this.options.directionLockThreshold;

        this.options.bounceEasing = typeof this.options.bounceEasing == 'string' ? utils.ease[this.options.bounceEasing] || utils.ease.circular : this.options.bounceEasing;

        this.options.resizePolling = this.options.resizePolling === undefined ? 60 : this.options.resizePolling;

        if (this.options.tap === true) {
            this.options.tap = 'tap';
        }

        if (this.options.shrinkScrollbars == 'scale') {
            this.options.useTransition = false;
        }

        this.options.invertWheelDirection = this.options.invertWheelDirection ? -1 : 1;

// INSERT POINT: NORMALIZATION

        // Some defaults	
        this.x = 0;
        this.y = 0;
        this.directionX = 0;
        this.directionY = 0;
        this._events = {};

// INSERT POINT: DEFAULTS

        this._init();
        this.refresh();

        this.scrollTo(this.options.startX, this.options.startY);
        this.enable();
    }

    function getTransitionEndEventName() {
        var obj = {
            TransitionEvent: "transitionend",
            WebKitTransitionEvent: "webkittransitionEnd",
            OTransitionEvent: "OTransitionEnd",
            otransitionEvent: "otransitionEnd",
            MSTransitionEvent: "MSTransitionEnd"
        }
        //  var ev = document.createEvent("TransitionEvent"); // FIXME: un-specified
        //  ev.initTransitionEvent("transitionend", true, true, "some-unknown-prop", -4.75);
        //  document.body.dispatchEvent(ev);
        var ret = false, ev
        for (var name in obj) {
            try {
                ev = document.createEvent(name)//只有firefox不支持
                ret = obj[name]
                break
            } catch (e) {
            }
        }
        if (ret === false) {
            //https://bugzilla.mozilla.org/show_bug.cgi?id=868751
            //https://hg.mozilla.org/integration/mozilla-inbound/rev/a20ea0d494a0
            try {
                ev = new TransitionEvent("transitionend",
                        {
                            bubbles: true,
                            cancelable: true,
                            propertyName: "some-unknown-prop",
                            elapsedTime: 0.5,
                            pseudoElement: "pseudo"
                        });
                ret = "transitionend"
            } catch (e) {
            }
        }
        getTransitionEndEventName = function() {
            return ret
        }
        return ret
    }

    function fixEvent(event) {
        var ret = {}
        for (var i in event) {
            ret[i] = event[i]
        }
        var target = ret.target = event.srcElement
        if (event.type.indexOf("key") === 0) {
            ret.which = event.charCode != null ? event.charCode : event.keyCode
        } else if (/mouse|click/.test(event.type)) {
            var doc = target.ownerDocument || DOC
            var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
            ret.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
            ret.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        }
        ret.timeStamp = new Date - 0
        ret.originalEvent = event
        ret.preventDefault = function() { //阻止默认行为
            event.returnValue = false
        }
        ret.stopPropagation = function() { //阻止事件在DOM树中的传播
            event.cancelBubble = true
        }
        return ret
    }

    IScroll.prototype = {
        version: '5.1.2',
        _init: function() {
            this._initEvents()

            if (this.options.scrollbars || this.options.indicators) {
                this._initIndicators();
            }

            if (this.options.mouseWheel) {
                this._initWheel();
            }

            if (this.options.snap) {
                this._initSnap();
            }

            if (this.options.keyBindings) {
                this._initKeys();
            }

        },
        _initEvents: function(remove) {
            //绑定或卸载事件
            var eventType = remove ? utils.removeEvent : utils.addEvent
            var target = this.options.bindToWrapper ? this.wrapper : window
            var that = this

            function hander(e) {
                if (!("target" in e)) {
                    e = fixEvent(e)
                }
                that.handleEvent(e)
            }

            eventType(window, "orientationchange", hander)
            eventType(window, "resize", hander)

            if (this.options.click) {
                eventType(this.wrapper, "click", hander, true)
            }
            for (var i = 0, type; type = touchNames[i]; i = 0) {
                var el = i === 0 ? this.wrapper : target
                eventType(el, type, hander)
            }
            eventType(this.scroller, getTransitionEndEventName(), hander)
        },
        handleEvent: function(e) {
            switch (e.type) {
                case touchNames[0]:
                    this._start(e)
                    break
                case touchNames[1]:
                    this._move(e)
                    break
                case touchNames[2]:
                case touchNames[3]:
                    this._end(e)
                    break
                case "orientationchange":
                case "resize":
                    this._resize()
                    break
                case getTransitionEndEventName():
                    this._transitionEnd(e)
                    break
                case "wheel":
                case "DOMMouseScroll":
                case "mousewheel":
                    this._wheel(e)
                    break
                case "keydown":
                    this._key(e)
                    break
                case "click":
                    if (!e._constructed) {
                        e.preventDefault()
                        e.stopPropagation()
                    }
                    break
            }
        },
        on: function(type, fn) {//添加用户回调
            if (!this._events[type]) {
                this._events[type] = []
            }
            this._events[type].push(fn)
        },
        off: function(type, fn) {//卸载用户回调
            var fns = this._events[type] || []
            var index = fns.indexOf(fn)
            if (index > -1) {
                this._events[type].splice(index, 1)
            }
        },
        _execEvent: function(type) {//触发用户回调
            var fns = this._events[type] || []
            var args = [].slice.call(arguments, 1)
            for (var i = 0, fn; fn = fns[i++]; ) {
                fn.apply(this, args)
            }
        },
        _start: function(e) {
            if (!this.enabled || this.initiated || e.button !== 0) {
                return//只处理左键
            }

            if (this.options.preventDefault && !utils.isBadAndroid && !noScroll[e.target.tagName]) {
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e

            this.initiated = true
            this.moved = false;
            this.distX = 0;
            this.distY = 0;
            this.directionX = 0;
            this.directionY = 0;
            this.directionLocked = 0;

            this._transitionTime()

            this.startTime = new Date - 0

            if (this.options.useTransition && this.isInTransition) {
                this.isInTransition = false;
                var pos = this.getComputedPosition();
                this._translate(Math.round(pos.x), Math.round(pos.y));
                this._execEvent('scrollEnd');
            } else if (!this.options.useTransition && this.isAnimating) {
                this.isAnimating = false;
                this._execEvent('scrollEnd');
            }

            this.startX = this.x;
            this.startY = this.y;
            this.absStartX = this.x;
            this.absStartY = this.y;
            this.pointStartX = point.pageX;
            this.pointStartY = point.pageY;
            this.pointX = point.pageX;
            this.pointY = point.pageY;

            this._execEvent('beforeScrollStart') //
        },
        _move: function(e) {
            if (!this.initiated) {
                return;
            }

            if (this.options.preventDefault) {	// increases performance on Android? TODO: check!
                e.preventDefault();
            }

            var point = e.touches ? e.touches[0] : e,
                    deltaX = point.pageX - this.pointStartX,
                    deltaY = point.pageY - this.pointStartY,
                    timestamp = new Date - 0,
                    newX, newY,
                    absDistX, absDistY;

            this.pointX = point.pageX;//当前相对于页面的坐标
            this.pointY = point.pageY;

            this.distX = deltaX;
            this.distY = deltaY;
            absDistX = Math.abs(this.distX);
            absDistY = Math.abs(this.distY);

            // We need to move at least 10 pixels for the scrolling to initiate
            if (timestamp - this.endTime > 300 && (absDistX < 10 && absDistY < 10)) {
                return;
            }

            // If you are scrolling in one direction lock the other
            if (!this.directionLocked && !this.options.freeScroll) {
                if (absDistX > absDistY + this.options.directionLockThreshold) {
                    this.directionLocked = 'h';		// lock horizontally
                } else if (absDistY >= absDistX + this.options.directionLockThreshold) {
                    this.directionLocked = 'v';		// lock vertically
                } else {
                    this.directionLocked = 'n';		// no lock
                }
            }

            if (this.directionLocked == 'h') {
                if (this.options.eventPassthrough == 'vertical') {
                    e.preventDefault();
                } else if (this.options.eventPassthrough == 'horizontal') {
                    this.initiated = false;
                    return;
                }

                deltaY = 0;
            } else if (this.directionLocked == 'v') {
                if (this.options.eventPassthrough == 'horizontal') {
                    e.preventDefault();
                } else if (this.options.eventPassthrough == 'vertical') {
                    this.initiated = false;
                    return;
                }

                deltaX = 0;
            }

            deltaX = this.hasHorizontalScroll ? deltaX : 0;
            deltaY = this.hasVerticalScroll ? deltaY : 0;

            newX = this.x + deltaX;
            newY = this.y + deltaY;

            // Slow down if outside of the boundaries
            if (newX > 0 || newX < this.maxScrollX) {
                newX = this.options.bounce ? this.x + deltaX / 3 : newX > 0 ? 0 : this.maxScrollX;
            }
            if (newY > 0 || newY < this.maxScrollY) {
                newY = this.options.bounce ? this.y + deltaY / 3 : newY > 0 ? 0 : this.maxScrollY;
            }

            this.directionX = deltaX > 0 ? -1 : deltaX < 0 ? 1 : 0;
            this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;

            if (!this.moved) {
                this._execEvent('scrollStart');
            }

            this.moved = true;

            this._translate(newX, newY);

            /* REPLACE START: _move */

            if (timestamp - this.startTime > 300) {
                this.startTime = timestamp;
                this.startX = this.x;
                this.startY = this.y;
            }

            /* REPLACE END: _move */

        },
        _end: function(e) {
            if (!this.enabled) {
                return;
            }

            if (this.options.preventDefault && !noScroll[e.target.tagName]) {
                e.preventDefault();
            }

            var point = e.changedTouches ? e.changedTouches[0] : e,
                    momentumX,
                    momentumY,
                    duration = new Date - this.startTime,
                    newX = Math.round(this.x),
                    newY = Math.round(this.y),
                    distanceX = Math.abs(newX - this.startX),
                    distanceY = Math.abs(newY - this.startY),
                    time = 0,
                    easing = '';

            this.isInTransition = 0;
            this.initiated = false;
            this.endTime = new Date - 0;

            // reset if we are outside of the boundaries
            if (this.resetPosition(this.options.bounceTime)) {
                return;
            }

            this.scrollTo(newX, newY);	// ensures that the last position is rounded

            // we scrolled less than 10 pixels
            if (!this.moved) {


                this._execEvent('scrollCancel');
                return;
            }

            // start momentum animation if needed
            if (this.options.momentum && duration < 300) {
                momentumX = this.hasHorizontalScroll ? utils.momentum(this.x, this.startX, duration, this.maxScrollX, this.options.bounce ? this.wrapperWidth : 0, this.options.deceleration) : {destination: newX, duration: 0};
                momentumY = this.hasVerticalScroll ? utils.momentum(this.y, this.startY, duration, this.maxScrollY, this.options.bounce ? this.wrapperHeight : 0, this.options.deceleration) : {destination: newY, duration: 0};
                newX = momentumX.destination;
                newY = momentumY.destination;
                time = Math.max(momentumX.duration, momentumY.duration);
                this.isInTransition = 1;
            }

// INSERT POINT: _end

            if (newX != this.x || newY != this.y) {
                // change easing function when scroller goes out of the boundaries
                if (newX > 0 || newX < this.maxScrollX || newY > 0 || newY < this.maxScrollY) {
                    easing = utils.ease.quadratic;
                }

                this.scrollTo(newX, newY, time, easing);
                return;
            }

            this._execEvent('scrollEnd');
        },
        scrollBy: function(x, y, time, easing) {
            x = this.x + x;
            y = this.y + y;
            time = time || 0;

            this.scrollTo(x, y, time, easing);
        },
        //这个方法接受4个参数 x, y, time, easing x 为移动的x轴坐标，y为移动的y轴坐标, time为移动时间，easing表示使用何种缓动公式。 
        scrollTo: function(x, y, time, easing) {
            easing = easing || utils.ease.circular;
            this.isInTransition = this.options.useTransition && time > 0;// 正在使用CSS3transition
            if (!time || (this.options.useTransition && easing.style)) {
                this._transitionTimingFunction(easing.style);
                this._transitionTime(time);
                this._translate(x, y);
            } else {//如果不支持，使用JS动画
                this._animate(x, y, time, easing.fn);
            }
        },
        // scrollToElement --> scrollTo --> _translate or _animate
        // scrollBy --> scrollTo --> _translate or _animate
        scrollToElement: function(el, time, offsetX, offsetY, easing) {
            el = el.nodeType ? el : this.scroller.querySelector(el);

            if (!el) {
                return;
            }

            var pos = utils.offset(el);

            pos.left -= this.wrapperOffset.left;
            pos.top -= this.wrapperOffset.top;

            // if offsetX/Y are true we center the element to the screen
            if (offsetX === true) {
                offsetX = Math.round(el.offsetWidth / 2 - this.wrapper.offsetWidth / 2);
            }
            if (offsetY === true) {
                offsetY = Math.round(el.offsetHeight / 2 - this.wrapper.offsetHeight / 2);
            }

            pos.left -= offsetX || 0;
            pos.top -= offsetY || 0;

            pos.left = pos.left > 0 ? 0 : pos.left < this.maxScrollX ? this.maxScrollX : pos.left;
            pos.top = pos.top > 0 ? 0 : pos.top < this.maxScrollY ? this.maxScrollY : pos.top;

            time = time == null || time === 'auto' ? Math.max(Math.abs(this.x - pos.left), Math.abs(this.y - pos.top)) : time;

            this.scrollTo(pos.left, pos.top, time, easing);
        },
        _translate: function(x, y) {
            if (this.options.useTransform) {//使用transform
                this.scrollerStyle[utils.style.transform] = 'translate(' + x + 'px,' + y + 'px)' + this.translateZ;
            } else {
                x = Math.round(x);//使用translate
                y = Math.round(y);
                this.scrollerStyle.left = x + 'px';
                this.scrollerStyle.top = y + 'px';
            }
            this.x = x;
            this.y = y;
        },
        _animate: function(destX, destY, duration, easingFn) {
            var that = this,
                    startX = this.x,
                    startY = this.y,
                    startTime = utils.getTime(),
                    destTime = startTime + duration;

            function step() {
                var now = utils.getTime(),
                        newX, newY,
                        easing;

                if (now >= destTime) {
                    that.isAnimating = false;
                    that._translate(destX, destY);

                    if (!that.resetPosition(that.options.bounceTime)) {
                        that._execEvent('scrollEnd');
                    }

                    return;
                }

                now = (now - startTime) / duration;
                easing = easingFn(now);
                newX = (destX - startX) * easing + startX;
                newY = (destY - startY) * easing + startY;
                that._translate(newX, newY);

                if (that.isAnimating) {
                    rAF(step);
                }
            }

            this.isAnimating = true;
            step();
        },
        _transitionTime: function(time) {
            //调整时长
            time = time || 0
            this.scrollerStyle[utils.style.transitionDuration] = time + 'ms';
            if (!time && utils.isBadAndroid) {
                this.scrollerStyle[utils.style.transitionDuration] = '0.001s';
            }
        },
        _transitionTimingFunction: function(easing) {
            //设置缓动公式
            this.scrollerStyle[utils.style.transitionTimingFunction] = easing;
        },
        getComputedPosition: function() {
            var matrix = window.getComputedStyle(this.scroller, null),
                    x, y;

            if (this.options.useTransform) {
                matrix = matrix[utils.style.transform].split(')')[0].split(', ');
                x = +(matrix[12] || matrix[4]);
                y = +(matrix[13] || matrix[5]);
            } else {
                x = +matrix.left.replace(/[^-\d.]/g, '');
                y = +matrix.top.replace(/[^-\d.]/g, '');
            }

            return {x: x, y: y};
        },
        _resize: function() {
            var that = this;

            clearTimeout(this.resizeTimeout);

            this.resizeTimeout = setTimeout(function() {
                that.refresh();
            }, this.options.resizePolling);
        },
        resetPosition: function(time) {
            var x = this.x,
                    y = this.y;

            time = time || 0;

            if (!this.hasHorizontalScroll || this.x > 0) {
                x = 0;
            } else if (this.x < this.maxScrollX) {
                x = this.maxScrollX;
            }

            if (!this.hasVerticalScroll || this.y > 0) {
                y = 0;
            } else if (this.y < this.maxScrollY) {
                y = this.maxScrollY;
            }

            if (x == this.x && y == this.y) {
                return false;
            }

            this.scrollTo(x, y, time, this.options.bounceEasing);

            return true;
        },
        //调用这个方法会立即停止动画滚动，并且把滚动位置还原成0，取消绑定touchmove, touchend、touchcancel事件。 
        disable: function() {
            this.enabled = false;
        },
        //调用这个方法，使得iscroll恢复默认正常状态
        enable: function() {
            this.enabled = true;
        }
    }
})
