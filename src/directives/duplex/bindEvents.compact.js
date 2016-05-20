var msie = avalon.msie
var window = avalon.window
var document = avalon.document
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
                events[msie < 9 ? 'click' : 'change'] = updateModel
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
                if (avalon.modern) {
                    if (window.webkitURL) {
                        // http://code.metager.de/source/xref/WebKit/LayoutTests/fast/events/
                        // https://bugs.webkit.org/show_bug.cgi?id=110742
                        events.webkitEditableContentChanged = updateModel
                    } else if (window.MutationEvent) {
                        events.DOMCharacterDataModified = updateModel
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
            if (field.isChanged) {
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
                    if (msie > 7 ) {
                        // IE 8 has a bug where it fails to fire 'propertychange' on the first update following a value change from
                        // JavaScript code. It also doesn't fire if you clear the entire value. To fix this, we bind to the following
                        // events too.
                        events.keyup = updateModel      // A single keystoke
                        events.keydown = updateModel    // The first character when a key is held down
                    }
                    if (msie > 8) {
                        // Internet Explorer 9 doesn't fire the 'input' event when deleting text, including using
                        // the backspace, delete, or field-x keys, clicking the 'x' to clear the input, dragging text
                        // out of the field, and cutting or deleting text using the context menu. 'selectionchange'
                        // can detect all of those except dragging text out of the field, for which we use 'dragend'.
                        // These are also needed in IE8 because of the bug described above.
                        cur.valueHijack = updateModel  // 'selectionchange' covers cut, paste, drop, delete, etc.
                        events.dragend = updateModelDelay
                    }
                } else {
                    events.input = updateModel
                    //https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypedArray
                    //如果当前浏览器支持Int8Array,那么我们就不需要以下这些事件来打补丁了
                    if (!/\[native code\]/.test(window.Int8Array)) {
                        events.keydown = updateModelKeyDown //safari < 5 opera < 11
                        events.paste = updateModelDelay//safari < 5
                        events.cut = updateModelDelay//safari < 5 
                        if (window.netscape) {
                            // Firefox <= 3.6 doesn't fire the 'input' event when text is filled in through autocomplete
                            events.DOMAutoComplete = updateModel
                        }
                    }
                    if(!avalon.msie){
                    //https://github.com/RubyLouvre/avalon/issues/1368#issuecomment-220503284
                        events.compositionstart = openComposition
                        events.compositionend = closeComposition
                    }

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
    if (elem.composing)
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

function getCaret(field) {
    var start = NaN, end = NaN
    if (field.setSelectionRange) {
        start = field.selectionStart
        end = field.selectionEnd
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

function setCaret(field, begin, end) {
    if (!field.value || field.readOnly)
        return
    if (field.createTextRange) {//IE6-8
        var range = field.createTextRange()
        range.collapse(true)
        range.moveStart('character', begin)
        range.select()
    } else {
        field.selectionStart = begin
        field.selectionEnd = end
    }
}

module.exports = initControl