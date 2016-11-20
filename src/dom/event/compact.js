import { avalon, eventHooks, modern, document, root } from '../../seed/core'
import { canBubbleUp } from './canBubbleUp'
import { avEvent } from './share'
export {
    avEvent
}
/* istanbul ignore if */
if (!modern) {
    delete canBubbleUp.change
    delete canBubbleUp.select
}
/* istanbul ignore next */
avalon._nativeBind = modern ? function (el, type, fn, capture) {
    el.addEventListener(type, fn, !!capture)
} : function (el, type, fn) {
    el.attachEvent('on' + type, fn)
}
/* istanbul ignore next */
avalon._nativeUnBind = modern ? function (el, type, fn, a) {
    el.removeEventListener(type, fn, !!a)
} : function (el, type, fn) {
    el.detachEvent('on' + type, fn)
}
/* istanbul ignore next */
avalon.fireDom = function (elem, type, opts) {
    if (document.createEvent) {
        var hackEvent = document.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报'SCRIPT16389: 未指明的错误'
        hackEvent = document.createEventObject()
        if (opts)
            avalon.shadowCopy(hackEvent, opts)
        try {
            elem.fireEvent('on' + type, hackEvent)
        } catch (e) {
            avalon.log('fireDom', type, 'args error')
        }
    }
}

var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
/* istanbul ignore next */
avEvent.prototype.fixEvent = function () {
    var event = this
    if (event.which == null && event.type.indexOf('key') === 0) {
        event.which = event.charCode != null ? event.charCode : event.keyCode
    }
    if (rmouseEvent.test(event.type) && !('pageX' in event)) {
        var DOC = event.target.ownerDocument || document
        var box = DOC.compatMode === 'BackCompat' ? DOC.body : DOC.documentElement
        event.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        event.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        event.wheelDeltaY = ~~event.wheelDelta
        event.wheelDeltaX = 0
    }
}

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

