var rdash = /\(([^)]*)\)/
bindingHandlers.on = function (data, vmodels) {
    var value = data.value
    data.type = "on"
    if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
        var matched = (value.match(rdash) || ["", ""])[1].trim()
        if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
            value = value.replace(rdash, "")
        }
    }
    parseExprProxy(value, vmodels, data)
}

bindingExecutors.on = function (_, elem, data) {
    var eventType = data.param.replace(/-\d+$/, "")
    // avalon.log("绑定" + eventType + "事件！")
    var uuid = getUid(elem)
    try {
        listenTo(eventType, document)
    } catch (e) {
        avalon.log(e)
    }
    EventPluginHub.addListener(uuid, eventType, data)
    data.rollback = function () {
        EventPluginHub.removeListener(uuid, eventType, data)
    }
}

function isEventSupported(eventNameSuffix, capture) {
    if (capture && !('addEventListener' in document)) {
        return false
    }

    var eventName = 'on' + eventNameSuffix;
    var isSupported = eventName in document;
    if (!isSupported) {
        var element = document.createElement('div');
        element.setAttribute(eventName, 'return;');
        isSupported = typeof element[eventName] === 'function';
    }

    if (!isSupported && eventNameSuffix === 'wheel') {
        isSupported = !!window.WheelEvent
    }

    return isSupported;
}

function getEventCharCode(nativeEvent) {
    var charCode;
    var keyCode = nativeEvent.keyCode;
    if ('charCode' in nativeEvent) {
        charCode = nativeEvent.charCode;
        // FF does not set `charCode` for the Enter-key, check against `keyCode`.
        if (charCode === 0 && keyCode === 13) {
            charCode = 13;
        }
    } else {
        // IE8 does not implement `charCode`, but `keyCode` has the correct value.
        charCode = keyCode;
    }
    // Some non-printable keys are reported in `charCode`/`keyCode`, discard them.
    // Must not discard the (non-)printable Enter-key.
    if (charCode >= 32 || charCode === 13) {
        return charCode;
    }
    return 0;
}

var isListening = {}

function listenTo(eventType, mountAt) {
    //通过事件名得到对应的插件
    var plugin = getPluginByEventType(eventType)
    if (!plugin) {
        avalon.log(eventType + " 事件不存在对应的插件模块 !")
    }
    //得到对应的依赖
    var dependencies = plugin ? plugin.eventTypes[eventType].dependencies : [eventType]
    //IE6-8下`keyup`/`keypress`/`keydown` 只能冒泡到 document
    for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (isListening[dependency] !== true) {
            if (dependency === "scroll") {
                addCapturedEvent("scroll", 'scroll', mountAt)
            } else if (dependency === "focus" || dependency === "blur") {
                addCapturedEvent("focus", 'focus', mountAt);
                addCapturedEvent("blur", 'blur', mountAt);
                isListening.focus = true
                isListening.blur = true
            } else {
                addBubbledEvent(eventType, dependency, mountAt);
            }
            isListening[dependency] = true;
        }
    }
}

var addBubbledEvent = function (topLevelType, type, element) {
    return addEventListener(element, type, function (nativeEvent) {
        topEventListener(nativeEvent, topLevelType)
    })
}
var addCapturedEvent = function (topLevelType, type, element) {
    return addEventListener(element, type, function (nativeEvent) {
        topEventListener(nativeEvent, topLevelType)
    }, true)
}

function addEventListener(target, eventType, callback, capture) {
        target.addEventListener(eventType, callback, !!capture)
        return {
            remove: function () {
                target.removeEventListener(eventType, callback, !!capture)
            }
        }
}
//顶层事件监听器

function topEventListener(nativeEvent, topLevelType) {
    var topLevelTarget = nativeEvent.target 
    var ancestors = []
    var ancestor = topLevelTarget
    while (ancestor && ancestor.nodeType) {
        ancestors.push(ancestor)
        ancestor = ancestor.parentNode
    }
    var uuids = []
    while (ancestor = ancestors.shift()) {
        uuids.push(getUid(ancestor))
    }
    //收集事件
    var events = EventPluginHub.extractEvents(topLevelType, topLevelTarget, nativeEvent, uuids)
    //执行所有回调
    events.forEach(executeDispatchesAndRelease)
}


