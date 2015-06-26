var rdash = /\(([^)]*)\)/
bindingHandlers.on = function (data, vmodels) {
    var value = data.value
    data.type = "on"
//    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
//    if (typeof bindingHandlers.on[eventType + "Hook"] === "function") {
//        bindingHandlers.on[eventType + "Hook"](data)
//    }
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
    if (!isListening[eventType]) {
        if (eventType === "change") {
            avalon.bind(DOC, "focus", createTopCallback, true)
            avalon.bind(DOC, "blur", createTopCallback, true)
            avalon.bind(DOC, "change", createTopCallback, true)
            isListening.focus = true
            isListening.blur = true
        } else if (eventType === "focus" || eventType === "blur") {
            avalon.bind(DOC, "focus", createTopCallback, true)
            avalon.bind(DOC, "blur", createTopCallback, true)
            isListening.focus = true
            isListening.blur = true
        } else {
            avalon.bind(DOC, eventType, createTopCallback)
        }
        isListening[eventType] = true
    }
    var uuid = getUid(elem)
    var obj = bankForEvent[uuid] || (bankForEvent[uuid] = {})
    var events = obj[eventType] || (obj[eventType] = [])
    events.push(data)
    data.rollback = function () {
        var obj = bankForEvent[uuid]
        for (var a  in obj) {
            if (Array.isArray(obj[a])) {
                obj[a].length = 0
            }
        }
        delete bankForEvent[uuid]
    }
}

var bankForEvent = {}
var isListening = {}
function createTopCallback(event) {
    // console.log("createTopCallback" + event.type)
    for (var cur = event.target; cur && cur.nodeType && !event.isPropagationStopped; cur = cur.parentNode) {
        if (cur.disabled === true && event.type === "click") {
            break
        }
        var datas = getEventHandlers(cur, event.type)
        event.currentTarget = cur
        if (datas.length) {
            for (var k = 0, data; !event.isImmediatePropagationStopped && (data = datas[k++]); ) {
                var fn = data.evaluator
                if (fn) {
                    var ret = fn.apply(cur, data.args.concat(event))
                    if (ret === false) {
                        event.preventDefault()
                        event.stopPropagation()
                    }
                }
            }
        }
    }
}
//得到所有要处理的事件回调
function getEventHandlers(elem, eventType) {
    var uuid = getUid(elem)
    var obj = bankForEvent[uuid]
    return obj && obj[eventType] || []
}
var eventPool = []
function fixEvent(nativeEvent, type) {
    var event = eventPool.shift()
    if (!event) {
        event = new SyntheticEvent()
    }
    event.init(nativeEvent, type)
    for (var i = 0, h; h = avalon.eventHooks[i++]; ) {
        if (h.match(type) && h.fix) {
            h.fix(event, nativeEvent)
        }
    }
    return event
}

function SyntheticEvent() {
}
var ep = SyntheticEvent.prototype
ep.init = function (original, type) {
    var ret = this
    String("altKey bubbles cancelable ctrlKey currentTarget detail eventPhase " +
            "metaKey relatedTarget shiftKey target timeStamp which").replace(rword, function (prop) {
        ret[prop] = original[prop]
    })
    this.timeStamp = new Date() - 0
    this.nativeEvent = original
    this.type = type
    if (!this.target) {
        this.target = original.srcElement || window
    }
    if (this.target.nodeType === 3) {
        this.target = this.target.parentNode
    }
}
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
ep.dispose = function () {
    for (var i in this) {
        if (this.hasOwnProperty(i)) {
            this[i] = null
        }
    }
    if (eventPool.length < 20) {
        eventPool.push(this)
    }
}
//阻止事件往上下传播
ep.stopImmediatePropagation = function () {
    //阻止事件在一个元素的同种事件的回调中传播
    this.isImmediatePropagationStopped = true
    this.stopPropagation()
}
var eventHooks = avalon.eventHooks //EventPluginHub
var normalizeEvent = true
var normalizeEventPlugin = {
    match: function () {
        return normalizeEvent
    },
    on: function (data) {
        var oldFn = data.fn
        data.fn = function (e) {
            var event = fixEvent(e, data.origType)
            try {
                return oldFn.call(data.el, event)
            } finally {
                event.dispose()
            }
        }
    }
}

