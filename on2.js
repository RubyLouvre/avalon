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

bindingExecutors.on = function (callback, elem, data) {
    var eventType = data.param.replace(/-\d+$/, "")
    var uuid = getUid(elem)
    listenTo(eventType, document)
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
                if (DOC.onwheel !== void 0) {
                    trapBubbledEvent("wheel", 'wheel', mountAt) //IE9+
                } else if (DOC.mousewheel !== void 0) {
                    trapBubbledEvent("wheel", 'mousewheel', mountAt)
                } else {
                    trapBubbledEvent("wheel", 'DOMMouseScroll', mountAt) //firefox
                }
            } else if (dependency === "scroll") {
                if (DOC.addEventListener) {
                    trapCapturedEvent("scroll", 'scroll', mountAt)
                } else {
                    trapBubbledEvent("scroll", 'scroll', window)
                }
            } else if (dependency === "focus" || dependency === "blur") {
                if (isEventSupported('focus', true)) {
                    trapCapturedEvent("focus", 'focus', mountAt);
                    trapCapturedEvent("blur", 'blur', mountAt);
                } else if (DOC.onfocusin !== void 0) {
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
        dispatchEvent(nativeEvent, topLevelType)
    })
}
var trapCapturedEvent = function (topLevelType, handlerBaseName, element) {
    return addEventListener(element, handlerBaseName, function (nativeEvent) {
        dispatchEvent(nativeEvent, topLevelType)
    }, true)
}

function addEventListener(target, eventType, callback, capture) {
    if (target.addEventListener) {
        target.addEventListener(eventType, callback, !!capture);
    } else if (target.attachEvent) {
        target.attachEvent('on' + eventType, callback)
    }
}

function dispatchEvent(nativeEvent, topLevelType) {
    var bookKeeping = eventFactory(nativeEvent, topLevelType)
    try {
        handleTopLevelImpl(bookKeeping);
    } finally {
        eventFactory.release(bookKeeping);
    }
}

function handleTopLevelImpl(bookKeeping) {
    var topLevelTarget = bookKeeping.nativeEvent.target
    var ancestors = []

    var ancestor = topLevelTarget;
    while (ancestor && ancestor.nodeType === 1) {
        ancestors.push(ancestor);
        ancestor = ancestor.parentNode
    }
    for (var i = 0, l = ancestors.length; i < l; i++) {
        topLevelTarget = ancestors[i];
        var topLevelTargetID = getUid(topLevelTarget) || '';
        handleTopLevel(bookKeeping.type, topLevelTarget, topLevelTargetID, bookKeeping.nativeEvent);
    }
}
var handleTopLevel = function (topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
    var events = EventPluginHub.extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent);
    runEventQueueInBatch(events);
}
//--------------------------------
// SimpleEventPlugin
var eventTypes = {}
String("blur,click,contextMenu,copy,cut,doubleClick,drag,dragEnd,dragEnter,dragExit,dragLeave" +
        "dragOver,dragStart,drop,focus,input,keyDown,keyPress,keyUp,load,error,mouseDown" +
        "mouseMove,mouseOut,mouseOver,mouseUp,paste,reset,scroll,submit,touchCancel" +
        "touchCancel,touchEnd,touchStart,wheel").replace(rword, function (eventName) {
    eventTypes[eventName] = {
        name: eventName.toLowerCase(),
        dependencies: [eventName]
    }
})


var SimpleEventPlugin = {
    pluginName: "SimpleEventPlugin",
    eventTypes: eventTypes,
    executeDispatch: function (event, listener, domID) {
        var returnValue = EventPluginUtils.executeDispatch(event, listener, domID);
        if (returnValue === false) {
            event.stopPropagation();
            event.preventDefault();
        }
    },
    extractEvents: function (topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
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
                // HTML Events
                // @see http://www.w3.org/TR/html5/index.html#events-0
                EventConstructor = SyntheticEvent;
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
                /* falls through */
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
        var event = eventFactory(nativeEvent, topLevelType, topLevelTargetID)
        EventConstructor(event, nativeEvent)
        EventPropagators.accumulateTwoPhaseDispatches(event) //收集回调
        return event;
    },
    didPutListener: function (id, registrationName, listener) {
        // Mobile Safari does not fire properly bubble click events on
        // non-interactive elements, which means delegated click listeners do not
        // fire. The workaround for this bug involves attaching an empty click
        // listener on the target node.
        if (registrationName === ON_CLICK_KEY) {
            var node = ReactMount.getNode(id);
            if (!onClickListeners[id]) {
                onClickListeners[id] = EventListener.listen(
                        node,
                        'click',
                        emptyFunction
                        );
            }
        }
    },
    willDeleteListener: function (id, registrationName) {
        if (registrationName === ON_CLICK_KEY) {
            onClickListeners[id].remove();
            delete onClickListeners[id];
        }
    }
}

