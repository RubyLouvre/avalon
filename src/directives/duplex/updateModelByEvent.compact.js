/* 
 * 通过绑定事件同步vmodel
 * 总共有三种方式同步视图
 * 1. 各种事件 input, change, click, propertychange, keydown...
 * 2. value属性重写
 * 3. 定时器轮询
 */
var updateModel = require('./updateModelHandle')
var markID = require('../../seed/lang.share').getShortID
var msie = avalon.msie
var window = avalon.window
var document = avalon.document

function updateModelByEvent(node, vnode) {
    var events = {}
    var data = vnode.duplexData
    data.update = updateModel
    //添加需要监听的事件
    switch (data.type) {
        case 'radio':
            if (vnode.props.type === 'radio') {
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
            if (data.isChanged) {
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

            if (data.isChanged) {
                events.change = updateModel
            } else {

                //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                //http://www.matts411.com/post/internet-explorer-9-oninput/
                if (avalon.msie < 10) {

                    events.propertychange = updateModelHack
                    if (msie > 7) {
                        //IE8的propertychange有BUG,第一次用JS修改值时不会触发,而且你是全部清空value也不会触发
                        events.keyup = updateModel
                        events.keydown = updateModel
                    }
                    if (msie > 8) {
                        //IE9的propertychange不支持自动完成,退格,删除,复制,贴粘,剪切或点击右边的小X的清空操作
                        //它们可以能过window的selectionchange
                        node.valueHijack = updateModel
                        //当你选中一个input value值,将它拖到别处时
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
                    if (!avalon.msie) {
                        //IE11微软拼音好像才会触发compositionstart 不会触发compositionend
                        //https://github.com/RubyLouvre/avalon/issues/1368#issuecomment-220503284
                        events.compositionstart = openComposition
                        events.compositionend = closeComposition
                    }
                }
            }
            break
    }

    if (/password|text/.test(vnode.props.type)) {
        events.focus = openCaret //判定是否使用光标修正功能 
        events.blur = closeCaret
        data.getCaret = getCaret
        data.setCaret = setCaret
    }

    for (var name in events) {
        avalon.bind(node, name, events[name])
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

module.exports = updateModelByEvent