function executeDispatchesAndRelease(event) {
    if (event) {
        var callback = executeDispatch;
        var PluginModule = getPluginByEventType(event.type);
        if (PluginModule && PluginModule.executeDispatch) {
            callback = PluginModule.executeDispatch;
        }
        var dispatchListeners = event._dispatchListeners
        var dispatchIDs = event._dispatchIDs
        // avalon.log("执行所有回调" + event.type)
        for (var i = 0; i < dispatchListeners.length; i++) {
            if (event.isPropagationStopped) {
                break
            }
            callback(event, dispatchListeners[i], dispatchIDs[i])
        }
        // eventFactory.release(event)
    }
}

//执行单个事件回调
function executeDispatch(event, fn, domID) {
    var elem = event.currentTarget = getNode(domID);
    if (typeof fn === "function") {
        var returnValue = fn.call(elem, event)
    } else if (fn.args) {
        var callback = fn.evaluator || noop
        returnValue = callback.apply(elem, fn.args.concat(event))
    }
    event.currentTarget = null;
    return returnValue;
}


//=================事件工厂===================
var eventFactory = (function () {
    var eventPool = []

    function eventFactory(nativeEvent, type) {
        var event = eventPool.shift()
        if (!event) {
            event = new SyntheticEvent()
        }
        event.timeStamp = new Date() - 0
        event.nativeEvent = nativeEvent
        event.type = type
        var target = nativeEvent.target || window
        if (target.nodeType === 3) {
            target = target.parentNode
        }
        event.target = target
        return event
    }
    eventFactory.release = function (event) {
        for (var i in event) {
            if (event.hasOwnProperty(i)) {
                event[i] = null
            }
        }
        if (eventPool.length < 20) {
            eventPool.push(event)
        }
    }

    function SyntheticEvent() {
    }
    var ep = SyntheticEvent.prototype
    //阻止默认行为
    ep.preventDefault = function () {
        if (this.nativeEvent) {
            this.nativeEvent.preventDefault();
        }
    }
    //阻止事件往上下传播
    ep.stopPropagation = function () {
        this.isPropagationStopped = true;
        if (this.nativeEvent) {
            this.nativeEvent.stopPropagation();
        }
    }

    //阻止事件往上下传播
    ep.stopImmediatePropagation = function () {
        //阻止事件在一个元素的同种事件的回调中传播
        this.isImmediatePropagationStopped = true
        this.stopPropagation()
    }
    return eventFactory
})()



//====================================================
var callbackPool = {};
var EventPluginHub = {
    //添加事件回调到 回调池 中
    addListener: function (id, type, callback) {
        var pool = callbackPool[type] || (callbackPool[type] = {});
        if (pool[id]) {
            pool[id].push(callback)
        } else {
            pool[id] = [callback]
        }
        var plugin = getPluginByEventType(type)
        if (plugin && plugin.didPutListener) {
            plugin.didPutListener(id, type, callback);
        }
    },
    getListener: function (id, eventType) {
        var pool = callbackPool[eventType]
        return pool && pool[id] || []
    },
    removeListener: function (id, type, fn) {
        var plugin = getPluginByEventType(type)
        if (plugin && plugin.willDeleteListener) {
            plugin.willDeleteListener(id, type);
        }
        var pool = callbackPool[type]
        if (pool) {
            if (fn) {
                avalon.Array.remove(pool[id], fn)
            } else {
                delete pool[id]
            }
        }
    },
    extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
        var events = []
        if (!topLevelTarget) {
            return events
        }
        var plugins = EventPluginRegistry.plugins;
        for (var i = 0; i < plugins.length; i++) {
            var possiblePlugin = plugins[i];
            if (possiblePlugin) {

                var extractedEvents = possiblePlugin.extractEvents(topLevelType, topLevelTarget, nativeEvent, uuids)
                if (extractedEvents) {
                    extractedEvents.plugn = possiblePlugin.name
                    events = events.concat(extractedEvents);
                }
            }
        }
        return events;
    }
}

