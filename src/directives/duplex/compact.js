import { avalon } from '../../seed/core'
import { duplexParse, duplexDiff, duplexInit, valueHijack as needPoll, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.compact'


avalon.directive('duplex', {
    priority: 9999999,
    parse: duplexParse,
    diff: duplexDiff,
    update: function(value, vdom, newVdom, afterCb) {
        vdom.vm = newVdom.vm
        var dom = vdom.dom || {}
        if (!dom._ms_duplex) {
            duplexInit.call(this, vdom, updateDataEvents)
        }
        //如果不支持input.value的Object.defineProperty的属性支持,
        //需要通过轮询同步, chrome 42及以下版本需要这个hack

        pollValue.call(dom, avalon.msie, /input|edit/.test(this.dtype))

        //更新视图
        var me = this
        afterCb.push(function() {
            updateView[me.dtype].call(me)
        })

    }
})

function pollValue(dom, isIE, canEdit) {
    if (canEdit && needPoll && !isIE && !dom.valueHijack) {
        dom.valueHijack = updateModel
        var intervalID = setInterval(function() {
            if (!avalon.contains(avalon.root, dom)) {
                clearInterval(intervalID)
            } else {
                dom.valueHijack({ type: 'poll' })
            }
        }, 30)
        return intervalID
    }
}
avalon.__pollValue = pollValue //export to test
    /* istanbul ignore if */
if (avalon.msie < 8) {
    var oldUpdate = updateView.updateChecked
    updateView.updateChecked = function(vdom, checked) {
        var dom = vdom.dom
        if (dom) {
            setTimeout(function() {
                    oldUpdate(vdom, checked)
                    dom.firstCheckedIt = 1
                }, dom.firstCheckedIt ? 31 : 16)
                //IE6,7 checkbox, radio是使用defaultChecked控制选中状态，
                //并且要先设置defaultChecked后设置checked
                //并且必须设置延迟(因为必须插入DOM树才生效)
        }
    }
}