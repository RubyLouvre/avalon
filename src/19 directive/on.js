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
    var uuid = getUid(elem)
    try {
        listenTo(eventType, document)
    } catch (e) {
        console.log(e)
        console.log(eventType)
    }
    EventPluginHub.putListener(uuid, eventType, data)
    data.rollback = function () {
        EventPluginHub.deleteListener(uuid, eventType, data)
    }
}

var isListening = {}

function listenTo(eventType, mountAt) {
    //通过事件名得到对应的插件
    var plugin = getPluginByEventType(eventType)
    //得到对应的依赖
    var dependencies = plugin.eventTypes[eventType].dependencies
    //IE6-8下`keyup`/`keypress`/`keydown` 只能冒泡到 document
    for (var i = 0; i < dependencies.length; i++) {
        var dependency = dependencies[i];
        if (isListening[dependency] !== true) {
            if (dependency === "wheel") {
                if (isEventSupported("wheel")) {
                    trapBubbledEvent("wheel", 'wheel', mountAt) //IE9+
                } else if (isEventSupported("mousewheel")) {
                    trapBubbledEvent("wheel", 'mousewheel', mountAt)
                } else {
                    trapBubbledEvent("wheel", 'DOMMouseScroll', mountAt) //firefox
                }
            } else if (dependency === "scroll") {
                if (W3C) {
                    trapCapturedEvent("scroll", 'scroll', mountAt)
                } else {
                    trapBubbledEvent("scroll", 'scroll', window)
                }
            } else if (dependency === "focus" || dependency === "blur") {
                if (W3C) {
                    trapCapturedEvent("focus", 'focus', mountAt);
                    trapCapturedEvent("blur", 'blur', mountAt);
                } else if (isEventSupported("focusin")) {
                    trapBubbledEvent("focus", 'focusin', mountAt);
                    trapBubbledEvent("blur", 'focusout', mountAt);
                }
                isListening.focus = true
                isListening.blur = true
            } else {
                trapBubbledEvent(dependency, dependency, mountAt);
            }
            isListening[dependency] = true;
        }
    }
}

var trapBubbledEvent = function (topLevelType, handlerBaseName, element) {
    return addEventListener(element, handlerBaseName, function (nativeEvent) {
        topEventDispatch(nativeEvent, topLevelType)
    })
}
var trapCapturedEvent = function (topLevelType, handlerBaseName, element) {
    return addEventListener(element, handlerBaseName, function (nativeEvent) {
        topEventDispatch(nativeEvent, topLevelType)
    }, true)
}

function addEventListener(target, eventType, callback, capture) {
    if (target.addEventListener) {
        target.addEventListener(eventType, callback, !!capture)
        return {
            remove: function () {
                target.removeEventListener(eventType, callback, !!capture)
            }
        }
    } else if (target.attachEvent) {
        target.attachEvent('on' + eventType, callback)
        return {
            remove: function () {
                target.detachEvent('on' + eventType, callback)
            }
        }
    }
}
//顶层事件监听器

function topEventDispatch(nativeEvent, topLevelType) {
    var topLevelTarget = nativeEvent.target || nativeEvent.srcElement
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
        eventFactory.release(event)
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
        var target = nativeEvent.target || nativeEvent.srcElement || window
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
        if (this.nativeEvent.preventDefault) {
            this.nativeEvent.preventDefault();
        } else {
            this.nativeEvent.returnValue = false;
        }
    }
    //阻止事件往上下传播
    ep.stopPropagation = function () {
        this.isPropagationStopped = true;
        if (this.nativeEvent.stopPropagation) {
            this.nativeEvent.stopPropagation();
        }
        this.nativeEvent.cancelBubble = true;
    }

    //阻止事件往上下传播
    ep.stopImmediatePropagation = function () {
        //阻止事件在一个元素的同种事件的回调中传播
        this.isImmediatePropagationStopped = true
        this.stopPropagation()
    }
    return eventFactory
})()

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

function SyntheticInputEvent(event, nativeEvent) {
    SyntheticHTMLEvent(event, nativeEvent)
    event.data = nativeEvent.data
}
//http://www.w3.org/TR/DOM-Level-3-Events/

function SyntheticFocusEvent(event, nativeEvent) {
    SyntheticUIEvent(event, nativeEvent)
    event.relatedTarget = nativeEvent.relatedTarget
}
//https://developer.mozilla.org/en-US/docs/Web/Events/wheel

function SyntheticWheelEvent(event, nativeEvent) {
    SyntheticMouseEvent(event, nativeEvent)
    var fixWheelType = DOC.onwheel !== void 0 ? "wheel" : "DOMMouseScroll"
    var fixWheelDelta = fixWheelType === "wheel" ? "deltaY" : "detail"
    event.deltaY = event.delta = nativeEvent[fixWheelDelta] > 0 ? -120 : 120
    event.deltaX = event.deltaZ = 0
}

