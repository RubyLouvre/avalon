var avalon = require('../../seed/core')
var document = avalon.document
var window = avalon.window
var root = avalon.root

var markID = avalon._markBindID
var share = require('./share')
var dispatch = share.dispatch
var canBubbleUp = share.canBubbleUp

var eventHooks = avalon.eventHooks
/*绑定事件*/
avalon.bind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
        //如果是使用ms-on-*绑定的回调,其uuid格式为e12122324,
        //如果是使用bind方法绑定的回调,其uuid格式为_12
        var uuid = markID(fn)
        var hook = eventHooks[type]
        if (hook) {
            type = hook.type || type
            if (hook.fix) {
                fn = hook.fix(elem, fn)
                fn.uuid = uuid
            }
        }
        //fix 移动端浏览器:click不触发的BUG
        if(type === 'click' && !elem.onclick){
            elem.onclick = ''
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


avalon.fireDom = function (elem, type, opts) {
    var hackEvent = document.createEvent('Events')
    hackEvent.initEvent(type, true, true)
    avalon.shadowCopy(hackEvent, opts)
    elem.dispatchEvent(hackEvent)
}


//针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
/* istanbul ignore if */
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
/* istanbul ignore if */
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
