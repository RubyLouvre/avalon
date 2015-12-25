
//将做好的事件回调中全部放在这里
//ms-repeat都是共用同一个点击事件
var rdash = /\(([^)]*)\)/
avalon.eventPool = {}

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
        var id = binding.param + ":" + binding.expr + "??"
        if (!avalon.eventPool[id]) {//注册事件回调
            avalon.eventPool[id] = listener
        }
        var elem = binding.element
        var change = addData(elem, "addEvents")// 创建一个更新包
        change[binding.param] = id
        change = addData(elem, "addEventContext")
        change[id] = binding.vmodel
        addHooks(this, binding)
    },
    update: function (elem, vnode) {
        if (!vnode.disposed) {
            var list = elem.getAttribute("avalon-events") || ""
            var vm = elem.__vm__ || (elem.__vm__ = {})
            for (var i in vnode.addEventContext) {
                vm[i] = vnode.addEventContext[i]
            }
            delete vnode.addEventContext
            for (var eventName in vnode.addEvents) {
                var id = vnode.addEvents[eventName]
                if (list.indexOf(eventName) === -1) {//同一种事件只绑定一次
                    if (canBubbleUp[eventName]) {
                        delegateEvent(eventName)
                    } else {
                        avalon.bind(elem, eventName, avalon.__dispatch__)
                    }
                }
                if (list.indexOf(id) === -1) {
                    list += id //将令牌放进avalon-events属性中
                }
            }
            delete vnode.addEvents
            elem.setAttribute("avalon-events", list)
        }
    },
    dispose: function (elem) {
        var list = elem.getAttribute("avalon-events")
        if (list) {
            list.split("??").forEach(function (str) {
                var match = str.match(/([^:]+)\:/)
                if (match) {//清空事件
                    avalon.unbind(elem, match[0], avalon.__dispatch__)
                }
            })
            elem.removeAttribute("avalon-events")
        }
    }
})

function dispatch(event) {
    var type = event.type
    var elem = event.target
    var list = elem.getAttribute("avalon-events")
    list.split("??").forEach(function (str) {
        var match = str.match(/([^:]+)\:/)
        if (match && match[1] === type) {
            var key = str +"??"
            var fn = avalon.eventPool[key]
            fn.call(elem, elem.__vm__[key], event)
        }
    })

}
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
        list += (eventName + ":" + (new Date - 0) + "??")
        avalon.bind(root, eventName, avalon.__dispatch__)
        root.setAttribute("avalon-events", list)
    }
}
avalon.__dispatch__ = dispatch