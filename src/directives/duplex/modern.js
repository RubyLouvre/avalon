import { avalon } from '../../seed/core'
import { duplexInit, duplexParse, duplexDiff, valueHijack, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.modern'

avalon.directive('duplex', {
    priority: 2000,
    parse: duplexParse,
    diff: duplexDiff,
    update: function(value, vdom) {
        vdom.vm = newVdom.vm

        if (!this.dom) {
            duplexInit.call(this, vdom, updateDataEvents)
        }
        updateView[this.dtype].call(this)
    }
})