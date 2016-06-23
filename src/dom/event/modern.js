var document = avalon.document
var window = avalon.window
var root = avalon.root

var getShortID = require('../../seed/lang.share').getShortID
var canBubbleUp = require('./canBubbleUp')

var eventHooks = avalon.eventHooks
/*绑定事件*/
avalon.bind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
        //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324,
        //如果是使用bind方法绑定的回调,其uuid格式为_12
        var uuid = getShortID(fn)
        var hook = eventHooks[type]
        if(hook){
            type = hook.type || type
            if (hook.fix) {
                fn = hook.fix(elem, fn)
                fn.uuid = uuid
            }
        }
        var key = type + ':' + uuid
        avalon.eventListeners[fn.uuid] = fn
        if (value.indexOf(type + ':') === -1) {//同一种事件只绑定一次
            if (canBubbleUp[type] || focusBlur[type]) {
                delegateEvent(type)
            } else {
                nativeBind(elem, type, dispatch)
            }
        }
        var keys = value.split(',')
        if (keys[0] === '') {
            keys.shift()
        }
        if (keys.indexOf(key) === -1) {
            keys.push(key)
            elem.setAttribute('avalon-events', keys.join(','))
            //将令牌放进avalon-events属性中
        }

    } else {
        nativeBind(elem, type, fn)
    }
    return fn //兼容之前的版本
}

avalon.unbind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
        switch (arguments.length) {
            case 1:
                nativeUnBind(elem, type, dispatch)
                elem.removeAttribute('avalon-events')
                break
            case 2:
                value = value.split(',').filter(function (str) {
                    return str.indexOf(type + ':') === -1
                }).join(',')

                elem.setAttribute('avalon-events', value)
                break
            default:
                var search = type + ':' + fn.uuid
                value = value.split(',').filter(function (str) {
                    return str !== search
                }).join(',')
                elem.setAttribute('avalon-events', value)
                delete avalon.eventListeners[fn.uuid]
                break
        }
    } else {
        nativeUnBind(elem, type, fn)
    }
}

var typeRegExp = {}
function collectHandlers(elem, type, handlers) {
    var value = elem.getAttribute('avalon-events')
    if (value && (elem.disabled !== true || type !== 'click')) {
        var uuids = []
        var reg = typeRegExp[type] || (typeRegExp[type] = new RegExp(type + '\\:([^,\\s]+)', 'g'))
        value.replace(reg, function (a, b) {
            uuids.push(b)
            return a
        })
        if (uuids.length) {
            handlers.push({
                elem: elem,
                uuids: uuids
            })
        }
    }
    elem = elem.parentNode
    var g = avalon.gestureEvents || {}
    if (elem && elem.getAttribute && (canBubbleUp[type] || g[type])) {
        collectHandlers(elem, type, handlers)
    }

}

var rhandleHasVm = /^e/
function dispatch(event) {
    event = new avEvent(event)
    var type = event.type
    var elem = event.target
    var handlers = []
    collectHandlers(elem, type, handlers)
    var i = 0, j, uuid, handler
    while ((handler = handlers[i++]) && !event.cancelBubble) {
        var host = event.currentTarget = handler.elem
        j = 0
        while ((uuid = handler.uuids[ j++ ]) &&
                !event.isImmediatePropagationStopped) {
            var fn = avalon.eventListeners[uuid]
            if (fn) {
                var vm = rhandleHasVm.test(uuid) ? handler.elem._ms_context_ : 0
                if (vm && vm.$hashcode === false) {
                    return avalon.unbind(elem, type, fn)
                }
               
                var ret = fn.call(vm || elem, event, host._ms_local)
            
                if (ret === false) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
        }
    }
}
var focusBlur = {
    focus: true,
    blur: true
}

var nativeBind = function (el, type, fn, capture) {
    el.addEventListener(type, fn, capture)
}
var nativeUnBind = function (el, type, fn) {
    el.removeEventListener(type, fn)
}

function delegateEvent(type) {
    var value = root.getAttribute('delegate-events') || ''
    if (value.indexOf(type) === -1) {
        var arr = value.match(avalon.rword) || []
        arr.push(type)
        root.setAttribute('delegate-events', arr.join(','))
        nativeBind(root, type, dispatch, !!focusBlur[type])
    }
}

var rvendor = /^(?:ms|webkit|moz)/
function avEvent(event) {
    if (event.originalEvent) {
        return this
    }
    for (var i in event) {
        if (!rvendor.test(i) && typeof event[i] !== 'function') {
            this[i] = event[i]
        }
    }
    this.timeStamp = new Date() - 0
    this.originalEvent = event
}
avEvent.prototype = {
    preventDefault: function () {
        var e = this.originalEvent;
        this.returnValue = false
        if (e) {
            e.returnValue = false
            e.preventDefault()
        }
    },
    stopPropagation: function () {
        var e = this.originalEvent
        this.cancelBubble = true
        if (e) {
            e.cancelBubble = true
            e.stopPropagation()
        }
    },
    stopImmediatePropagation: function () {
        var e = this.originalEvent
        this.isImmediatePropagationStopped = true
        if (e.stopImmediatePropagation) {
            e.stopImmediatePropagation()
        }
        this.stopPropagation()
    }
}

avalon.fireDom = function (elem, type, opts) {
    var hackEvent = document.createEvent('Events');
    hackEvent.initEvent(type, true, true)
    avalon.shadowCopy(hackEvent, opts)
    elem.dispatchEvent(hackEvent)
}

var eventHooks = avalon.eventHooks
//针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
if (!('onmouseenter' in root)) {
    avalon.each({
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
    }, function (origType, fixType) {
        eventHooks[origType] = {
            type: fixType,
            fn: function (elem, fn) {
                return function (e) {
                    var t = e.relatedTarget
                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                        delete e.type
                        e.type = origType
                        return fn.call(this, e)
                    }
                }
            }
        }
    })
}
//针对IE9+, w3c修正animationend
avalon.each({
    AnimationEvent: 'animationend',
    WebKitAnimationEvent: 'webkitAnimationEnd'
}, function (construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
        eventHooks.animationend = {
            type: fixType
        }
    }
})

if (document.onmousewheel === void 0) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    eventHooks.mousewheel = {
        type: 'wheel',
        fn: function (elem, fn) {
            return function (e) {
                e.wheelDeltaY = e.wheelDelta = e.deltaY > 0 ? -120 : 120
                e.wheelDeltaX = 0
                Object.defineProperty(e, 'type', {
                    value: 'mousewheel'
                })
                fn.call(this, e)
            }
        }
    }
}

avalon.fn.bind = function (type, fn, phase) {
    if (this[0]) { //此方法不会链
        return avalon.bind(this[0], type, fn, phase)
    }
}

avalon.fn.unbind = function (type, fn, phase) {
    if (this[0]) {
        avalon.unbind(this[0], type, fn, phase)
    }
    return this
}
avalon.$$unbind = function (node) {
    var nodes = node.querySelectorAll('[avalon-events]')
    avalon.each(nodes, function (i, el) {
        avalon.unbind(el)
    })
}