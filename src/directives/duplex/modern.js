
import { avalon } from '../../seed/core'
import { duplexBeforeInit, duplexInit, duplexDiff, duplexBind, valueHijack, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.modern'


avalon.directive('duplex', {
    priority: 2000,
    beforeInit: duplexBeforeInit,
    init: duplexInit,
    diff: duplexDiff,
    update: function (vdom, value) {
        if (!this.dom) {
           duplexBind.call(this, vdom, updateDataEvents)
        }
        updateView[this.dtype].call(this)
    }
})