function SyntheticClipboardEvent(event, nativeEvent) {
    SyntheticEvent(event, nativeEvent)
    event.clipboardData = 'clipboardData' in nativeEvent ? nativeEvent.clipboardData : window.clipboardData
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
    var button = nativeEvent.button;
    if ('which' in nativeEvent) {
        event.which = button
    } else {
        // IE<9
        // which:  undefined
        // button: 0 0 0
        // button: 1 4 2 (onmouseup)
        event.which = button === 2 ? 2 : button === 4 ? 1 : 0;
    }
    if (!isFinite(event.pageX)) {
        var target = event.target
        var doc = target.ownerDocument || DOC
        var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
        event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
    }
}

function SyntheticDragEvent(event, nativeEvent) {
    SyntheticMouseEvent(event, nativeEvent)
    event.dataTransfer = nativeEvent.dataTransfer
}

//====================================================
var callbackPool = {};
var EventPluginHub = {
    //添加事件回调到 回调池 中
    putListener: function (id, type, callback) {
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
        return pool && pool[id];
    },
    deleteListener: function (id, type, fn) {
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
        var plugins = EventPluginRegistry.plugins;
        for (var i = 0; i < plugins.length; i++) {
            var possiblePlugin = plugins[i];
            if (possiblePlugin) {
                var extractedEvents = possiblePlugin.extractEvents(topLevelType, topLevelTarget, nativeEvent, uuids)
                if (extractedEvents) {
                    events = events.concat(extractedEvents);
                }
            }
        }
        return events;
    }
}



//--------------------------------
// SimpleEventPlugin
var SimpleEventTypes = {}
String("blur,click,contextMenu,copy,cut,doubleClick,drag,dragEnd,dragEnter,dragExit,dragLeave" +
        "dragOver,dragStart,drop,focus,input,keyDown,keyPress,keyUp,load,error,mouseDown" +
        "mouseMove,mouseOut,mouseOver,mouseUp,paste,reset,scroll,submit,touchCancel" +
        "touchCancel,touchEnd,touchStart,wheel").toLowerCase().replace(rword, function (eventName) {
    SimpleEventTypes[eventName] = {
        name: eventName,
        dependencies: [eventName]
    }
})


