var rdash = /\(([^)]*)\)/
bindingHandlers.on = function (data, vmodels) {
    var value = data.value
    data.type = "on"
    var eventType = data.param.replace(/-\d+$/, "") // ms-on-mousemove-10
    if (typeof bindingHandlers.on[eventType + "Hook"] === "function") {
        bindingHandlers.on[eventType + "Hook"](data)
    }
    if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
        var matched = (value.match(rdash) || ["", ""])[1].trim()
        if (matched === "" || matched === "$event") { // aaa() aaa($event)当成aaa处理
            value = value.replace(rdash, "")
        }
    }
    parseExprProxy(value, vmodels, data)
}
var bankForEvent = {}
var hasRegistryEvent = {}
function createTopCallback(type) {
    return function (e) {
        var event = fixEvent(e, type)
        for (var cur = e.target; cur.nodeType && !event.propagationStopped; cur = cur.parentNode) {
            var datas = getEventHandlers(cur, type)
            if (datas.length) {
                for (var k = 0, data; !event.isImmediatePropagationStopped && (data = datas[k++]); ) {
                    var fn = data.evaluator
                    if (fn) {
                        var ret = fn.apply(cur, data.args.concat(e))
                        if (ret === false) {
                            event.preventDefault()
                            event.stopPropagation()
                        }
                    }
                }
            }
        }
    }
}


//得到所有要处理的事件回调
function getEventHandlers(elem, type) {
    var uuid = getUid(elem)
    var obj = bankForEvent[uuid]
    return obj && obj[eventType] || []
}
bindingExecutors.on = function (callback, elem, data) {
    var eventType = data.param.replace(/-\d+$/, "")
    if (!hasRegistryEvent[eventType]) {
        avalon.bind(DOC, eventType, createTopCallback(eventType))
        hasRegistryEvent[eventType] = true
    }
    var uuid = getUid(elem)
    var obj = bankForEvent[uuid] || (bankForEvent[uuid] = {})
    var events = obj[eventType] || (obj[eventType] = [])
    events.push(data)
}


var eventPool = []
function fixEvent(nativeEvent, type) {
    var event = eventPool.shift()
    if (!event) {
        event = new SyntheticEvent()
    }
    event.init(nativeEvent)
    for (var i = 0, h; h = avalon.eventHooks[i++]; ) {
        if (h.match(type)) {
            h.fix(type)
        }
    }
    return event
}

function SyntheticEvent() {

}
var ep = SyntheticEvent.prototype
ep.init = function (nativeEvent) {
    this.timeStamp = new Date() - 0
    this.nativeEvent = nativeEvent
    this.target = nativeEvent.target || nativeEvent.srcElement
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
//阻止事件往上下传播
ep.stopImmediatePropagation = function () {
    //阻止事件在一个元素的同种事件的回调中传播
    this.isImmediatePropagationStopped = true
    this.stopPropagation()
}
var eventHooks = avalon.eventHooks = []
var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
var mouseEventHook = {
    match: function (type) {
        return rmouseEvent.test(type)
    },
    fix: function (ret, event) {
        var target = ret.target
        var doc = target.ownerDocument || DOC
        var box = doc.compatMode === "BackCompat" ? doc.body : doc.documentElement
        ret.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        ret.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        ret.wheelDeltaY = ret.wheelDelta
        ret.wheelDeltaX = 0
    }
}

var keyEventHook = {
    match: function (type) {
        return type.indexOf("key") !== 0
    },
    fix: function (ret, event) {
        ret.which = event.charCode != null ? event.charCode : event.keyCode
    }
}
eventHooks.push(mouseEventHook, keyEventHook)