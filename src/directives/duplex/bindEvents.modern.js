var window = avalon.window

var refreshModel = require('./refreshModel')
var markID = require('../../seed/lang.share').getShortID

function initControl(cur) {
    var field = cur.field
    field.update = updateModel
    field.updateCaret = setCaret
    field.get = cur.props['data-duplex-get']
    field.set = cur.props['data-duplex-set']
    var format = cur.props['data-duplex-format']
    if (format) {
        field.formatters.push(function (v) {
            return format(field.vmodel, v)
        })
    }

    field.vmodel = cur.duplexVm

    var events = field.events = {}
//添加需要监听的事件
    switch (field.type) {
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
            if (field.isChanged) {
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
            if (field.isChanged) {
                events.change = updateModel
            } else {
                events.input = updateModel
                if(!avalon.msie){
                //https://github.com/RubyLouvre/avalon/issues/1368#issuecomment-220503284
                    events.compositionstart = openComposition
                    events.compositionend = closeComposition
                }
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
    var field = this._ms_field_
    if (elem.composing || elem.value === field.lastViewValue)
        return
    if (elem.caret) {
        try {
            var pos = getCaret(elem)
            if (pos.start === pos.end || pos.start + 1 === pos.end) {
                field.caretPos = pos
            }
        } catch (e) {
            avalon.warn('fixCaret error', e)
        }
    }
    if (field.debounceTime > 4) {
        var timestamp = new Date()
        var left = timestamp - field.time || 0
        field.time = timestamp
        if (left >= field.debounceTime) {
            refreshModel[field.type].call(field)
        } else {
            clearTimeout(field.debounceID)
            field.debounceID = setTimeout(function () {
                refreshModel[field.type].call(field)
            }, left)
        }
    } else {
        refreshModel[field.type].call(field)
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



function getCaret(field) {
    var start = NaN, end = NaN
    if (field.setSelectionRange) {
        start = field.selectionStart
        end = field.selectionEnd
    }
    return {
        start: start,
        end: end
    }
}

function setCaret(field, begin, end) {
    if (!field.value || field.readOnly)
        return
    field.selectionStart = begin
    field.selectionEnd = end
}

module.exports = initControl