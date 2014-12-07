//双工绑定
var duplexBinding = bindingHandlers.duplex = function(data, vmodels) {
    var elem = data.element,
            hasCast
    parseExprProxy(data.value, vmodels, data, 0, 1)

    data.changed = getBindingCallback(elem, "data-duplex-changed", vmodels) || noop
    if (data.evaluator && data.args) {
        var params = []
        var casting = oneObject("string,number,boolean,checked")
        if (elem.type === "radio" && data.param === "") {
            data.param = "checked"
        }
        if (elem.msData) {
            elem.msData["ms-duplex"] = data.value
        }
        data.param.replace(/\w+/g, function(name) {
            if (/^(checkbox|radio)$/.test(elem.type) && /^(radio|checked)$/.test(name)) {
                if (name === "radio")
                    log("ms-duplex-radio已经更名为ms-duplex-checked")
                name = "checked"
                data.isChecked = true
            }
            if (name === "bool") {
                name = "boolean"
                log("ms-duplex-bool已经更名为ms-duplex-boolean")
            } else if (name === "text") {
                name = "string"
                log("ms-duplex-text已经更名为ms-duplex-string")
            }
            if (casting[name]) {
                hasCast = true
            }
            avalon.Array.ensure(params, name)
        })
        if (!hasCast) {
            params.push("string")
        }
        data.param = params.join("-")
        data.bound = function(type, callback) {
            if (elem.addEventListener) {
                elem.addEventListener(type, callback, false)
            } else {
                elem.attachEvent("on" + type, callback)
            }
            var old = data.rollback
            data.rollback = function() {
                avalon.unbind(elem, type, callback)
                old && old()
            }
        }
        for (var i in avalon.vmodels) {
            var v = avalon.vmodels[i]
            v.$fire("avalon-ms-duplex-init", data)
        }
        var cpipe = data.pipe || (data.pipe = pipe)
        cpipe(null, data, "init")
        var tagName = elem.tagName
        duplexBinding[tagName] && duplexBinding[tagName](elem, data.evaluator.apply(null, data.args), data)
    }
}
//不存在 bindingExecutors.duplex
function fixNull(val) {
    return val == null ? "" : val
}
avalon.duplexHooks = {
    checked: {
        get: function(val, data) {
            return !data.element.oldValue
        }
    },
    string: {
        get: function(val) { //同步到VM
            return val
        },
        set: fixNull
    },
    "boolean": {
        get: function(val) {
            return val === "true"
        },
        set: fixNull
    },
    number: {
        get: function(val) {
            return isFinite(val) ? parseFloat(val) || 0 : val
        },
        set: fixNull
    }
}

function pipe(val, data, action, e) {
    data.param.replace(/\w+/g, function(name) {
        var hook = avalon.duplexHooks[name]
        if (hook && typeof hook[action] === "function") {
            val = hook[action](val, data)
        }
    })
    return val
}
function IE() {
    if (window.VBArray) {
        var mode = document.documentMode
        return mode ? mode : window.XMLHttpRequest ? 7 : 6
    } else {
        return 0
    }
}
var IEVersion = IE()
if (IEVersion) {
    avalon.bind(DOC, "selectionchange", function(e) {
        var el = DOC.activeElement
        if (el && typeof el.avalonSelectionChange === "function") {
            el.avalonSelectionChange()
        }
    })
}


