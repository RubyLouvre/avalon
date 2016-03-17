var msie = avalon.msie
var quote = avalon.quote
var markID = require('../../seed/lang.share').getLongID
var document = avalon.document
var refreshData = require('./refreshData')
var refreshView = require('./refreshView')

var evaluatorPool = require('../../strategy/parser/evaluatorPool')

var rchangeFilter = /\|\s*change\b/
var rcheckedType = /^(?:checkbox|radio)$/
var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/


avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, elem) {
        var expr = binding.expr
        var etype = elem.props.type
        //处理数据转换器
        var ptype = binding.param
        var isChecked = ptype === 'checked'

        var ctrl = elem.ctrl = {
            parsers: [],
            formatters: [],
            modelValue: NaN,
            viewValue: NaN,
            type: 'input',
            expr: expr,
            parse: function (val) {
                for (var i = 0, fn; fn = this.parsers[i++]; ) {
                    val = fn.call(this, val)
                }
                return val
            }
        }
        if (isChecked) {
            if (rcheckedType.test(etype)) {
                ctrl.isChecked = true
                ctrl.type = 'radio'
            } else {
                ptype = null
            }
        }

        var parser = avalon.parsers[ptype]

        if (parser) {
            ctrl.parsers.push(parser)
        }

        if (rchangeFilter.test(expr)) {
            expr = expr.replace(rchangeFilter, '')
            if (rnoduplexInput.test(etype)) {
                avalon.warn(etype + '不支持change过滤器')
            } else {
                ctrl.isChanged = true
            }

        }

        if (!/input|textarea|select/.test(etype)) {
            if ('contenteditable' in elem.props) {
                ctrl.type = 'contenteditable'
            }
        } else if (ctrl.type) {
            ctrl.type = etype === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }

        avalon.parseExpr(ctrl, 'duplex')
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                'vnode' + num + '.props["a-duplex"] = ' + quote(ctrl.expr) + ';\n'
    },
    diff: function (cur, pre) {
        if (pre.ctrl && pre.ctrl.set) {
            cur.ctrl = pre.ctrl
        } else {
            if (!cur.type === 'select' && cur.children.length) {
                avalon.Array.merge(cur.children, avalon.lexer(cur.template))
            }
            initDuplexCtrl(cur, pre)
        }

        var ctrl = cur.ctrl
        delete cur.duplexVm

        var value = cur.props.value = ctrl.get(ctrl.vmodel)

        if (!ctrl.elem) {
            var isEqual = false
        } else {
            var preValue = pre.props.value
            if (Array.isArray(value)) {
                isEqual = value + '' === preValue + ''
            } else {
                isEqual = value === preValue
            }
        }

        if (!isEqual) {
            ctrl.modelValue = value
            var afterChange = cur.afterChange || (cur.afterChange = [])
            avalon.Array.ensure(afterChange, this.update)
        }
    },
    update: function (node, vnode) {
        var ctrl = node.__duplex__ = vnode.ctrl
        if (!ctrl.elem) {//这是一次性绑定
            ctrl.elem = node //方便进行垃圾回收
            var events = ctrl.events
            for (var name in events) {
                avalon.bind(node, name, events[name])
                delete events[name]
            }
            if (ctrl.watchValueInTimer) {//chrome 42及以下版本需要这个hack
                node.valueSet = updateModel //#765
                watchValueInTimer(function () {
                    if (!node.caret) {
                        node.valueSet()
                    }
                })
                delete ctrl.watchValueInTimer
            }
        }

        var viewValue = ctrl.modelValue
        //当数据转换器为checked时,一切格式化过滤器都失效
        if (!ctrl.isChecked) {
            var formatters = ctrl.formatters,
                    idx = formatters.length
            while (idx--) {
                viewValue = formatters[idx](viewValue)
            }
        }
        if (ctrl.viewValue !== viewValue) {
            ctrl.viewValue = viewValue
            refreshView[ctrl.type].call(ctrl)
            if (node.caret) {
                setCaret(node, ctrl.caretPos, ctrl.caretPos)
            }
        }
    }
})




function initDuplexCtrl(cur, pre) {
    var ctrl = cur.ctrl = pre.ctrl
    var events = ctrl.events = {}
    ctrl.get = evaluatorPool.get('duplex:' + ctrl.expr)
    ctrl.set = evaluatorPool.get('duplex:set:' + ctrl.expr)
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
                events.change = updateModel
            }
            break
        case 'input':
            if (ctrl.isChanged) {
                events.change = updateModel
            } else {
                if (!msie) { // W3C
                    events.input = updateModel
                    events.compositionstart = openComposition
                    events.compositionend = closeComposition
                    events.DOMAutoComplete = updateModel
                } else {
// IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                    if (msie > 8) {
                        if (msie === 9) {
//IE9删除字符后再失去焦点不会同步 #1167
                            events.keyup = updateModel
                        }
//IE9使用propertychange无法监听中文输入改动
                        events.input = updateModel
                    } else {
//onpropertychange事件无法区分是程序触发还是用户触发
//IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                        events.propertychange = updateModelHack
                    }
                    events.dragend = updateModelDelay
                    //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                    //http://www.matts411.com/post/internet-explorer-9-oninput/
                }
            }

            break
    }
    if (ctrl.type === 'input' && !rnoduplexInput.test(cur.props.type)) {
        if (cur.props.type !== 'hidden') {
            events.focus = openCaret
            events.blur = closeCaret
        }
        cur.watchValueInTimer = true
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

function closeComposition() {
    this.composing = false
}

markID(openCaret)
markID(closeCaret)
markID(openComposition)
markID(closeComposition)
markID(updateModel)
markID(updateModelHack)
markID(updateModelDelay)


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
