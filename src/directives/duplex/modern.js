import { avalon } from '../../seed/core'
import { duplexInit, duplexParse, duplexDiff, valueHijack, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.modern'

avalon.directive('duplex', {
    priority: 2000,
    parse: duplexParse,
    diff: duplexDiff,
    update: function(value, vdom, newVdom, afterCb) {
        vdom.vm = newVdom.vm
        var dom = vdom.dom || {}
        if (!dom._ms_duplex) {
            duplexInit.call(this, vdom, updateDataEvents)
        }
        var me = this
        afterCb.push(function() {
            updateView[me.dtype].call(me)
        })
    }
})