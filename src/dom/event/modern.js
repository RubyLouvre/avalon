import { avalon, document } from '../../seed/core'

import {avEvent} from './share'
export {
    avEvent
}
 /* istanbul ignore next */
avalon._nativeBind = function (el, type, fn, capture) {
    el.addEventListener(type, fn, !!capture)
}

 /* istanbul ignore next */
avalon._nativeUnBind = function (el, type, fn, a) {
    el.removeEventListener(type, fn, !!a)
}

 /* istanbul ignore next */
avalon.fireDom = function (elem, type, opts) {
    /* istanbul ignore else */
    if (document.createEvent) {
        var hackEvent = document.createEvent('Events')
        hackEvent.initEvent(type, true, true, opts)
        avalon.shadowCopy(hackEvent, opts)
        elem.dispatchEvent(hackEvent)
    }
}

