//双工绑定
var builtin = require("../base/builtin")
var W3C = builtin.W3C
var document = builtin.document
var msie = builtin.msie
var markID = builtin.markID
var pushArray = builtin.pushArray
var getBindingValue = require("./var/getBindingValue")
var createVirtual = require("../strategy/createVirtual")

var rcheckedType = /^(?:checkbox|radio)$/
var rcheckedFilter = /\|\s*checked\b/
var rchangeFilter = /\|\s*change\b/

var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/
var oldName = {
    "radio": "checked",
    "number": "numeric",
    "bool": "boolean",
    "text": "string"
}
avalon.directive("duplex", {
    priority: 2000,
    parse: function (binding, num, elem) {
        var expr = binding.expr
        var elemType = elem.props.type
        if (rcheckedFilter.test(expr)) {
            if (rcheckedType.test(elemType)) {
                elem.props.xtype = "checked"
            } else {
                avalon.log("只有radio与checkbox才能用checked过滤器")
                expr = expr.replace(rcheckedFilter, "")
            }
        }
        if (rchangeFilter.test(binding.expr)) {
            if (rnoduplexInput.test(elemType)) {
                avalon.log(elemType + "不支持change过滤器")
                expr = expr.replace(rchangeFilter, "")
            } else {
                elem.props.xtype = "change"
            }
        }
        binding.expr = expr
        parse(binding)
        return "vnode" + num + ".duplexVm = __vmodel__;\n" +
                "vnode" + num + ".props['av-attr'] = " + quote(binding.exr) + ";\n"
    },
    diff: function (elem, pre, type) {

        elem.props.xtype = pre.props.xtype
        if (pre.duplexData) {
            elem.duplexData = pre.duplexData
        } else {


            var elemType = elem.props.type
            //获取controll
            if (!elem.props.xtype) {
                elem.props.xtype = elem.type === "select" ? "select" :
                        elemType === "checkbox" ? "checkbox" :
                        elemType === "radio" ? "radio" :
                        /|\s*change/.test(value) ? "change" :
                        "input"
            }
            var duplexData = {}
            switch (elem.props.xtype) {
                case "checked"://当用户指定了checked过滤器
                    duplexData.click = duplexChecked
                    break
                case "radio":
                    duplexData.click = duplexValue
                    break
                case "checkbox":
                    duplexData[msie < 9 ? "click" : "change"] = duplexCheckBox
                    break
                case "change":
                    duplexData.change = duplexValue
                    break
                case "select":
                    if (!elem.children.length) {
                        pushArray(elem.children, createVirtual(elem.template))
                    }
                    duplexData.change = duplexSelect
                    break
                case "input":
                    if (!msie) { // W3C
                        duplexData.input = duplexValue
                        duplexData.compositionstart = compositionStart
                        duplexData.compositionend = compositionEnd
                        duplexData.DOMAutoComplete = duplexValue
                    } else {
                        // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        if (msie > 8) {
                            if (msie === 9) {
                                //IE9删除字符后再失去焦点不会同步 #1167
                                duplexData.keyup = duplexValue
                            }
                            //IE9使用propertychange无法监听中文输入改动
                            duplexData.input = duplexValue
                        } else {
                            //onpropertychange事件无法区分是程序触发还是用户触发
                            //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                            duplexData.propertychange = duplexValueHack
                        }
                        duplexData.dragend = duplexDragEnd
                        //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                        //http://www.matts411.com/post/internet-explorer-9-oninput/
                    }
                    break

            }

            if (elem.props.xtype === "input" && !rnoduplexInput.test(elemType)) {
                if (elemType !== "hidden") {
                    duplexData.focus = duplexFocus
                    duplexData.blur = duplexBlur
                }
                elem.watchValueInTimer = true
            }
            var expr = elem.props["av-duplex"]
            var evaluatorPool = parser.caches
            duplexData.getter = evaluatorPool.get("duplex:" + expr)
            duplexData.setter = evaluatorPool.get("duplex:" + expr + ":setter")

            elem.duplexData = duplexData
            elem.dispose = disposeDuplex

        }
        duplexData.vmode = elem.duplexVm
        if (!duplexData.elem) {
            var isEqual = false
        } else {
            var value = elem.props.value = duplexData.getter(duplexData.vmode, duplexData.elem)
            var preValue = pre.props.value
            if (Array.isArray(value)) {
                isEqual = value + "" === preValue + ""
            } else {
                isEqual = value === preValue
            }
        }

        if (!isEqual) {
            var afterChange = elem.afterChange || (elem.afterChange = [])
            if (elem.type === "select") {
                avalon.Array.ensure(afterChange, duplexSelectAfter)
            }
            avalon.Array.ensure(afterChange, this.update)
        }

    },
    update: function (node, vnode) {
        var binding = vnode.binding

        var curValue = vnode.value

        vnode.dom = node //方便进行垃圾回收

        if (vnode.props.xtype === "checkbox") {
            node.duplexSet = function (val, checked) {
                var array = vnode.value
                if (!Array.isArray(array)) {
                    log("ms-duplex应用于checkbox上要对应一个数组")
                    array = [array]
                }
                var method = checked ? "ensure" : "remove"
                avalon.Array[method](array, val)
                return array
            }
        } else {
            node.duplexSet = function (value) {
                binding.setter(binding.vmodel, value, node)
            }
        }

        node.duplexGet = function (value) {
            return binding.getter(binding.vmodel, value, node)
        }

        node.changed = binding.changed

        var events = vnode.duplexData
        if (events) {
            for (var eventName in events) {
                avalon.bind(node, eventName, events[eventName])
            }
            delete vnode.duplexData
        }
        if (vnode.watchValueInTimer) {
            node.valueSet = duplexValue //#765
            watchValueInTimer(function () {
                if (!vnode.disposed) {
                    if (!node.msFocus) {
                        node.valueSet()
                    }
                } else {
                    return false
                }
            })
            delete vnode.watchValueInTimer
        }

        switch (vnode.props.xtype) {
            case "input":
            case "change":
                if (curValue !== node.oldValue) {
                    node.value = curValue
                }
                break
            case "checked":
            case "radio":
                curValue = vnode.props.xtype === "checked" ? !!curValue :
                        curValue + "" === node.value
                node.oldValue = curValue
                if (msie === 6) {
                    setTimeout(function () {
                        //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                        //并且要先设置defaultChecked后设置checked
                        //并且必须设置延迟
                        node.defaultChecked = curValue
                        node.checked = curValue
                    }, 31)
                } else {
                    node.checked = curValue
                }
                break
            case "checkbox":
                var array = [].concat(curValue) //强制转换为数组
                curValue = node.duplexGet(node.value)
                node.checked = array.indexOf(curValue) > -1
                break
            case "select":
                //在afterChange中处理
                break
        }
    }
})

