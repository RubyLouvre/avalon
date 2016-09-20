import avalon from '../../seed/core'

import {document} from './share'


avalon._nativeBind = function (el, type, fn, capture) {
    el.addEventListener(type, fn, capture)
}
avalon._nativeUnBind = function (el, type, fn) {
    el.removeEventListener(type, fn)
} 

avalon.fireDom = function (elem, type, opts) {
    /* istanbul ignore else */
    if (document.createEvent) {
        var hackEvent = document.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    } 
}

