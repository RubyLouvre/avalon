import {avalon} from '../../seed/core'

import {doc} from '../../seed/lang.share'
import {avEvent} from './share'


avalon._nativeBind = function (el, type, fn, capture) {
    el.addEventListener(type, fn, capture)
}
avalon._nativeUnBind = function (el, type, fn) {
    el.removeEventListener(type, fn)
}

avalon.fireDom = function (elem, type, opts) {
    /* istanbul ignore else */
    if (doc.createEvent) {
        var hackEvent = doc.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    }
}

