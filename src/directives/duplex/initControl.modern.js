var window = avalon.window
var document = avalon.document

var refreshModel = require('./refreshModel')
var markID = require('../../seed/lang.share').getLongID
var evaluatorPool = require('../../strategy/parser/evaluatorPool')

function initControl(cur, pre) {
    var ctrl = cur.ctrl = pre.ctrl

    ctrl.update = updateModel
    ctrl.updateCaret = setCaret
    ctrl.get = evaluatorPool.get('duplex:' + ctrl.expr)
    ctrl.set = evaluatorPool.get('duplex:set:' + ctrl.expr)
    var format = evaluatorPool.get('duplex:format:' + ctrl.expr)
    if (format) {
        ctrl.formatters.push(function (v) {
            return format(ctrl.vmodel, v)
        })
    }
    ctrl.vmodel = cur.duplexVm

    var events = ctrl.events = {}
//添加需要监听的事件
    switch (ctrl.type) {
        case 'radio':
            if (cur.props.type === 'radio') {
                events.click = updateModel
            } else {
                events.change = updateModel
            }
            break
        case 'checkbox':
        case 'select':
            events.change = updateModel
            break
        case 'contenteditable':
            if (ctrl.isChanged) {
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
            if (ctrl.isChanged) {
                events.change = updateModel
            } else {

                events.input = updateModel

                events.compositionstart = openComposition
                events.compositionend = closeComposition
            }
            break
    }

    if (/password|text/.test(cur.props.type)) {
        events.focus = openCaret
        events.blur = closeCaret
    }

}


function updateModel() {
    var elem = this
    var ctrl = this.__duplex__
    if (elem.composing || elem.value === ctrl.lastViewValue)
        return
    if (elem.caret) {
        try {
            var pos = getCaret(elem)
            if (pos.start === pos.end) {
                ctrl.caretPos = pos.start
            }
        } catch (e) {
            avalon.warn('fixCaret error', e)
        }
    }
    if (ctrl.debounceTime > 4) {
        var timestamp = new Date()
        var left = timestamp - ctrl.time || 0
        ctrl.time = timestamp
        if (left >= ctrl.debounceTime) {
            refreshModel[ctrl.type].call(ctrl)
        } else {
            clearTimeout(ctrl.debounceID)
            ctrl.debounceID = setTimeout(function () {
                refreshModel[ctrl.type].call(ctrl)
            }, left)
        }
    } else {
        refreshModel[ctrl.type].call(ctrl)
    }
}



function openCaret() {
    this.caret = true
}

function closeCaret() {
    this.caret = false
}
function openComposition() {
    this.composing = true
}

function closeComposition(e) {
    this.composing = false
    updateModel.call(this, e)
}


markID(openCaret)
markID(closeCaret)
markID(openComposition)
markID(closeComposition)
markID(updateModel)



function getCaret(ctrl) {
    var start = NaN, end = NaN
    if (ctrl.setSelectionRange) {
        start = ctrl.selectionStart
        end = ctrl.selectionEnd
    }
    return {
        start: start,
        end: end
    }
}

function setCaret(ctrl, begin, end) {
    if (!ctrl.value || ctrl.readOnly)
        return
    ctrl.selectionStart = begin
    ctrl.selectionEnd = end
}

module.exports = initControl