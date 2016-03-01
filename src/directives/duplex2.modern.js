

//双工绑定
var builtin = require("../base/builtin")
var W3C = builtin.W3C
var document = builtin.document
var msie = builtin.msie
var markID = builtin.markID
var pushArray = builtin.pushArray
var quote = builtin.quote

var createVirtual = require("../strategy/createVirtual")
var parse = require("../parser/parser")

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
var getset = {
    getter: 1,
    setter: 1,
    elem: 1,
    vmodel: 1,
    vnode: 1,
    get: 1,
    set: 1,
    watchValueInTimer: 1
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
        if (rchangeFilter.test(expr)) {
            if (rnoduplexInput.test(elemType)) {
                avalon.log(elemType + "不支持change过滤器")
                expr = expr.replace(rchangeFilter, "")
            } else {
                elem.props.xtype = "change"
            }
        }
        binding.expr = expr
        parse(binding, "duplex")
        return "vnode" + num + ".duplexVm = __vmodel__;\n" +
                "vnode" + num + ".props['av-duplex'] = " + quote(binding.expr) + ";\n"
    },
    diff: function (elem, pre) {

        elem.props.xtype = pre.props.xtype
        if (pre.duplexData && pre.duplexData.set) {
            elem.duplexData = pre.duplexData
        } else {

            var elemType = elem.props.type
            //获取controll
            if (!elem.props.xtype) {
                elem.props.xtype =
                        elemType === "select" ? "select" :
                        elemType === "checkbox" ? "checkbox" :
                        elemType === "radio" ? "radio" :
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
                    duplexData.change = duplexCheckBox
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

                        //IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        //IE9删除字符后再失去焦点不会同步 #1167
                        duplexData.keyup = duplexValue
                        //IE9使用propertychange无法监听中文输入改动
                        duplexData.input = duplexValue
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
                duplexData.watchValueInTimer = true
            }

            duplexData.vmodel = elem.duplexVm
            duplexData.vnode = elem
            duplexData.set = function (val, checked) {
                var vnode = this.vnode
                if (typeof vnode.props.xtype === "checkbox") {
                    var array = vnode.props.value
                    if (!Array.isArray(array)) {
                        log("ms-duplex应用于checkbox上要对应一个数组")
                        array = [array]
                    }
                    var method = checked ? "ensure" : "remove"
                    avalon.Array[method](array, val)
                } else {
                    this.setter(this.vmodel, val, this.elem)
                }
            }

            duplexData.get = function (val) {
                return this.getter(this.vmodel, val, this.elem)
            }

            var evaluatorPool = parse.caches
            var expr = elem.props["av-duplex"]
            duplexData.getter = evaluatorPool.get("duplex:" + expr)
            duplexData.setter = evaluatorPool.get("duplex:" + expr + ":setter")
            elem.duplexData = duplexData
            elem.dispose = disposeDuplex

        }

        var value = elem.props.value = duplexData.getter(duplexData.vmodel)
        if (!duplexData.elem) {
            var isEqual = false
        } else {

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
        var binding = node.duplexData = vnode.duplexData
        binding.elem = node //方便进行垃圾回收

        if (binding) {//这是一次性绑定
            for (var eventName in binding) {
                var callback = binding[eventName]
                if (!getset[eventName] && typeof callback === "function") {
                    avalon.bind(node, eventName, binding[eventName])
                    delete binding[eventName]
                }
            }
        }

        if (binding.watchValueInTimer) {//chrome 42及以下版本需要这个hack
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
            delete binding.watchValueInTimer
        }

        var curValue = vnode.props.value

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
                node.checked = curValue

                break
            case "checkbox":
                var array = [].concat(curValue) //强制转换为数组
                curValue = node.duplexData.get(node.value)
                node.checked = array.indexOf(curValue) > -1
                break
            case "select":
                //在afterChange中处理
                break
        }
    }
})

function disposeDuplex() {
    var elem = this.duplexData.elem
    if (elem) {
        elem.oldValue = elem.valueSet = elem.duplexData = void 0
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
    var lastValue = elem.oldValue = elem.duplexData.get(elem.checked)
    elem.duplexData.set(lastValue)
}


function duplexDragEnd(e) {
    var elem = this
    setTimeout(function () {
        duplexValue.call(elem, e)
    }, 17)
}

function duplexCheckBox() {
    var elem = this
    var val = elem.duplexData.get(elem.value)
    elem.duplexData.set(val, elem.checked)
}
function duplexValue() { //原来的updateVModel
    var elem = this, fixCaret
    var val = elem.value //防止递归调用形成死循环
    if (elem.composing || val === elem.oldValue)
        return
    if (elem.msFocus) {
        try {
           var start = elem.selectionStart
            var end = elem.selectionEnd
            if (start === end) {
                var pos = start
                fixCaret = true
            }
        } catch (e) {
            avalon.log("fixCaret", e)
        }
    }
    var lastValue = elem.duplexData.get(val)
    try {
        elem.value = elem.oldValue = lastValue + ""
        if (fixCaret && !elem.readOnly) {
            elem.selectionStart = elem.selectionEnd = pos
        }
        elem.duplexData.set(lastValue)
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
            return elem.duplexData.get(v)
        })
    } else {
        val = elem.duplexData.get(val)
    }
    if (val + "" !== elem.oldValue) {
        try {
            elem.duplexData.set(val)
        } catch (ex) {
            log(ex)
        }
    }
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



//处理 货币 http://openexchangerates.github.io/accounting.js/