function collectDispatches(event, uuids) {
    //收集事件回调
    var _dispatchListeners = []
    var _dispatchIDs = []
    for (var i = 0, n = uuids.length; i < n; i++) {
        var id = uuids[i]
        //从事件仓库中取得回调数组
        var listener = EventPluginHub.getListener(id, event.type)
        var node = getNode(id)
        //从元素上取得直接用onxxx绑定的回调
        var onFn = node && node["on" + event.type]
        if (typeof onFn === "function") {
            listener.push(onFn)
        }
        var jn = listener.length
        if (jn) {
            for (var j = 0; j < jn; j++) {
                _dispatchListeners.push(listener[j])
                _dispatchIDs.push(id)
            }
        }
    }
    event._dispatchListeners = _dispatchListeners
    event._dispatchIDs = _dispatchIDs
}

//--------------------------------
// SimpleEventPlugin
var SimpleEventPlugin = (function () {
    var EventTypes = {}
    var onClickListeners = {}
    String("click,contextmenu,doubleclick,keydown,keypress,keyup,focus,blur,copy,cut,paste," + //键盘点击
            "drag,dragend,dragenter,dragexit,dragleave,touchcancel,touchend,touchstart,touchmove," + //拖放触摸
            "mousedown,mousemove,mouseout,mouseover,mouseup," + //鼠标操作
            "change," + //来自ChangeEventPlugin插件
            "submit," + //来自SubmitEventPlugin插件
            "load,error,reset,scroll").toLowerCase().replace(rword, function (eventName) {
        EventTypes[eventName] = {
            dependencies: [eventName]
        }
    })
    var EventPlugin = {
        name: "SimpleEventPlugin",
        eventTypes: EventTypes,
        executeDispatch: function (event, listener, domID) {
            var returnValue = executeDispatch(event, listener, domID);
            if (returnValue === false) {
                event.stopPropagation()
                event.preventDefault()
            }
        },
        extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
            if (!EventTypes[topLevelType]) {
                return null;
            }
            var eventDecorator;
            switch (topLevelType) {
                case "load":
                case "error":
                case "reset":
                    eventDecorator = SyntheticHTMLEvent;
                    break;
                case "keypress":
                    // FireFox creates a keypress event for function keys too. This removes
                    // the unwanted keypress events. Enter is however both printable and
                    // non-printable. One would expect Tab to be as well (but it isn't).
                    if (getEventCharCode(nativeEvent) === 0) {
                        return null;
                    }

                case "keydown":
                case "keyup":
                    eventDecorator = SyntheticKeyboardEvent;
                    break;
                case "blur":
                case "focus":
                    eventDecorator = SyntheticFocusEvent;
                    break;
                case "click":
                    // Firefox creates a click event on right mouse clicks. This removes the
                    // unwanted click events.
                    if (nativeEvent.button === 2) {
                        return null;
                    }
                case "contextenu":
                case "doubleclick":
                case "mousedown":
                case "mousemove":
                case "mouseout":
                case "mouseover":
                case "mouseup":
                    eventDecorator = SyntheticMouseEvent;
                    break;
                case "drag":
                case "dragend":
                case "dragenter":
                case "dragexit":
                case "dragleave":
                case "dragover":
                case "dragstart":
                case "drop":
                    eventDecorator = SyntheticDragEvent;
                    break;
                case "touchcancel":
                case "touchend":
                case "touchmove":
                case "touchstart":
                    eventDecorator = SyntheticTouchEvent;
                    break;
                case "scroll":
                    eventDecorator = SyntheticUIEvent;
                    break;
                case "copy":
                case "cut":
                case "paste":
                    eventDecorator = SyntheticClipboardEvent;
                    break;
            }
            if (eventDecorator) {
                var event = eventFactory(nativeEvent, topLevelType)
                eventDecorator(event, nativeEvent)
                collectDispatches(event, uuids) //收集回调
                return event
            }
        },
        didPutListener: function (id, type) {
            // Mobile Safari does not fire properly bubble click events on
            // non-interactive elements, which means delegated click listeners do not
            // fire. The workaround for this bug involves attaching an empty click
            // listener on the target node.
            if (type === "click") {
                if (!onClickListeners[id]) {
                    onClickListeners[id] = addEventListener(getNode(id), 'click', noop);
                }
            }
        },
        willDeleteListener: function (id, type) {
            if (type === "click") {
                onClickListeners[id].remove();
                delete onClickListeners[id];
            }
        }
    }
// 各类型事件的装饰器
// http://www.w3.org/TR/html5/index.html#events-0

    function SyntheticHTMLEvent(event, nativeEvent) {
        var _interface = "eventPhase,cancelable,bubbles"
        _interface.replace(rword, function (name) {
            event[name] = nativeEvent[name]
        })
    }

    function SyntheticUIEvent(event, nativeEvent) {
        SyntheticHTMLEvent(event, nativeEvent)
        event.view = nativeEvent.view || window
        event.detail = nativeEvent.detail || 0
    }

    function SyntheticTouchEvent(event, nativeEvent) {
        SyntheticUIEvent(event, nativeEvent)
        var _interface = "touches,targetTouches,changedTouches,ctrlKey,shiftKey,metaKey,altKey"
        _interface.replace(rword, function (name) {
            event[name] = nativeEvent[name]
        })
    }

//http://www.w3.org/TR/DOM-Level-3-Events/

    function SyntheticFocusEvent(event, nativeEvent) {
        SyntheticUIEvent(event, nativeEvent)
        event.relatedTarget = nativeEvent.relatedTarget
    }


    function SyntheticClipboardEvent(event, nativeEvent) {
        SyntheticEvent(event, nativeEvent)
        event.clipboardData = 'clipboardData' in nativeEvent ? nativeEvent.clipboardData : window.clipboardData
    }


    function SyntheticKeyboardEvent(event, nativeEvent) {
        SyntheticUIEvent(event, nativeEvent)
        var _interface = "ctrlKey,shiftKey,metaKey,altKey,repeat,locale,location"
        _interface.replace(rword, function (name) {
            event[name] = nativeEvent[name]
        })
        if (event.type === 'keypress') {
            event.charCode = getEventCharCode(event)
            event.keyCode = 0
        } else if (event.type === 'keydown' || event.type === 'keyup') {
            event.charCode = 0
            event.keyCode = nativeEvent.keyCode
        }
        event.which = event.type === 'keypress' ? event.charCode : event.keyCode
    }

    function SyntheticMouseEvent(event, nativeEvent) {
        SyntheticUIEvent(event, nativeEvent)
        var _interface = "screenX,screenY,clientX,clientY,ctrlKey,shiftKey,altKey,metaKey"
        _interface.replace(rword, function (name) {
            event[name] = nativeEvent[name]
        })
        // Webkit, Firefox, IE9+
        // which:  1 2 3
        // button: 0 1 2 (standard)
        event.which = nativeEvent.button //判定是左、中、右键触发
    }

    function SyntheticDragEvent(event, nativeEvent) {
        SyntheticMouseEvent(event, nativeEvent)
        event.dataTransfer = nativeEvent.dataTransfer
    }
    return EventPlugin
})()
//https://github.com/jquery/jquery-mousewheel/blob/master/jquery.mousewheel.js
var WheelEventPlugin = (function () {
    var dependencies = ('onwheel' in document || document.documentMode >= 9) ? ['wheel'] :
            isEventSupported("mousewheel") ? ['mousewheel'] :
            ['DomMouseScroll', 'MozMousePixelScroll']

    function ajusetNumber(delta) {
        return delta === 0 ? 0 : delta > 0 ? 120 : -120
    }
    var EventPlugin = {
        name: "WheelEventPlugin",
        eventTypes: {
            mousewheel: {
                dependencies: dependencies
            },
            wheel: {
                dependencies: dependencies
            }
        },
        extractEvents: function (topLevelType, topLevelTarget, orgEvent, uuids) {
            if (dependencies.indexOf(topLevelType) === -1) {
                return
            }
            var delta = 0
            var deltaX = 0
            var deltaY = 0
            //从原始事件对象抽取有用信息
            if ('detail'      in orgEvent) {
                deltaY = orgEvent.detail * -1;
            }
            if ('wheelDelta'  in orgEvent) {
                deltaY = orgEvent.wheelDelta;
            }
            if ('wheelDeltaY' in orgEvent) {
                deltaY = orgEvent.wheelDeltaY;
            }
            if ('wheelDeltaX' in orgEvent) {
                deltaX = orgEvent.wheelDeltaX * -1;
            }

            // Firefox < 17 horizontal scrolling related to DOMMouseScroll event
            if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
                deltaX = deltaY * -1;
                deltaY = 0;
            }

            // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy
            delta = deltaY === 0 ? deltaX : deltaY;

            // 如果是wheel事件
            if ('deltaY' in orgEvent) {
                deltaY = orgEvent.deltaY * -1;
                delta = deltaY;
            }
            if ('deltaX' in orgEvent) {
                deltaX = orgEvent.deltaX;
                if (deltaY === 0) {
                    delta = deltaX * -1;
                }
            }
            // 如果没有移动过，就立即返回
            if (deltaY === 0 && deltaX === 0) {
                return;
            }

            var event = eventFactory(orgEvent, topLevelType)

            event.deltaX = ajusetNumber(deltaX)
            event.deltaY = ajusetNumber(deltaY)
            event.delta = ajusetNumber(delta)

            collectDispatches(event, uuids) //收集回调
            return event
        }
    }
    return EventPlugin
})()

