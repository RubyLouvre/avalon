
//将做好的事件回调中全部放在这里
//ms-repeat都是共用同一个点击事件
var rdash = /\(([^)]*)\)/
avalon.eventPool = {}
avalon.eventVM = {}
avalon.directive("on", {
    priority: 3000,
    init: function (binding) {
        var value = binding.expr
        binding.type = "on"
        // ms-on-mousemove-10
        binding.param = binding.param.replace(/-\d+$/, "")
        if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
            // aaa() aaa($event)当成aaa处理
            var matched = (value.match(rdash) || ["", ""])[1].trim()
            if (matched === "" || matched === "$event") {
                value = value.replace(rdash, "")
            }
        }
        binding.expr = value
    },
    change: function (listener, binding) {
        var type = binding.param
        var uuid = listener.uuid || (listener.uuid = generateID("e"))

        var key = type + ":" + uuid + "??"
        if (!avalon.eventVM[key]) {//注册事件回调
            avalon.eventVM[key] = binding.vmodel
        }
        var elem = binding.element
        var change = addData(elem, "eventListeners")// 创建一个更新包
        change[key] = listener
        addHooks(this, binding)
    },
    update: function (elem, vnode) {
        if (!vnode.disposed) {
            for (var key in vnode.eventListeners) {
                var type = key.split(":").shift()
                var fn = vnode.eventListeners[key]
                avalon.bind(elem, type, fn)
            }
            delete vnode.eventListeners
        }
    },
    dispose: function (elem) {
        avalon.unbind(elem)
    }
})


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
function delegateEvent(eventName) {
    var list = root.getAttribute("avalon-events") || ""
    if (list.indexOf(eventName + ":") === -1) {
        list += (eventName + ":1984??")
        avalon.bind(root, eventName, avalon.__dispatch__)
        root.setAttribute("avalon-events", list)
    }
}
avalon.__dispatch__ = dispatch

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

avalon.bind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var list = elem.getAttribute("avalon-events") || ""
        var uuid = getUid(fn)
        avalon.eventPool[uuid] = fn
        var key = type + ":" + uuid + "??"
        if (list.indexOf(type) === -1) {//同一种事件只绑定一次
            if (canBubbleUp[type] && elem !== root) {
                delegateEvent(type)
            } else {
                nativeBind(elem, type, avalon.__dispatch__)
            }
        }
        if (list.indexOf(key) === -1) {
            list += key //将令牌放进avalon-events属性中
        }
        elem.setAttribute("avalon-events", list)
    } else {
        nativeBind(elem, type, fn)
    }
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
                nativeUnBind(elem, type, avalon.__dispatch__)
            } else if (type) {
                if (curType === type) {
                    if (fn) {
                        keep = uuid !== fn.uuid
                    } else {
                        nativeUnBind(elem, type, avalon.__dispatch__)
                    }
                } else {
                    keep = true
                }
            }
            if (keep) {
                newList.push(str + "??")
            } else {
                if (uuid.length > 10) {
                    delete avalon.eventPool[uuid]
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
    var type = event.type
    var elem = event.target
    var list = elem.getAttribute("avalon-events") || ""
    list.split("??").forEach(function (str) {
        var arr = str.split(":")
        var curType = arr[0]
        var uuid = arr[1]
        if (curType === type) {
            var fn = avalon.eventPool[uuid]
            var vm = avalon.eventVM[str + "??"]
            if (vm && vm.$active === false) {
                return avalon.unbind(elem, type, fn)
            }
            if (fn) {
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