function disposeDuplex() {
    var elem = this.dom
    if (elem) {
        elem.oldValue = elem.valueSet =
                elem.duplexSet = elem.duplexGet = void 0
        avalon.unbind(elem)
        this.dom = null
    }
}
function compositionStart() {
    this.composing = true
}
function compositionEnd() {
    this.composing = false
}
function duplexFocus() {
    this.msFocus = true
}
function duplexBlur() {
    this.msFocus = false
}

function duplexChecked() {
    var elem = this
    var lastValue = elem.oldValue = elem.duplexGet()
    elem.duplexSet(lastValue)
}


function duplexValueHack(e) {
    if (e.propertyName === "value") {
        duplexValue.call(this, e)
    }
}

function duplexDragEnd(e) {
    var elem = this
    setTimeout(function () {
        duplexValue.call(elem, e)
    }, 17)
}

function duplexCheckBox() {
    var elem = this
    var val = elem.duplexGet(elem.value)
    var array = elem.duplexSet(val, elem.checked)
}
function duplexValue(e) { //原来的updateVModel
    var elem = this, fixCaret
    var val = elem.value //防止递归调用形成死循环
    if (elem.composing || val === elem.oldValue)
        return
    if (elem.msFocus) {
        try {
            var pos = getCaret(elem)
            if (pos.start === pos.end) {
                pos = pos.start
                fixCaret = true
            }
        } catch (e) {
            avalon.log("fixCaret", e)
        }
    }
    var lastValue = elem.duplexGet(val)
    try {
        elem.value = elem.oldValue = lastValue + ""
        if (fixCaret) {
            setCaret(elem, pos, pos)
        }
        elem.duplexSet(lastValue)
    } catch (ex) {
        avalon.log(ex)
    }
}

//用于更新VM
function duplexSelect() {
    var elem = this
    var val = avalon(elem).val() //字符串或字符串数组
    if (Array.isArray(val)) {
        val = val.map(function (v) {
            return elem.duplexGet(v)
        })
    } else {
        val = elem.duplexGet(val)
    }
    if (val + "" !== elem.oldValue) {
        try {
            elem.duplexSet(val)
        } catch (ex) {
            log(ex)
        }
    }
    elem.duplexSet(val)
}

function duplexSelectAfter(elem, vnode) {
    avalon(elem).val(vnode.value)
}


duplexSelectAfter.priority = 2001

markID(compositionStart)
markID(compositionEnd)
markID(duplexFocus)
markID(duplexBlur)
markID(duplexValue)
markID(duplexValueHack)
markID(duplexDragEnd)
markID(duplexCheckBox)
markID(duplexSelect)

if (msie) {
    avalon.bind(document, "selectionchange", function (e) {
        var el = document.activeElement || {}
        if (!el.msFocus && el.valueSet) {
            el.valueSet()
        }
    })
}


var TimerID, ribbon = []

avalon.tick = function (fn) {
    if (ribbon.push(fn) === 1) {
        TimerID = setInterval(ticker, 60)
    }
}

function ticker() {
    for (var n = ribbon.length - 1; n >= 0; n--) {
        var el = ribbon[n]
        if (el() === false) {
            ribbon.splice(n, 1)
        }
    }
    if (!ribbon.length) {
        clearInterval(TimerID)
    }
}

var watchValueInTimer = avalon.noop

        ;
(function () { // jshint ignore:line
    try { //#272 IE9-IE11, firefox
        var setters = {}
        var aproto = HTMLInputElement.prototype
        var bproto = HTMLTextAreaElement.prototype
        function newSetter(value) { // jshint ignore:line
            setters[this.tagName].call(this, value)
            if (!this.msFocus && this.valueSet) {
                this.valueSet()
            }
        }
        var inputProto = HTMLInputElement.prototype
        Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
        setters["INPUT"] = Object.getOwnPropertyDescriptor(aproto, "value").set

        Object.defineProperty(aproto, "value", {
            set: newSetter
        })
        setters["TEXTAREA"] = Object.getOwnPropertyDescriptor(bproto, "value").set
        Object.defineProperty(bproto, "value", {
            set: newSetter
        })
    } catch (e) {
        //在chrome 43中 ms-duplex终于不需要使用定时器实现双向绑定了
        // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
        // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
        watchValueInTimer = avalon.tick
    }
})()

// jshint ignore:line
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
        range.moveStart("character", begin)
        range.select()
    } else {
        ctrl.selectionStart = begin
        ctrl.selectionEnd = end
    }
}

//处理 货币 http://openexchangerates.github.io/accounting.js/