var ResponderEventPlugin = {
    extractEvents: noop
}
var TapEventPlugin = (function () {
    function isEndish(topLevelType) {
        return topLevelType === "mouseup" ||
                topLevelType === "touchend" ||
                topLevelType === "touchcancel";
    }

    function isMoveish(topLevelType) {
        return topLevelType === "mousemove" ||
                topLevelType === "touchmove";
    }
    function isStartish(topLevelType) {
        return topLevelType === "mousedown" ||
                topLevelType === "touchstart";
    }
    var touchEvents = [
        "touchstart",
        "touchcanel",
        "touchend",
        "touchmove"
    ]
    /**
     * Number of pixels that are tolerated in between a `touchStart` and `touchEnd`
     * in order to still be considered a 'tap' event.
     */
    var tapMoveThreshold = 10;
    var startCoords = {x: null, y: null};
    var Axis = {
        x: {page: 'pageX', client: 'clientX', envScroll: 'scrollLeft'},
        y: {page: 'pageY', client: 'clientY', envScroll: 'scrollTop'}
    };
    var extractSingleTouch = function (nativeEvent) {
        var touches = nativeEvent.touches;
        var changedTouches = nativeEvent.changedTouches;
        var hasTouches = touches && touches.length > 0;
        var hasChangedTouches = changedTouches && changedTouches.length > 0;

        return !hasTouches && hasChangedTouches ? changedTouches[0] :
                hasTouches ? touches[0] :
                nativeEvent;
    }
    function getAxisCoordOfEvent(axis, nativeEvent) {
        var singleTouch = extractSingleTouch(nativeEvent);
        if (singleTouch) {
            return singleTouch[axis.page];
        }
        return axis.page in nativeEvent ?
                nativeEvent[axis.page] :
                nativeEvent[axis.client] + root[axis.envScroll];
    }

    function getDistance(coords, nativeEvent) {
        var pageX = getAxisCoordOfEvent(Axis.x, nativeEvent);
        var pageY = getAxisCoordOfEvent(Axis.y, nativeEvent);
        return Math.pow(
                Math.pow(pageX - coords.x, 2) + Math.pow(pageY - coords.y, 2),
                0.5
                );
    }
    var usedTouch = false;
    var usedTouchTime = 0;
    var TOUCH_DELAY = 1000;
    var EventPlugin = {
        name: "TapEventPlugin",
        tapMoveThreshold: tapMoveThreshold,
        eventTypes: {
            tap: {
                dependencies: touchEvents.concat("mousedown", "mouseup", "mouseup")
            }
        },
        extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
            if (!isStartish(topLevelType) && !isEndish(topLevelType)) {
                return null;
            }
            // on ios, there is a delay after touch event and synthetic
            // mouse events, so that user can perform double tap
            // solution: ignore mouse events following touchevent within small timeframe
            if (touchEvents.indexOf(topLevelType) !== -1) {
                usedTouch = true;
                usedTouchTime = new Date() - 0;
            } else {
                if (usedTouch && (new Date() - usedTouchTime < TOUCH_DELAY)) {
                    return null;
                }
            }
            var event = null;
            var distance = getDistance(startCoords, nativeEvent);
            if (isEndish(topLevelType) && distance < tapMoveThreshold) {
                event = eventFactory(nativeEvent, "tap")
            }
            if (isStartish(topLevelType)) {
                startCoords.x = getAxisCoordOfEvent(Axis.x, nativeEvent);
                startCoords.y = getAxisCoordOfEvent(Axis.y, nativeEvent);
            } else if (isEndish(topLevelType)) {
                startCoords.x = 0;
                startCoords.y = 0;
            }
            event && collectDispatches(event, uuids)

            return event;
        }
    }
    return EventPlugin
})()
var EnterLeaveEventPlugin = {
    name: "EnterLeaveEventPlugin",
    eventTypes: {
        mouseenter: {
            dependencies: [
                "mouseout",
                "mouseover"
            ]
        },
        mouseleave: {
            dependencies: [
                "mouseout",
                "mouseover"
            ]
        }
    },
    extractEvents: function (topLevelType, topLevelTarget, nativeEvent) {
        if (topLevelType === "mouseout" || topLevelType === "mouseover") {
            //https://developer.mozilla.org/en-US/docs/Web/Events/mouseout
            // W3C的mouseout, mouseover是使用relatedTarget代替IE下的fromElement,toElement
            var related = nativeEvent.relatedTarget
            if (!related || (related !== topLevelTarget && !avalon.contains(topLevelTarget, related))) {
                var type = topLevelType === "mouseout" ? "mouseleave" : "mouseenter"
                var id = getUid(topLevelTarget)
                var listener = EventPluginHub.getListener(id, type)
                if (listener && listener.length) {
                    var event = eventFactory(nativeEvent, type)
                    event._dispatchIDs = [id]
                    event._dispatchListeners = listener
                    return event
                }
            }
        }
    }
}

