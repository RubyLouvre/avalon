/* 
 * 通过绑定事件同步vmodel
 * 总共有三种方式同步视图
 * 1. 各种事件 input, change, click, propertychange, keydown...
 * 2. value属性重写
 * 3. 定时器轮询
 */
import { avalon, getShortID as markID, window, document, msie } from '../../seed/core'
import { updateModel } from './updateDataHandle'

export function updateDataEvents(dom, data) {
    var events = {}
    //添加需要监听的事件
    switch (data.dtype) {
        case 'radio':
        case 'checkbox':
            events.click = updateModel
            break
        case 'select':
            events.change = updateModel
            break
        case 'contenteditable':
            if (data.isChanged) {
                events.blur = updateModel
            } else {

                if (window.webkitURL) {
                    // http://code.metager.de/source/xref/WebKit/LayoutTests/fast/events/
                    // https://bugs.webkit.org/show_bug.cgi?id=110742
                    events.webkitEditableContentChanged = updateModel
                } else if (window.MutationEvent) {
                    events.DOMCharacterDataModified = updateModel
                }
                events.input = updateModel
            }
            break
        case 'input':
            if (data.isChanged) {
                events.change = updateModel
            } else {
                events.input = updateModel

                //https://github.com/RubyLouvre/avalon/issues/1368#issuecomment-220503284
                events.compositionstart = openComposition
                events.compositionend = closeComposition
                if (avalon.msie) {
                    events.keyup = updateModelKeyDown
                }
            }
            break
    }

    if (/password|text/.test(dom.type)) {
        events.focus = openCaret //判定是否使用光标修正功能 
        events.blur = closeCaret
        data.getCaret = getCaret
        data.setCaret = setCaret
    }
    for (var name in events) {
        avalon.bind(dom, name, events[name])
    }
}

/* istanbul ignore next */
function updateModelKeyDown(e) {
    var key = e.keyCode
    // ignore
    //    command            modifiers                   arrows
    if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
        return
    updateModel.call(this, e)
}
/* istanbul ignore next */
function openCaret() {
    this.caret = true
}
/* istanbul ignore next */
function closeCaret() {
    this.caret = false
}
function openComposition() {
    this.composing = true
}
/* istanbul ignore next */
function closeComposition(e) {
    this.composing = false
    var elem = this
    setTimeout(function () {
        updateModel.call(elem, e)
    }, 0)

}


markID(openCaret)
markID(closeCaret)
markID(openComposition)
markID(closeComposition)
markID(updateModelKeyDown)
markID(updateModel)

/* istanbul ignore next */
function getCaret(field) {
    var start = NaN
    if (field.setSelectionRange) {
        start = field.selectionStart
    }
    return start
}
/* istanbul ignore next */
function setCaret(field, pos) {
    if (!field.value || field.readOnly)
        return
    field.selectionStart = pos
    field.selectionEnd = pos
}

