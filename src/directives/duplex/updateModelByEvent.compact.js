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
                if (msie) {//处理输入法问题
                    events.keyup = updateModelKeyDown
                }

                if (msie < 9) {
                    events.propertychange = updateModelHack
                    events.paste = updateModelDelay
                    events.cut = updateModelDelay
                } else {
                    events.input = updateModel
                }
                //IE6-8的propertychange有BUG,第一次用JS修改值时不会触发,而且你是全部清空value也不会触发
                //IE9的propertychange不支持自动完成,退格,删除,复制,贴粘,剪切或点击右边的小X的清空操作
                //IE11微软拼音好像才会触发compositionstart 不会触发compositionend
                //https://github.com/RubyLouvre/avalon/issues/1368#issuecomment-220503284
                if(!msie || msie > 9){
                    events.compositionstart = openComposition
                    events.compositionend = closeComposition
                }
                if (!msie) {

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
    }, 0)
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
    updateModelDelay.call(this, e)
}

function updateModelKeyDown(e) {
    var key = e.keyCode
    // ignore
    //    command            modifiers                   arrows
    if (key === 91 || (15 < key && key < 19) || (37 <= key && key <= 40))
        return
    updateModel.call(this, e)
}

markID(openCaret)
markID(closeCaret)
markID(openComposition)
markID(closeComposition)
markID(updateModel)
markID(updateModelHack)
markID(updateModelDelay)
markID(updateModelKeyDown)

//IE6-8要处理光标时需要异步
var mayBeAsync = function (fn) {
    setTimeout(fn, 0)
}
var setCaret = function (target, cursorPosition) {
    var range
    if (target.createTextRange) {
        mayBeAsync(function () {
            target.focus()
            range = target.createTextRange()
            range.collapse(true)
            range.moveEnd('character', cursorPosition)
            range.moveStart('character', cursorPosition)
            range.select()
        })
    } else {
        target.focus()
        if (target.selectionStart !== undefined) {
            target.setSelectionRange(cursorPosition, cursorPosition)
        }
    }
}

var getCaret = function (target) {
    var start = 0
    var normalizedValue
    var range
    var textInputRange
    var len
    var endRange

    if (typeof target.selectionStart == "number" && typeof target.selectionEnd == "number") {
        start = target.selectionStart
    } else {
        range = document.selection.createRange()

        if (range && range.parentElement() == target) {
            len = target.value.length
            normalizedValue = target.value.replace(/\r\n/g, "\n")

            textInputRange = target.createTextRange()
            textInputRange.moveToBookmark(range.getBookmark())

            endRange = target.createTextRange()
            endRange.collapse(false)

            if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                start = len
            } else {
                start = -textInputRange.moveStart("character", -len)
                start += normalizedValue.slice(0, start).split("\n").length - 1
            }
        }
    }

    return start
}

module.exports = updateModelByEvent