var SimpleEventPlugin = {
    eventTypes: SimpleEventTypes,
    executeDispatch: function (event, listener, domID) {
        var returnValue = executeDispatch(event, listener, domID);
        if (returnValue === false) {
            event.stopPropagation()
            event.preventDefault()
        }
    },
    extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
        if (!SimpleEventPlugin.eventTypes[topLevelType]) {
            return null;
        }
        var EventConstructor;
        switch (topLevelType) {
            case "input":
            case "load":
            case "error":
            case "reset":
            case "submit":
                EventConstructor = SyntheticHTMLEvent;
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
                EventConstructor = SyntheticKeyboardEvent;
                break;
            case "blur":
            case "focus":
                EventConstructor = SyntheticFocusEvent;
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
                EventConstructor = SyntheticMouseEvent;
                break;
            case "drag":
            case "dragend":
            case "dragenter":
            case "dragexit":
            case "dragleave":
            case "dragover":
            case "dragstart":
            case "drop":
                EventConstructor = SyntheticDragEvent;
                break;
            case "touchcancel":
            case "touchend":
            case "touchmove":
            case "touchstart":
                EventConstructor = SyntheticTouchEvent;
                break;
            case "scroll":
                EventConstructor = SyntheticUIEvent;
                break;
            case "wheel":
                EventConstructor = SyntheticWheelEvent;
                break;
            case "copy":
            case "cut":
            case "paste":
                EventConstructor = SyntheticClipboardEvent;
                break;
        }
        var event = eventFactory(nativeEvent, topLevelType)
        EventConstructor(event, nativeEvent)
        collectDispatches(event, uuids) //收集回调
        return event;
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
var onClickListeners = {}

function collectDispatches(event, uuids) {
    //收集事件回调
    var _dispatchListeners = []
    var _dispatchIDs = []
    for (var i = 0, n = uuids.length; i < n; i++) {
        var listener = EventPluginHub.getListener(uuids[i], event.type)
        if (listener) {
            _dispatchListeners = _dispatchListeners.concat(listener)
            _dispatchIDs.push(uuids[i])
        }
    }
    event._dispatchListeners = _dispatchListeners
    event._dispatchIDs = _dispatchIDs
}

var ResponderEventPlugin = {
    extractEvents: noop
}
var TapEventPlugin = ResponderEventPlugin
var EnterLeaveEventPlugin = {
    eventTypes: {
        mouseenter: {
            name: "mouseenter",
            dependencies: [
                "mouseout",
                "mouseover"
            ]
        },
        mouseleave: {
            name: "mouseleave",
            dependencies: [
                "mouseout",
                "mouseover"
            ]
        }
    },
    extractEvents: function (topLevelType, topLevelTarget, nativeEvent) {
        if (topLevelType === "mouseout" || topLevelType === "mouseover") {

            var related = nativeEvent.relatedTarget || (topLevelType === "mouseover" ?
                    nativeEvent.fromElement : nativeEvent.toElement)

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

//=====================

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

var ChangeEventPlugin = (function () {
    var supportChangeEventBubble = !('documentMode' in document) || document.documentMode > 8
    var supportInputEvent = isEventSupported("input", true)
    var IEInputChangeEvents = {
        "selectchange": true,
        "keyup": true,
        "keydown": true
    }
    var activeElement

    var IESelectFileChange = false

    function startWatchingForChangeEventIE(target) {
        activeElement = target
        IESelectFileChange = false
        activeElement.attachEvent('onchange', isChange);
    }

    function stopWatchingForChangeEventIE() {
        if (!activeElement) {
            return;
        }
        activeElement.detachEvent('onchange', isChange)
        IESelectFileChange = false
    }

    function isChange() {
        IESelectFileChange = true
    }


    var EventPlugin = {
        eventTypes: {
            change: {
                name: "change",
                dependencies: [
                    "blur",
                    "change",
                    "click",
                    "focus",
                    "keydown"
//                    "keyup",
//                    "selectionchange"
                ]
            }
        },
        extractEvents: function (topLevelType, topLevelTarget, nativeEvent, uuids) {
            var elementType = topLevelTarget ? topLevelTarget.nodeName.toLowerCase() : ""
            if (elementType === "select" || elementType === "textarea" || elementType === "input") {
                if (elementType === "input") {
                    elementType = topLevelTarget.type
                }
                var isChange = false
                switch (elementType) {
                    case "button":
                    case "submit":
                    case "reset":
                        return
                    case "select":
                    case "file":
                        if (supportChangeEventBubble) { //如果支持change事件冒泡
                            isChange = topLevelType === "change"

                        } else {
                            // 这里的事件依次是 focus change click blur
                            if (topLevelType === "focus") {
                                stopWatchingForChangeEventIE()
                                startWatchingForChangeEventIE(topLevelTarget);
                            } else if (topLevelType === "blur") {
                                stopWatchingForChangeEventIE();
                            }
                        }
                        break
                    case "radio":
                    case "checkbox":
                             if (topLevelType === "focus" ) {
                                topLevelTarget._oldChecked = topLevelTarget.checked
                            } else if (topLevelType === "click") {
                                if (topLevelTarget._oldChecked !== topLevelTarget.checked) {
                                    topLevelTarget._oldChecked = topLevelTarget.checked
                                    isChange = true
                                }
                            }
                        break
                    default:
                        if (supportChangeEventBubble) { //如果支持change事件冒泡
                            isChange = topLevelType === "change"
                        } else {
                            if (topLevelType === "focus" ) {
                                topLevelTarget._oldValue = topLevelTarget.value
                            } else if (topLevelType === "blur") {
                                if (topLevelTarget._oldValue !== topLevelTarget.value) {
                                    topLevelTarget._oldValue = topLevelTarget.value
                                    isChange = true
                                }
                            }
                        }
                        break
                }
                if (IESelectFileChange && topLevelType === "click") {
                    IESelectFileChange = false
                    isChange = true
                }
                if (isChange) {
                    var event = eventFactory(nativeEvent, "change")
                    collectDispatches(event, uuids)
                    return event
                }
            }
        }
    }
    return EventPlugin
})()






// For IE8 and IE9.

function getTargetIDForInputEventIE(topLevelType) {
    if (topLevelType === "selectchange" ||
            topLevelType === "keyup" ||
            topLevelType === "keydown") {

        if (activeElement && activeElement.value !== activeElementValue) {
            activeElementValue = activeElement.value;
            return activeElementID;
        }
    }
}

var SelectEventPlugin = ResponderEventPlugin
var BeforeInputEventPlugin = ResponderEventPlugin
var AnalyticsEventPlugin = ResponderEventPlugin

var EventPluginRegistry = {
    registrationNameModules: {},
    plugins: [
        ResponderEventPlugin,
        SimpleEventPlugin,
        TapEventPlugin,
        EnterLeaveEventPlugin,
        ChangeEventPlugin,
        SelectEventPlugin,
        BeforeInputEventPlugin,
        AnalyticsEventPlugin
    ]
}

var DefaultEventPluginOrder = [
    "ResponderEventPlugin", "SimpleEventPlugin", "TapEventPlugin", "EnterLeaveEventPlugin",
    "ChangeEventPlugin", "SelectEventPlugin", "BeforeInputEventPlugin", "AnalyticsEventPlugin"
]
var getPluginByEventType = (function () {
    var type2plugin = {}
    for (var i = 0, plugin; plugin = EventPluginRegistry.plugins[i++]; ) {
        for (var e in plugin.eventTypes) {
            type2plugin[e] = plugin
        }
    }
    return function (type) {
        return type2plugin[type]
    }
})()