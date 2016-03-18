var markID = require('../../seed/lang.share').getLongID
var document = avalon.document
var refreshData = require('./refreshData')
var msie = avalon.msie

function initMonitor(cur, pre) {
    var ctrl = cur.ctrl = pre.ctrl

    ctrl.update = updateModel
    ctrl.updateCaret = setCaret
    ctrl.get = evaluatorPool.get('duplex:' + ctrl.expr)
    ctrl.set = evaluatorPool.get('duplex:set:' + ctrl.expr)
    var format = evaluatorPool.get('duplex:format:' + ctrl.expr)
    ctrl.formatters.push(format)

    var events = ctrl.events = {}
//添加需要监听的事件
    switch (ctrl.type) {
        case 'radio':
            if (cur.type === 'radio') {
                events.click = updateModel
            } else {
                events[msie < 9 ? 'click' : 'change'] = updateModel
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
                if (avalon.modern) {
                    if ("MutationEvent" in window) {
                        events.DOMCharacterDataModified = updateModel
                    }
                    if ('webkitHidden' in document || window.webkitURL || window.chrome) {
                        // http://code.metager.de/source/xref/WebKit/LayoutTests/fast/events/
                        // https://bugs.webkit.org/show_bug.cgi?id=110742
                        events.webkitEditableContentChanged = updateModel
                    }
                    events.input = updateModel
                } else {
                  
                    events.keydown = updateModelKeyDown
                    events.paste = updateModelDelay
                    events.cut = updateModelDelay
                    events.focus = closeComposition
                    events.blur = openComposition

                }

            }
            break
        case 'input':
            if (ctrl.isChanged) {
                events.change = updateModel
            } else {
                //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                //http://www.matts411.com/post/internet-explorer-9-oninput/
                if (avalon.msie < 10) {
                    // Internet Explorer <= 8 doesn't support the 'input' event, but does include 'propertychange' that fires whenever
                    // any property of an element changes. Unlike 'input', it also fires if a property is changed from JavaScript code,
                    // but that's an acceptable compromise for this binding. IE 9 does support 'input', but since it doesn't fire it
                    // when using autocomplete, we'll use 'propertychange' for it also.
                    events.propertychange = updateModelHack
                    if (msie == 8) {
                        // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                        // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                        // events too.
                        events.keyup = updateModel      // A single keystoke
                        events.keydown = updateModel    // The first character when a key is held down
                    }
                    if (msie >= 8) {
                        // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                        // the backspace, delete, or ctrl-x keys, clicking the 'x' to clear the input, dragging text
                        // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                        // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                        // These are also needed in IE8 because of the bug described above.
                        ctrl.elem.valueSet = updateModel  // 'selectionchange' covers cut, paste, drop, delete, etc.
                        events.dragend = updateModelDelay
                    }
                } else {
                    events.input = updateModel
                    events.keydown = updateModelKeyDown
                    events.paste = updateModelDelay
                    events.cut = updateModelDelay
                    // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                    events.DOMAutoComplete = updateModel

                    events.compositionstart = openComposition
                    events.compositionend = closeComposition

                }
            }
            break
    }

    if (/password|text/.test(ctrl.props.type)) {
        events.focus = openCaret
        events.blur = closeCaret
    }

}


function updateModel() {
    var elem = this
    var ctrl = this.__duplex__
    if (elem.composing || elem.value === ctrl.viewValue)
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
    refreshData[ctrl.type].call(ctrl)
}


function updateModelHack(e) {
    if (e.propertyName === 'value') {
        updateModel.call(this, e)
    }
}

function updateModelDelay(e) {
    var elem = this
    setTimeout(function () {
        updateModel.call(elem, e)
    }, 17)
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
}
function updateModelKeyDown(e) {
    var key = e.keyCode;
    // ignore
    //    command            modifiers                   arrows
    if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
        return
    updateModelDelay.call(this, e)
}

markID(openCaret)
markID(closeCaret)
markID(openComposition)
markID(closeComposition)
markID(updateModel)
markID(updateModelHack)
markID(updateModelDelay)
markID(updateModelKeyDown)

if (msie >= 8 && msie < 10) {
    avalon.bind(document, 'selectionchange', function (e) {
        var el = document.activeElement || {}
        if (!el.caret && el.valueHijack) {
            el.valueHijack()
        }
    })
}

function getCaret(ctrl) {
    var start = NaN, end = NaN
    if (ctrl.setSelectionRange) {
        start = ctrl.selectionStart
        end = ctrl.selectionEnd
    } else if (document.selection && document.selection.createRange) {
        var range = document.selection.createRange()
        start = 0 - range.duplicate().moveStart('character', -100000)
        end = start + range.text.length
    }
    return {
        start: start,
        end: end
    }
}

function setCaret(ctrl, begin, end) {
    if (!ctrl.value || ctrl.readOnly)
        return
    if (ctrl.createTextRange) {//IE6-8
        var range = ctrl.createTextRange()
        range.collapse(true)
        range.moveStart('character', begin)
        range.select()
    } else {
        ctrl.selectionStart = begin
        ctrl.selectionEnd = end
    }
}

module.export = initMonitor