//如果一个input标签添加了model绑定。那么它对应的字段将与元素的value连结在一起
//字段变，value就变；value变，字段也跟着变。默认是绑定input事件
duplexBinding.INPUT = function(element, evaluator, data) {
    var type = element.type,
            bound = data.bound,
            $elem = avalon(element),
            composing = false

    function callback(value) {
        data.changed.call(this, value, data)
    }

    function compositionStart() {
        composing = true
    }

    function compositionEnd() {
        composing = false
    }
    //当value变化时改变model的值

    function updateVModel() {
        if (composing) //处理中文输入法在minlengh下引发的BUG
            return
        var val = element.oldValue = element.value //防止递归调用形成死循环
        var lastValue = data.pipe(val, data, "get")
        if ($elem.data("duplex-observe") !== false) {
            evaluator(lastValue)
            callback.call(element, lastValue)
            if ($elem.data("duplex-focus")) {
                avalon.nextTick(function() {
                    element.focus()
                })
            }
        }
    }

    //当model变化时,它就会改变value的值
    data.handler = function() {
        var val = data.pipe(evaluator(), data, "set")
        if (val !== element.value) {
            element.value = val
        }
    }
    if (data.isChecked || element.type === "radio") {
        var IE6 = IEVersion === 6
        updateVModel = function() {
            if ($elem.data("duplex-observe") !== false) {
                var lastValue = data.pipe(element.value, data, "get")
                evaluator(lastValue)
                callback.call(element, lastValue)
            }
        }
        data.handler = function() {
            var val = evaluator()
            var checked = data.isChecked ? !!val : val + "" === element.value
            element.oldValue = checked
            if (IE6) {
                setTimeout(function() {
                    //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                    //并且要先设置defaultChecked后设置checked
                    //并且必须设置延迟
                    element.defaultChecked = checked
                    element.checked = checked
                }, 100)
            } else {
                element.checked = checked
            }
        }
        bound(IE6 ? "mouseup" : "click", updateVModel)
    } else if (type === "checkbox") {
        updateVModel = function() {
            if ($elem.data("duplex-observe") !== false) {
                var method = element.checked ? "ensure" : "remove"
                var array = evaluator()
                if (!Array.isArray(array)) {
                    log("ms-duplex应用于checkbox上要对应一个数组")
                    array = [array]
                }
                avalon.Array[method](array, data.pipe(element.value, data, "get"))
                callback.call(element, array)
            }
        }

        data.handler = function() {
            var array = [].concat(evaluator()) //强制转换为数组
            element.checked = array.indexOf(data.pipe(element.value, data, "get")) >= 0
        }
        bound(W3C ? "change" : "click", updateVModel)
    } else {
        var events = element.getAttribute("data-duplex-event") || element.getAttribute("data-event") || "input"
        if (element.attributes["data-event"]) {
            log("data-event指令已经废弃，请改用data-duplex-event")
        }

        function delay(e) {
            setTimeout(function() {
                updateVModel(e)
            })
        }

        events.replace(rword, function(name) {
            switch (name) {
                case "input":
                    if (!window.VBArray) { // W3C
                        bound("input", updateVModel)
                        //非IE浏览器才用这个
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)

                    } else { //onpropertychange事件无法区分是程序触发还是用户触发
                        element.avalonSelectionChange = updateVModel//监听IE点击input右边的X的清空行为
                        if (IEVersion > 8) {
                            bound("input", updateVModel)//IE9使用propertychange无法监听中文输入改动
                        } else {
                            bound("propertychange", function(e) {//IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                                if (e.propertyName === "value") {
                                    updateVModel()
                                }
                            })
                        }
                        // bound("paste", delay)//IE9下propertychange不监听粘贴，剪切，删除引发的变动
                        // bound("cut", delay)
                        // bound("keydown", delay)
                        bound("dragend", delay)
                        //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                        //http://www.matts411.com/post/internet-explorer-9-oninput/
                    }
                    break
                default:
                    bound(name, updateVModel)
                    break
            }
        })
    }
    element.oldValue = element.value
    launch(function() {
        if (avalon.contains(root, element)) {
            onTree.call(element)
        } else if (!element.msRetain) {
            return false
        }
    })
    registerSubscriber(data)
    callback.call(element, element.value)
}
duplexBinding.TEXTAREA = duplexBinding.INPUT

var TimerID, ribbon = [],
        launch = noop

function W3CFire(el, name, detail) {
    var event = DOC.createEvent("Events")
    event.initEvent(name, true, true)
    event.isTrusted = false
    if (detail) {
        event.detail = detail
    }
    el.dispatchEvent(event)
}

function onTree(value) { //disabled状态下改动不触发input事件
    var newValue = arguments.length ? value : this.value
    if (!this.disabled && this.oldValue !== newValue + "") {
        var type = this.getAttribute("data-duplex-event") || "input"
        type = type.match(rword).shift()
        if (W3C) {
            W3CFire(this, type)
        } else {
            try {
                this.fireEvent("on" + type)
            } catch (e) {
            }
        }
    }
}

avalon.tick = function(fn) {
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

function newSetter(value) {
    onSetter.call(this, value)
    onTree.call(this, value)
}
try {
    var inputProto = HTMLInputElement.prototype
    Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
    var onSetter = Object.getOwnPropertyDescriptor(inputProto, "value").set //屏蔽chrome, safari,opera
    Object.defineProperty(inputProto, "value", {
        set: newSetter
    })
} catch (e) {
    launch = avalon.tick
}

duplexBinding.SELECT = function(element, evaluator, data) {
    var $elem = avalon(element)

    function updateVModel() {
        if ($elem.data("duplex-observe") !== false) {
            var val = $elem.val() //字符串或字符串数组
            if (Array.isArray(val)) {
                val = val.map(function(v) {
                    return data.pipe(v, data, "get")
                })
            } else {
                val = data.pipe(val, data, "get")
            }
            if (val + "" !== element.oldValue) {
                evaluator(val)
            }
            data.changed.call(element, val, data)
        }
    }
    data.handler = function() {
        var val = evaluator()
        val = val && val.$model || val
        //必须变成字符串后才能比较
        if (Array.isArray(val)) {
            if (!element.multiple) {
                log("ms-duplex在<select multiple=true>上要求对应一个数组")
            }
        } else {
            if (element.multiple) {
                log("ms-duplex在<select multiple=false>不能对应一个数组")
            }
        }
        val = Array.isArray(val) ? val.map(String) : val + ""
        if (val + "" !== element.oldValue) {
            $elem.val(val)
            element.oldValue = val + ""
        }
    }
    data.bound("change", updateVModel)
    checkScan(element, function() {
        //先等到select里的option元素被扫描后，才根据model设置selected属性  
        registerSubscriber(data)
        data.changed.call(element, evaluator(), data)
    }, NaN)
}

