(function($) {
    $.Event = function(type, props) {
        if (!isString(type)) props = type, type = props.type
        var event = document.createEvent("Events"), bubbles = true
        if (props) for (var name in props) (name == 'bubbles') ? (bubbles = !!props[name]) : (event[name] = props[name])
        event.initEvent(type, bubbles, true)
        return event
    }
    function isString(arg) {
        return typeof arg == "string"
    }
    if($.fn.trigger) console.log("gesture依赖的fn.trigger可能会覆盖掉avalon已有的fn.trigger")
    $.fn.trigger = function(event, args){
        event = $.Event(event) 
        event._args = args
        // items in the collection might not be DOM elements
        if('dispatchEvent' in this[0]) this[0].dispatchEvent(event)
    }
     var TOUCHKEYS = [
        'screenX', 'screenY', 'clientX', 'clientY', 'pageX', 'pageY'
    ], // 需要复制的属性
        TOUCH_NUM = 2, // 最大支持触点数 1 或 2
        TAP_TIMEOUT = 200, // 判断 tap 的延时
        FLICK_TIMEOUT = 300, // 判断 flick 的延时
        PAN_DISTANCE = 10, // 判定 pan 的位移偏移量
        DIRECTION_DEG = 15, // 判断方向的角度
        DOUBLETAP_GAP = 500, // double 判定延时
        PINCH_DIS = 10; // 判定 pinch 的位移偏移量

    var curElement = null,
        curVetor = null,
        gestures = {},
        lastTapTime = NaN,
        initialAngle = 0,
        rotation = 0;

    // 是否支持多指
    function supportMulti() {
        return TOUCH_NUM == 2;
    }

    // 获取 obj 中 key 的数量
    function getKeys(obj) {
        return Object.getOwnPropertyNames(obj);
    }

    // 判断对象是否为空
    function isEmpty(obj) {
        return getKeys(obj).length === 0;
    }

    // fix：safari可能是文本节点
    function fixElement(el) {
        return 'tagName' in el ? el : el.parentNode;
    }

    // 复制 touch 对象上的有用属性到固定对象上
    function mixTouchAttr(target, source) {
        TOUCHKEYS.forEach(function(key) {
            target[key] = source[key];
        });
        return target;
    }

    // 获取方向
    function getDirection(offsetX, offsetY) {
        var ret = [],
            absX = Math.abs(offsetX),
            absY = Math.abs(offsetY),
            proportion = Math.tan(DIRECTION_DEG / 180 * Math.PI),
            transverse = absX > absY;

        if (absX > 0 || absY > 0) {
            ret.push(transverse ? offsetX > 0 ? 'right' : 'left' : offsetY > 0 ? 'down' : 'up');
            if (transverse && absY / absX > proportion) {
                ret.push(offsetY > 0 ? 'down' : 'up');
            } else if (!transverse && absX / absY > proportion) {
                ret.push(offsetX > 0 ? 'right' : 'left');
            }
        }

        return ret;
    }

    // 计算距离
    function computeDistance(offsetX, offsetY) {
        return Math.sqrt(Math.pow(offsetX, 2) + Math.pow(offsetY, 2));
    }

    // 计算角度
    function computeDegree(offsetX, offsetY) {
        var degree = Math.atan2(offsetY, offsetX) / Math.PI * 180;
        return degree < 0 ? degree + 360 : degree;
    }

    // 计算角度，返回（0-180）
    function computeDegree180(offsetX, offsetY) {
        var degree = Math.atan(offsetY * -1 / offsetX) / Math.PI * 180;
        return degree < 0 ? degree + 180 : degree;
    }

    // 获取偏转角
    function getAngleDiff(offsetX, offsetY) {
        var diff = initialAngle - computeDegree180(offsetX, offsetY);

        while (Math.abs(diff - rotation) > 90) {
            if (rotation < 0) {
                diff -= 180;
            } else {
                diff += 180;
            }
        }
        rotation = diff;
        return rotation;
    }

    // 构造 pan / flick / panend 事件
    function createPanEvent(type, offsetX, offsetY, touch, duration) {
        var ev = $.Event(type);
        ev.offsetX = offsetX;
        ev.offsetY = offsetY;
        ev.degree = computeDegree(offsetX, offsetY);
        ev.directions = getDirection(offsetX, offsetY);
        if (duration) {
            ev.duration = duration;
            ev.speedX = ev.offsetX / duration;
            ev.speedY = ev.offsetY / duration;
        }
        return mixTouchAttr(ev, touch);
    }

    // 构造 pinch 事件
    function createMultiEvent(type, centerX, centerY, scale, deflection, touch1, touch2) {
        var ev = $.Event(type);
        ev.centerX = centerX;
        ev.centerY = centerY;
        if (scale !== void 0) {
            ev.scale = scale;
        }
        if (deflection !== void 0) {
            ev.deflection = deflection;
        }
        ev.touchs = [touch1, touch2];
        return ev;
    }

    // 判断是否处理完所有触点
    function checkEnd() {
        var flag = true;
        for (var key in gestures) {
            if (gestures[key].status != 'end') {
                flag = false;
                break;
            }
        }
        return flag;
    }

    $.ready(function() {
        var body = $(document.body);

        // 处理 touchstart 事件
        function touchStart(event) {

            // 判定现在是否开始手势判定
            if (isEmpty(gestures)) {
                // 获取第一个触点的Element
                curElement = $(fixElement(event.touches[0].target));
            }

            // 遍历每一个 touch 对象，进行处理
            $.each(event.changedTouches, function(index, touch) {
                var keys = getKeys(gestures);
                if (keys.length < TOUCH_NUM) {
                    var origin = mixTouchAttr({}, touch),
                        gesture = {
                            startTouch: origin,
                            curTouch: origin,
                            startTime: Date.now(),
                            status: 'tapping',
                            other: null,
                            handler: setTimeout(function() {
                                if (gesture.status == 'tapping') {
                                    gesture.status = 'pressing';
                                    curElement.trigger(mixTouchAttr($.Event('press'), origin));
                                }
                                clearTimeout(gesture.handler);
                                gesture.handler = null;
                            }, TAP_TIMEOUT)
                        };

                    curElement.trigger(mixTouchAttr($.Event('feel'), origin));

                    // 每一次手势不同触点的 identifier 是不同的
                    gestures[touch.identifier] = gesture;

                    if (supportMulti() && keys.length == 1) {
                        var otherTouch = gestures[keys[0]].startTouch,
                            disX = origin.clientX - otherTouch.clientX,
                            disY = origin.clientY - otherTouch.clientY,
                            centerX = (origin.clientX + otherTouch.clientX) / 2,
                            centerY = (origin.clientY + otherTouch.clientY) / 2;
                        gesture.other = gestures[keys[0]];
                        gestures[keys[0]].other = gesture;
                        curVetor = {
                            centerX: centerX,
                            centerY: centerY,
                            pinch: false,
                            deflection: false,
                            distance: computeDistance(disX, disY)
                        };

                        initialAngle = computeDegree180(disX, disY);
                    }
                }
            });
        }

        // 处理 touchmove 事件
        function touchMove(event) {
            $.each(event.changedTouches, function(index, touch) {
                var gesture = gestures[touch.identifier],
                    flag = false;
                if (gesture) {
                    var startTouch = gesture.startTouch,
                        offsetX = touch.clientX - startTouch.clientX,
                        offsetY = touch.clientY - startTouch.clientY;

                    if (gesture.status == 'tapping' || gesture.status == 'pressing') {
                        if (computeDistance(offsetX, offsetY) > PAN_DISTANCE) {
                            gesture.status = 'panning';
                            // 记录移动开始的时间
                            gesture.startMoveTime = Date.now();
                            curElement.trigger(createPanEvent('pan', offsetX, offsetY, touch));
                        }
                    } else if (gesture.status == 'panning') {
                        curElement.trigger(createPanEvent('pan', offsetX, offsetY, touch));
                    }

                    if (supportMulti() && gesture.other && gesture.other.status != 'end') {
                        var otherTouch = gesture.other.curTouch,
                            disX = touch.clientX - otherTouch.clientX,
                            disY = touch.clientY - otherTouch.clientY,
                            centerX = (touch.clientX + otherTouch.clientX) / 2,
                            centerY = (touch.clientY + otherTouch.clientY) / 2,
                            distance = computeDistance(disX, disY);

                        // 判断 pinch
                        if (!curVetor.pinch) {
                            if (Math.abs(curVetor.distance - distance) > PINCH_DIS) {
                                curVetor.pinch = true;
                                curElement.trigger(createMultiEvent('pinch', centerX, centerY, distance /
                                    curVetor.distance, void 0, touch, otherTouch));
                            }
                        } else {
                            curElement.trigger(createMultiEvent('pinch', centerX, centerY, distance /
                                curVetor.distance, void 0, touch, otherTouch));
                        }

                        // 判断 rorate
                        if (!curVetor.deflection) {
                            var rotation = getAngleDiff(disX, disY);
                            if (Math.abs(rotation) > DIRECTION_DEG) {
                                curElement.trigger(createMultiEvent('rotate', centerX, centerY, void 0, rotation, touch, otherTouch));
                                curVetor.deflection = true;
                            }
                        } else {
                            var rotation = getAngleDiff(disX, disY);
                            curElement.trigger(createMultiEvent('rotate', centerX, centerY, void 0, rotation, touch, otherTouch));
                        }

                    }

                    gesture.curTouch = mixTouchAttr({}, touch);
                }
            });
        }

        // 处理 touchend 事件
        function touchEnd(event) {

            $.each(event.changedTouches, function(index, touch) {
                var gesture = gestures[touch.identifier];
                if (gesture) {

                    if (gesture.handler) {
                        clearTimeout(gesture.handler);
                        gesture.handler = null;
                    }

                    if (gesture.status == 'tapping') {
                        curElement.trigger(mixTouchAttr($.Event('tap'), touch));
                    } else if (gesture.status == 'pressing') {
                        curElement.trigger(mixTouchAttr($.Event('pressend'), touch));
                    } else if (gesture.status == 'panning') {
                        var startTouch = gesture.startTouch,
                            offsetX = touch.clientX - startTouch.clientX,
                            offsetY = touch.clientY - startTouch.clientY,
                            duration = Date.now() - gesture.startMoveTime;
                        curElement.trigger(createPanEvent('panend', offsetX, offsetY, touch, duration));
                        // 判断是否是快速移动
                        if (duration < FLICK_TIMEOUT) {
                            curElement.trigger(createPanEvent('flick', offsetX, offsetY, touch, duration));
                        }
                    }

                    if (supportMulti() && gesture.other && gesture.other.status != 'end') {
                        var otherTouch = gesture.other.curTouch,
                            disX = touch.clientX - otherTouch.clientX,
                            disY = touch.clientY - otherTouch.clientY,
                            centerX = (touch.clientX + otherTouch.clientX) / 2,
                            centerY = (touch.clientY + otherTouch.clientY) / 2,
                            distance = computeDistance(disX, disY);
                        if (curVetor.pinch) {
                            curElement.trigger(createMultiEvent('pinchend', centerX, centerY, distance /
                                curVetor.distance, void 0, touch, otherTouch));
                        }
                        if (curVetor.deflection) {
                            var rotation = getAngleDiff(disX, disY);
                            curElement.trigger(createMultiEvent('rotatend', centerX, centerY, void 0, rotation, touch, otherTouch));

                            
                        }  
                        rotation = 0;
                    }

                    gesture.status = 'end';
                }

            });

            if (checkEnd()) {
                for (var key in gestures) {
                    delete gestures[key];
                }
            }
        }

        body.bind('touchstart', touchStart);
        body.bind('touchmove', touchMove);
        body.bind('touchend', touchEnd);

        body.bind('tap', function(ev) {
            var now = Date.now();
            if (now - lastTapTime < DOUBLETAP_GAP) {
                curElement.trigger(mixTouchAttr($.Event('doubletap'), ev));
            }
            lastTapTime = now;
        });
    })

})(avalon);