function SyntheticEvent(event, nativeEvent) {
    var _interface = "eventPhase,cancelable,bubbles"
    _interface.replace(rword, function (name) {
        event[name] = nativeEvent[name]
    })
}

function SyntheticUIEvent(event, nativeEvent) {
    SyntheticEvent(event, nativeEvent)
    event.view = nativeEvent.view || window
    event.detail = nativeEvent.detail || 0;
}

function SyntheticTouchEvent(event, nativeEvent) {
    SyntheticUIEvent(event, nativeEvent)
    var _interface = "touches,targetTouches,changedTouches,ctrlKey,shiftKey,metaKey,altKey"
    _interface.replace(rword, function (name) {
        event[name] = nativeEvent[name]
    })
}
function SyntheticInputEvent(event, nativeEvent) {
    SyntheticEvent(event, nativeEvent)
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
var listenerBank = {};
var EventPluginHub = {
    putListener: function (id, registrationName, listener) {
        var bankForRegistrationName =
                listenerBank[registrationName] || (listenerBank[registrationName] = {});
        bankForRegistrationName[id] = listener;

        var PluginModule = EventPluginRegistry.registrationNameModules[registrationName];
        if (PluginModule && PluginModule.didPutListener) {
            PluginModule.didPutListener(id, registrationName, listener);
        }
    },
    getListener: function (id, registrationName) {
        var bankForRegistrationName = listenerBank[registrationName];
        return bankForRegistrationName && bankForRegistrationName[id];
    },
    deleteListener: function (id, registrationName) {
        var PluginModule = EventPluginRegistry.registrationNameModules[registrationName];
        if (PluginModule && PluginModule.willDeleteListener) {
            PluginModule.willDeleteListener(id, registrationName);
        }

        var bankForRegistrationName = listenerBank[registrationName];
        // TODO: This should never be null -- when is it?
        if (bankForRegistrationName) {
            delete bankForRegistrationName[id];
        }
    },
    deleteAllListeners: function (id) {
        for (var registrationName in listenerBank) {
            if (!listenerBank[registrationName][id]) {
                continue;
            }

            var PluginModule =
                    EventPluginRegistry.registrationNameModules[registrationName];
            if (PluginModule && PluginModule.willDeleteListener) {
                PluginModule.willDeleteListener(id, registrationName);
            }

            delete listenerBank[registrationName][id];
        }
    }, extractEvents: function (topLevelType, topLevelTarget, topLevelTargetID, nativeEvent) {
        var events = []
        var plugins = EventPluginRegistry.plugins;
        for (var i = 0; i < plugins.length; i++) {
            // Not every plugin in the ordering may be loaded at runtime.
            var possiblePlugin = plugins[i];
            if (possiblePlugin) {
                var extractedEvents = possiblePlugin.extractEvents(topLevelType, topLevelTarget, topLevelTargetID, nativeEvent);
                if (extractedEvents) {
                    events = events.concat(extractedEvents);
                }
            }
        }
        return events;
    },
    /**
     * Enqueues a synthetic event that should be dispatched when
     * `processEventQueue` is invoked.
     *
     * @param {*} events An accumulation of synthetic events.
     * @internal
     */
    enqueueEvents: function (events) {
        if (events) {
            eventQueue = accumulateInto(eventQueue, events);
        }
    },
    /**
     * Dispatches all synthetic events on the event queue.
     *
     * @internal
     */
    processEventQueue: function () {
        // Set `eventQueue` to null before processing it so that we can tell if more
        // events get enqueued while processing.
        var processingEventQueue = eventQueue;
        eventQueue = null;
        forEachAccumulated(processingEventQueue, executeDispatchesAndRelease);
    },
    /**
     * These are needed for tests only. Do not use!      */
    __purge: function () {
        listenerBank = {};
    },
    __getListenerBank: function () {
        return listenerBank;
    }

};
var ResponderEventPlugin = {},
        TapEventPlugin = {},
        EnterLeaveEventPlugin = {},
        ChangeEventPlugin = {},
        SelectEventPlugin = {},
        BeforeInputEventPlugin = {},
        AnalyticsEventPlugin = {}

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


var type2plugin = {}
for (var i in EventPluginRegistry.plugins) {
    var plugin = EventPluginRegistry.plugins[i]
    for (var e in plugin.eventTypes) {
        type2plugin[e] = plugin
    }
}

function getPluginByEventType(type) {
    return type2plugin[type]
}