/**
 * Same as document.activeElement but wraps in a try-catch block. In IE it is
 * not safe to call document.activeElement if there is nothing focused.
 *
 * The activeElement will be null only if the document body is not yet defined.
 */
function getActiveElement() /*?DOMElement*/ {
    try {
        return document.activeElement || document.body;
    } catch (e) {
        return document.body;
    }
}

var SelectEventPlugin = (function () {
    var activeElement = null;
    var lastSelection = null;
    var mouseDown = false;
// Track whether a listener exists for this plugin. If none exist, we do
// not extract events.
    var hasListener = false;
    function getSelection(node) {
        if ('selectionStart' in node) {
            return {
                start: node.selectionStart,
                end: node.selectionEnd
            };
        } else if (window.getSelection) {
            var selection = window.getSelection();
            return {
                anchorNode: selection.anchorNode,
                anchorOffset: selection.anchorOffset,
                focusNode: selection.focusNode,
                focusOffset: selection.focusOffset
            };
        } //去掉IE6-8的逻辑
    }
    function shallowEqual(objA, objB) {
        if (objA === objB) {
            return true;
        }
        var key;
        // Test for A's keys different from B.
        for (key in objA) {
            if (objA.hasOwnProperty(key) &&
                    (!objB.hasOwnProperty(key) || objA[key] !== objB[key])) {
                return false;
            }
        }
        // Test for B's keys missing from A.
        for (key in objB) {
            if (objB.hasOwnProperty(key) && !objA.hasOwnProperty(key)) {
                return false;
            }
        }
        return true;
    }
    function selectEventFactory(nativeEvent, uuids) {
        // Ensure we have the right element, and that the user is not dragging a
        // selection (this matches native `select` event behavior). In HTML5, select
        // fires only on input and textarea thus if there's no focused element we
        // won't dispatch.
        if (mouseDown || activeElement == null || activeElement !== getActiveElement()) {
            return null;
        }

        // Only fire when selection has actually changed.
        var currentSelection = getSelection(activeElement);
        if (!lastSelection || !shallowEqual(lastSelection, currentSelection)) {
            lastSelection = currentSelection
            var event = eventFactory(nativeEvent, 'select')
            event.target = activeElement;
            collectDispatches(event, uuids)
            return event
        }
    }
    var EventPlugin = {
        name: "SelectEventPlugin",
        eventTypes: {
            select: {
                dependencies: [
                    "blur",
                    "contextmenu",
                    "focus",
                    "keydown",
                    "mousedown",
                    "mouseup",
                    "select"//W3C
                ]
            }
        },
        extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
            if (!hasListener) {
                return null;
            }
            switch (topLevelType) {
                // Track the input node that has focus.
                case "focus":
                    var canSelected = topLevelTarget.contentEditable === 'true' ||
                            isTextInputElement(topLevelTarget)
                    if (canSelected) {
                        activeElement = topLevelTarget
                        lastSelection = null
                    }
                    break;
                case "blur":
                    activeElement = null
                    lastSelection = null
                    break;
                    // Don't fire the event while the user is dragging. This matches the
                    // semantics of the native select event.
                case "mousedown":
                    mouseDown = true;
                    break;
                case "contextmenu":
                case "mouseup":
                    mouseDown = false
                    return selectEventFactory(nativeEvent, uuids)
                    // Chrome and IE fire non-standard event when selection is changed (and
                    // sometimes when it hasn't).
                    // Firefox doesn't support selectionchange, so check selection status
                    // after each key entry. The selection changes after keydown and before
                    // keyup, but we check on keydown as well in the case of holding down a
                    // key, when multiple keydown events are fired but only one keyup is.
                case "selectionchange":
                case "select":
                    return selectEventFactory(nativeEvent, uuids)
            }
        },
        didPutListener: function (id, type) {
            if (type === "select") {
                hasListener = true;
            }
        }
    }
    return EventPlugin
})()