var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
var mouseEventPlugin = {
    match: function (type) {
        return rmouseEvent.test(type)
    },
    fix: function (event, original) {
        String("button buttons clientX clientY offsetX offsetY pageX pageY " +
                "screenX screenY toElement").replace(rword, function (prop) {
            event[prop] = original[prop]
        })
        if (!isFinite(event.pageX)) {
            var target = event.target
            var doc = target.ownerDocument || DOC
            var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
            event.pageX = original.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
            event.pageY = original.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        }
        var button = original.button;
        //  1 === left; 2 === middle; 3 === right
        if (!event.which && button !== undefined) {
            event.which = (button & 1 ? 1 : (button & 2 ? 3 : (button & 4 ? 2 : 0)));
        }
    }
}

var keyboardEventPlugin = {
    match: function (type) {
        return type.indexOf("key") === 0
    },
    fix: function (event, original) {
        if (!isFinite(event.which)) {
            event.which = original.charCode != null ? original.charCode : original.keyCode
        }
    }
}

eventHooks.push(normalizeEventPlugin, mouseEventPlugin, keyboardEventPlugin)
//针对firefox, chrome修正mouseenter, mouseleave
if (!("onmouseenter" in root)) {
    //EnterLeaveEventPlugin
    eventHooks.push({
        match: function (type) {
            return type === "mouseenter" || type === "mouseleave"
        },
        on: function (data) {
            data.type = data.type === "mouseenter" ? "mouseover" : "mouseout"
            var oldFn = data.fn
            data.fn = function (e) {
                var event = e.nativeEvent
                var t = event.relatedTarget
                if (!t || (t !== data.el && !(data.el.compareDocumentPosition(t) & 16))) {
                    return oldFn(e)
                }
            }
        },
        off: function (data) {
            data.type = data.type === "mouseenter" ? "mouseover" : "mouseout"
        }
    })
}

//if (!root.addEventListener) {//IE6-8下不支持focus,blur事件冒泡
eventHooks.push({
    match: function (type) {
        return type === "focus" || type === "blur"
    },
    on: function (data) {
        if (data.phase && !root.addEventListener) {
            data.type = data.type === "focus" ? "focusin" : "focusout"
        }
    },
    off: function (data) {
        if (data.phase && !root.addEventListener) {
            data.type = data.type === "focus" ? "focusin" : "focusout"
        }
    },
    fix: function(event, original){
        
    }
})
eventHooks.push({
    match: function (type) {
        return type === "change" //依赖于focus
    },
    on: function (data) {
        if (data.phase) {
            //  data.type = data.type === "focus" ? "focusin" : "focusout"
        }
    },
    off: function (data) {
        if (data.phase) {
            //  data.type = data.type === "focus" ? "focusin" : "focusout"
        }
    }
})
//}
//针对IE9+, w3c修正animationend
if (!window.AnimationEvent && window.WebKitAnimationEvent) {
    eventHooks.push({
        match: function (type) {
            return type === "animationend"
        },
        on: function (data) {
            data.type = "webkitAnimationEnd"
        },
        off: function (data) {
            data.type = "webkitAnimationEnd"
        }
    })
}


//针对IE6-8修正input
if (!("oninput" in DOC.createElement("input"))) {
    eventHooks.push({
        match: function (type) {
            return type === "input"
        },
        on: function (data) {
            data.type = "propertychange"
            var oldFn = data.fn
            data.fn = function (e) {
                if (e.nativeEvent.propertyName === "value") {
                    return oldFn(e)
                }
            }
        },
        off: function (data) {
            data.type = "propertychange"
        }
    })
}


if (DOC.onmousewheel === void 0) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    var fixWheelType = DOC.onwheel !== void 0 ? "wheel" : "DOMMouseScroll"
    var fixWheelDelta = fixWheelType === "wheel" ? "deltaY" : "detail"
    eventHooks.push({
        match: function (type) {
            return type === "mousewheel"
        },
        on: function (data) {
            data.type = fixWheelType
            var oldFn = data.fn
            data.fn = function (e) {
                var event = e.nativeEvent
                e.wheelDeltaY = e.wheelDelta = event[fixWheelDelta] > 0 ? -120 : 120
                e.wheelDeltaX = 0
                return oldFn(e)
            }
        },
        off: function (data) {
            data.type = fixWheelType
        }
    })
}