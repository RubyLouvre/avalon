
var canBubbleUp = {
    click: true,
    dblclick: true,
    keydown: true,
    keypress: true,
    keyup: true,
    mousedown: true,
    mousemove: true,
    mouseup: true,
    input: true,
    change: true
}
if (!W3C) {
    delete canBubbleUp.change
}

avalon.__eventPool__ = {}
avalon.__eventVM__ = {}

/*绑定事件*/
avalon.bind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var list = elem.getAttribute("avalon-events") || ""
        var uuid = getUid(fn)
        avalon.__eventPool__[uuid] = fn
        var key = type + ":" + uuid + "??"
        var hook = avalon.eventHooks[type]
        if (hook) {
            type = hook.type
            if (hook.fix) {
                fn = hook.fix(elem, fn)
                fn.uuid = uuid + "0"
                avalon.__eventPool__[fn.uuid] = fn
            }
            key = "_" + type + ":" + fn.uuid + "??"
        }
        if (list.indexOf(type) === -1) {//同一种事件只绑定一次
            if (canBubbleUp[type] && elem !== root) {
                delegateEvent(type)
            } else {
                nativeBind(elem, type, dispatch)
            }
        }
        if (list.indexOf(key) === -1) {
            list += key //将令牌放进avalon-events属性中
        }
        elem.setAttribute("avalon-events", list)
    } else {
        nativeBind(elem, type, fn)
    }
    return fn //兼容之前的版本
}

avalon.unbind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var list = elem.getAttribute("avalon-events") || ""
        var removeAll = arguments.length === 1
        var newList = []
        list.split("??").forEach(function (str) {
            var arr = str.split(":")
            var curType = arr[0]
            var uuid = arr[1]
            var keep = false
            if (removeAll) {
                nativeUnBind(elem, type, dispatch)
            } else if (type) {
                if (curType === type) {
                    if (fn) {
                        keep = uuid !== fn.uuid
                    } else {
                        nativeUnBind(elem, type, dispatch)
                    }
                } else {
                    keep = true
                }
            }
            if (keep) {
                newList.push(str + "??")
            } else {
                if (uuid.length > 10) {
                    delete avalon.__eventPool__[uuid]
                }
            }
        })
        elem.setAttribute("avalon-events", newList.join(""))
    } else {
        nativeUnBind(elem, type, fn)
    }
}


var last = +new Date()
function dispatch(event) {
    event = event.target ? event : fixEvent(event)
    var type = event.type
    var elem = event.target
    var list = elem.getAttribute("avalon-events") || ""
    list.split("??").forEach(function (str) {
        var arr = str.split(":")
        var curType = arr[0].replace("_", "")
        var uuid = arr[1]
        //var hooks[type]
        if (curType === type) {
            var fn = avalon.__eventPool__[uuid]
            if (fn) {
                var vm = avalon.__eventVM__[curType + ":" + uuid + "??"]
                if (vm && vm.$active === false) {
                    return avalon.unbind(elem, type, fn)
                }
                if (/move|scroll/.test(curType)) {
                    var curr = +new Date()
                    if (curr - last > 16) {
                        fn.call(elem, event, vm)
                        last = curr
                    }
                } else {
                    fn.call(elem, event, vm)
                }
            }
        }
    })
}


var nativeBind = W3C ? function (el, type, fn) {
    el.addEventListener(type, fn)
} : function (el, type, fn) {
    el.attachEvent("on" + type, fn)
}
var nativeUnBind = W3C ? function (el, type, fn) {
    el.removeEventListener(type, fn)
} : function (el, type, fn) {
    el.detachEvent("on" + type, fn)
}
function delegateEvent(eventName) {
    var list = root.getAttribute("avalon-events") || ""
    if (list.indexOf(eventName + ":") === -1) {
        list += (eventName + ":1984??")
        avalon.bind(root, eventName, dispatch)
        root.setAttribute("avalon-events", list)
    }
}
