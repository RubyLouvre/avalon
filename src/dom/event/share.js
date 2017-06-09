import { avalon, _slice, eventHooks, modern, window, document, root, getShortID } from '../../seed/core'
import { canBubbleUp } from './canBubbleUp'
/* istanbul ignore if */
var hackSafari = avalon.modern && document.ontouchstart

//添加fn.bind, fn.unbind, bind, unbind
avalon.fn.bind = function(type, fn, phase) {
    if (this[0]) { //此方法不会链
        return avalon.bind(this[0], type, fn, phase)
    }
}

avalon.fn.unbind = function(type, fn, phase) {
    if (this[0]) {
        var args = _slice.call(arguments)
        args.unshift(this[0])
        avalon.unbind.apply(0, args)
    }
    return this
}

/*绑定事件*/
avalon.bind = function(elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
            //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324,
            //如果是使用bind方法绑定的回调,其uuid格式为_12
        var uuid = getShortID(fn)
        var hook = eventHooks[type]
            /* istanbul ignore if */
        if (type === 'click' && hackSafari) {
            elem.addEventListener('click', avalon.noop)
        }
        /* istanbul ignore if */
        if (hook) {
            type = hook.type || type
            if (hook.fix) {
                fn = hook.fix(elem, fn)
                fn.uuid = uuid
            }
        }
        var key = type + ':' + uuid
        avalon.eventListeners[fn.uuid] = fn
            /* istanbul ignore if */
        if (value.indexOf(type + ':') === -1) { //同一种事件只绑定一次
            if (canBubbleUp[type] || (avalon.modern && focusBlur[type])) {
                delegateEvent(type)
            } else {
                avalon._nativeBind(elem, type, dispatch)
            }
        }
        var keys = value.split(',')
            /* istanbul ignore if */
        if (keys[0] === '') {
            keys.shift()
        }
        if (keys.indexOf(key) === -1) {
            keys.push(key)
            setEventId(elem, keys.join(','))
                //将令牌放进avalon-events属性中
        }
        return fn
    } else {
        /* istanbul ignore next */
        function cb(e) {
            fn.call(elem, new avEvent(e))
        }
        avalon._nativeBind(elem, type, cb)
        return cb
    }
}

function setEventId(node, value) {
    node.setAttribute('avalon-events', value)
}
/* istanbul ignore next */
avalon.unbind = function(elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
        switch (arguments.length) {
            case 1:
                avalon._nativeUnBind(elem, type, dispatch)
                elem.removeAttribute('avalon-events')
                break
            case 2:
                value = value.split(',').filter(function(str) {
                    return str.indexOf(type + ':') === -1
                }).join(',')
                setEventId(elem, value)
                break
            default:
                var search = type + ':' + fn.uuid
                value = value.split(',').filter(function(str) {
                    return str !== search
                }).join(',')
                setEventId(elem, value)
                delete avalon.eventListeners[fn.uuid]
                break
        }
    } else {
        avalon._nativeUnBind(elem, type, fn)
    }
}

var typeRegExp = {}

function collectHandlers(elem, type, handlers) {
    var value = elem.getAttribute('avalon-events')
    if (value && (elem.disabled !== true || type !== 'click')) {
        var uuids = []
        var reg = typeRegExp[type] || (typeRegExp[type] = new RegExp("\\b" + type + '\\:([^,\\s]+)', 'g'))
        value.replace(reg, function(a, b) {
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
    var i = 0,
        j, uuid, handler
    while ((handler = handlers[i++]) && !event.cancelBubble) {
        var host = event.currentTarget = handler.elem
        j = 0
        while ((uuid = handler.uuids[j++])) {
            if (event.stopImmediate) {
                break
            }
            var fn = avalon.eventListeners[uuid]
            if (fn) {
                var vm = rhandleHasVm.test(uuid) ? handler.elem._ms_context_ : 0
                if (vm && vm.$hashcode === false) {
                    return avalon.unbind(elem, type, fn)
                }
                var ret = fn.call(vm || elem, event)

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

function delegateEvent(type) {
    var value = root.getAttribute('delegate-events') || ''
    if (value.indexOf(type) === -1) {
        //IE6-8会多次绑定同种类型的同一个函数,其他游览器不会
        var arr = value.match(avalon.rword) || []
        arr.push(type)
        root.setAttribute('delegate-events', arr.join(','))
        avalon._nativeBind(root, type, dispatch, !!focusBlur[type])
    }
}

var eventProto = {
    webkitMovementY: 1,
    webkitMovementX: 1,
    keyLocation: 1,
    fixEvent: function() {},
    preventDefault: function() {
        var e = this.originalEvent || {}
        e.returnValue = this.returnValue = false
        if (modern && e.preventDefault) {
            e.preventDefault()
        }
    },
    stopPropagation: function() {
        var e = this.originalEvent || {}
        e.cancelBubble = this.cancelBubble = true
        if (modern && e.stopPropagation) {
            e.stopPropagation()
        }
    },
    stopImmediatePropagation: function() {
        this.stopPropagation()
        this.stopImmediate = true
    },
    toString: function() {
        return '[object Event]' //#1619
    }
}

export function avEvent(event) {
    if (event.originalEvent) {
        return event
    }
    for (var i in event) {
        if (!eventProto[i]) {
            this[i] = event[i]
        }
    }
    if (!this.target) {
        this.target = event.srcElement
    }
    var target = this.target
    this.fixEvent()
    this.timeStamp = new Date() - 0
    this.originalEvent = event
}
avEvent.prototype = eventProto
    //针对firefox, chrome修正mouseenter, mouseleave
    /* istanbul ignore if */
if (!('onmouseenter' in root)) {
    avalon.each({
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
    }, function(origType, fixType) {
        eventHooks[origType] = {
            type: fixType,
            fix: function(elem, fn) {
                return function(e) {
                    var t = e.relatedTarget
                    if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
                        delete e.type
                        e.type = origType
                        return fn.apply(this, arguments)
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
}, function(construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
        eventHooks.animationend = {
            type: fixType
        }
    }
})

/* istanbul ignore if */
if (!("onmousewheel" in document)) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    var fixWheelType = document.onwheel !== void 0 ? 'wheel' : 'DOMMouseScroll'
    var fixWheelDelta = fixWheelType === 'wheel' ? 'deltaY' : 'detail'
    eventHooks.mousewheel = {
        type: fixWheelType,
        fix: function(elem, fn) {
            return function(e) {
                var delta = e[fixWheelDelta] > 0 ? -120 : 120
                e.wheelDelta = ~~elem._ms_wheel_ + delta
                elem._ms_wheel_ = e.wheelDeltaY = e.wheelDelta
                e.wheelDeltaX = 0
                if (Object.defineProperty) {
                    Object.defineProperty(e, 'type', {
                        value: 'mousewheel'
                    })
                }
                return fn.apply(this, arguments)
            }
        }
    }
}