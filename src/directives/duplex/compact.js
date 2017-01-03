
import { avalon } from '../../seed/core'
import { duplexBeforeInit, duplexInit, duplexDiff, duplexBind, valueHijack, updateView } from './share'
import { updateDataEvents } from './updateDataEvents.compact'
import { updateModel } from './updateDataHandle'


avalon.directive('duplex', {
    priority: 9999999,
    beforeInit: duplexBeforeInit,
    init: duplexInit,
    diff: duplexDiff,
    update: function (vdom, value) {
        if (!this.dom) {
            duplexBind.call(this, vdom, updateDataEvents)
        }
        //如果不支持input.value的Object.defineProperty的属性支持,
        //需要通过轮询同步, chrome 42及以下版本需要这个hack
        pollValue.call(this, avalon.msie, valueHijack)
        //更新视图

        updateView[this.dtype].call(this)

    }
})

function pollValue(isIE, valueHijack) {
    var dom = this.dom
    if (this.isString
        && valueHijack
        && !isIE
        && !dom.valueHijack) {
        dom.valueHijack = updateModel
        var intervalID = setInterval(function () {
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
    updateView.updateChecked = function (vdom, checked) {
        var dom = vdom.dom
        if (dom) {
            setTimeout(function () {
                oldUpdate(vdom, checked)
                dom.firstCheckedIt = 1
            }, dom.firstCheckedIt ? 31 : 16)
            //IE6,7 checkbox, radio是使用defaultChecked控制选中状态，
            //并且要先设置defaultChecked后设置checked
            //并且必须设置延迟(因为必须插入DOM树才生效)
        }
    }
}
