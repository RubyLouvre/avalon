import avalon from '../../seed/core'

import {canBubbleUp} from './canBubbleUp'

import { eventHooks, document, root, avEvent} from './share'

var W3C = avalon.modern
if (!W3C) {
    delete canBubbleUp.change
    delete canBubbleUp.select
}


avalon._nativeBind = W3C ? function (el, type, fn, capture) {
    el.addEventListener(type, fn, capture)
} : function (el, type, fn) {
    el.attachEvent('on' + type, fn)
}

avalon._nativeUnBind = W3C ? function (el, type, fn) {
    el.removeEventListener(type, fn)
} : function (el, type, fn) {
    el.detachEvent('on' + type, fn)
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
avEvent.prototype.fixEvent = function () {
    if (this.which == null && event.type.indexOf('key') === 0) {
        this.which = event.charCode != null ? event.charCode : event.keyCode
    } else if (rmouseEvent.test(event.type) && !('pageX' in this)) {
        var doc = target.ownerDocument || document
        var box = doc.compatMode === 'BackCompat' ? doc.body : doc.documentElement
        this.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        this.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        this.wheelDeltaY = this.wheelDelta
        this.wheelDeltaX = 0
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