var supportedInputTypes = {
    'color': true,
    'date': true,
    'datetime': true,
    'datetime-local': true,
    'email': true,
    'month': true,
    'number': true,
    'password': true,
    'range': true,
    'search': true,
    'tel': true,
    'text': true,
    'time': true,
    'url': true,
    'week': true
};
function isTextInputElement(elem) {
    return elem && ((elem.nodeName === 'INPUT' ? supportedInputTypes[elem.type] : elem.nodeName === 'TEXTAREA'));
}


var InputEventPlugin = (function () {
    var setters = {}
    var useTicker
        function newSetter(val) {
            setters[this.tagName].call(this, val)
            if (this.msInputHack && val !== this.oldValue) {
                fireDatasetChanged(this)
            }
        }

        function msInputHack() {
            if (this.parentNode) {
                if (this.oldValue !== this.value) {
                    fireDatasetChanged(this)
                }
            } else if (!this.msRetain) {
                this.msInputHack = null
                return false
            }
        }
   
    if (Object.getOwnPropertyDescriptor) {
        try {
            var aproto = HTMLInputElement.prototype
            Object.getOwnPropertyNames(aproto) //故意引发IE6-8等浏览器报错
            setters["INPUT"] = Object.getOwnPropertyDescriptor(aproto, "value").set
            Object.defineProperty(aproto, "value", {
                set: newSetter
            })
            var bproto = HTMLTextAreaElement.prototype
            setters["TEXTAREA"] = Object.getOwnPropertyDescriptor(bproto, "value").set
            Object.defineProperty(bproto, "value", {
                set: newSetter
            })
        } catch (e) {
            avalon.log(e)
            useTicker = true
        }
    }
    var activeElement

    function fireDatasetChanged(elem) {
        if (elem.oldValue === elem.value)
            return
            var hackEvent = DOC.createEvent("Events");
            hackEvent.initEvent("datasetchanged", true, true, {})
            hackEvent.isInputEvent = true
            elem.dispatchEvent(hackEvent)
    }
    var composing = false
    var EventPlugin = {
        name: "InputEventPlugin",
        eventTypes: {
            input: {
                dependencies: [
                    "compositionstart",
                    "compositionend",
                    "input",
                    "DOMAutoComplete",
                    "datasetchanged"
                ]
            }
        },
        extractEvents: function(topLevelType, topLevelTarget, nativeEvent, uuids) {
            if (isTextInputElement(topLevelTarget)) {
                var isValueChange = false
                activeElement = topLevelTarget
                switch (topLevelType) {
                    case "compositionstart":
                        composing = false
                        break
                    case "compositionend":
                        composing = true
                        break
                    case "input":
                    case "DOMAutoComplete":
                        if (!composing) {
                            isValueChange = topLevelTarget.oldValue !== topLevelTarget.value
                        }
                        break
                    case "datasetchanged":
                        isValueChange = nativeEvent.isInputEvent
                        break
                }
                if (isValueChange) {
                    var event = eventFactory(nativeEvent, "input")
                    collectDispatches(event, uuids)
                    topLevelTarget.oldValue = topLevelTarget.value
                    return event
                }
            }
        },
        didPutListener: function(id) {
            var element = getNode(id)
            if (isTextInputElement(element)) {
                if (useTicker) {
                    element.oldValue = element.value
                    element.msInputHack = msInputHack
                    avalon.tick(element.msInputHack)
                } else {//IE9+ chrome43+ firefox30+
        // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
        // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
                    element.msInputHack = true
                    avalon.log("使用Object.defineProperty重写element.value")
                }
            }
        },
        willDeleteListener: function(id, type, fn) {
            var pool = callbackPool[type]
            var arr = pool && pool[id]
            if (!fn || !arr || (arr.length === 1 && pool[0] === fn)) {
                var element = getNode(id) || {}
                if (element.msInputHack === true) {
                    delete element.msInputHack
                } else if (element.msInputHack === msInputHack) {
                    avalon.Array.remove(ribbon, msInputHack)
                    element.msInputHack = void 0
                }
            }
        }
    }

    return EventPlugin
})()
var AnalyticsEventPlugin = ResponderEventPlugin

var EventPluginRegistry = {
    registrationNameModules: {},
    plugins: [
        ResponderEventPlugin,
        SimpleEventPlugin,
        SubmitEventPlugin,
        WheelEventPlugin,
        TapEventPlugin,
        EnterLeaveEventPlugin,
        SelectEventPlugin,
        InputEventPlugin,
        AnalyticsEventPlugin
    ]
}

var getPluginByEventType = (function () {
    var type2plugin = {}
    for (var i = 0, plugin; plugin = EventPluginRegistry.plugins[i++]; ) {
        for (var e in plugin.eventTypes) {
            type2plugin[e] = plugin
        }
    }
    avalon.log(type2plugin)
    return function (type) {
        return type2plugin[type]
    }
})()

