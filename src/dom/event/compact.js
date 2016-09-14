var avalon = require('../../seed/core')
var document = avalon.document
var root = avalon.root
var window = avalon.window

var W3C = avalon.modern

var markID = avalon._markBindID
//http://www.feiesoft.com/html/events.html
//http://segmentfault.com/q/1010000000687977/a-1020000000688757
var share = require('./share')
var avEvent = share.avEvent
var dispatch = share.dispatch
var canBubbleUp = share.canBubbleUp

if (!W3C) {
    delete canBubbleUp.change
    delete canBubbleUp.select
}



var eventHooks = avalon.eventHooks
/*绑定事件*/
avalon.bind = function (elem, type, fn) {
    if (elem.nodeType === 1) {
        var value = elem.getAttribute('avalon-events') || ''
        var uuid = markID(fn)
        var hook = eventHooks[type]
        if (hook) {
            type = hook.type || type
            if (hook.fix) {
                fn = hook.fix(elem, fn)
                fn.uuid = uuid
            }
        }
        var key = type + ':' + uuid
        avalon.eventListeners[fn.uuid] = fn
        if (value.indexOf(type + ':') === -1) {//同一种事件只绑定一次
            if (canBubbleUp[type] || (avalon.modern && focusBlur[type])) {
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

var nativeBind = W3C ? function (el, type, fn, capture) {
    el.addEventListener(type, fn, capture)
} : function (el, type, fn) {
    el.attachEvent('on' + type, fn)
}
var nativeUnBind = W3C ? function (el, type, fn) {
    el.removeEventListener(type, fn)
} : function (el, type, fn) {
    el.detachEvent('on' + type, fn)
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
    /* istanbul ignore else */
    if (document.createEvent) {
        var hackEvent = document.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报'SCRIPT16389: 未指明的错误'
        hackEvent = document.createEventObject()
        avalon.shadowCopy(hackEvent, opts)
        elem.fireEvent('on' + type, hackEvent)
    }
}

var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/

avEvent.prototype.fixIE = function () {
    if (!this.target) {
        this.target = this.srcElement
    }
    var target = this.target
    /* istanbul ignore if */
    /* istanbul ignore else */
    if (this.which == null && this.type.indexOf('key') === 0) {
        this.which = this.charCode != null ? this.charCode : this.keyCode
    } else if (rmouseEvent.test(this.type) && !('pageX' in this)) {
        var doc = target.ownerDocument || document
        var box = doc.compatMode === 'BackCompat' ? doc.body : doc.documentElement
        this.pageX = this.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        this.pageY = this.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        this.wheelDeltaY = this.wheelDelta
        this.wheelDeltaX = 0
    }
}

//针对firefox, chrome修正mouseenter, mouseleave
/* istanbul ignore if */
if (!('onmouseenter' in root)) {
    avalon.each({
        mouseenter: 'mouseover',
        mouseleave: 'mouseout'
    }, function (origType, fixType) {
        eventHooks[origType] = {
            type: fixType,
            fix: function (elem, fn) {
                return function (e) {
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
}, function (construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
        eventHooks.animationend = {
            type: fixType
        }
    }
})
//针对IE6-8修正input
/* istanbul ignore if */
if (!('oninput' in document.createElement('input'))) {
    eventHooks.input = {
        type: 'propertychange',
        fix: function (elem, fn) {
            return function (e) {
                if (e.propertyName === 'value') {
                    e.type = 'input'
                    return fn.apply(this, arguments)
                }
            }
        }
    }
}
/* istanbul ignore if */
if (document.onmousewheel === void 0) {
    /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
    var fixWheelType = document.onwheel !== void 0 ? 'wheel' : 'DOMMouseScroll'
    var fixWheelDelta = fixWheelType === 'wheel' ? 'deltaY' : 'detail'
    eventHooks.mousewheel = {
        type: fixWheelType,
        fix: function (elem, fn) {
            return function (e) {
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
