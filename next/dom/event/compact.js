import {avalon,eventHooks} from '../../seed/core'
import {canBubbleUp} from './canBubbleUp'
import {avEvent} from './share'
import { modern as W3C, doc, root} from '../../seed/lang.share'

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
    if (doc.createEvent) {
        var hackEvent = doc.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    } else if (root.contains(elem)) {//IE6-8触发事件必须保证在DOM树中,否则报'SCRIPT16389: 未指明的错误'
        hackEvent = doc.createEventObject()
        avalon.shadowCopy(hackEvent, opts)
        elem.fireEvent('on' + type, hackEvent)
    }
}

var rmouseEvent = /^(?:mouse|contextmenu|drag)|click/
avEvent.prototype.fixEvent = function () {
    var event = this
    if (this.which == null && event.type.indexOf('key') === 0) {
        this.which = event.charCode != null ? event.charCode : event.keyCode
    } else if (rmouseEvent.test(event.type) && !('pageX' in this)) {
        var DOC = event.target.ownerDocument || doc
        var box = DOC.compatMode === 'BackCompat' ? DOC.body : DOC.documentElement
        this.pageX = event.clientX + (box.scrollLeft >> 0) - (box.clientLeft >> 0)
        this.pageY = event.clientY + (box.scrollTop >> 0) - (box.clientTop >> 0)
        this.wheelDeltaY = this.wheelDelta
        this.wheelDeltaX = 0
    }
}

//针对IE6-8修正input
/* istanbul ignore if */
if (!('oninput' in doc.createElement('input'))) {
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

