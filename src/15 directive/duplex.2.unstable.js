if (IEVersion) {
    avalon.bind(DOC, "selectionchange", function(e) {
        var el = DOC.activeElement
        if (el && typeof el.avalonSetter === "function") {
            el.avalonSetter()
        }
    })
}

//处理radio, checkbox, text, textarea, password
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
        if (composing)  //处理中文输入法在minlengh下引发的BUG
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
    var watchProp = watchValueInProp && /text/.test(element.type)
    if (watchProp) {
        element.addEventListener("input", function(e) {
            if (composing)
                return
            var sel = window.getSelection()
            // http://stackoverflow.com/questions/7380190/select-whole-word-with-getselection/7381574#7381574
            if (sel.extend) {
                sel.extend(this, 0)
            } else {
                this.select()
            }
            var value = sel.toString()
            var n = value.length
            this.setSelectionRange(n, n)
            this.oldValue = value
        })
    }
    //当model变化时,它就会改变value的值
    data.handler = function() {
        var val = data.pipe(evaluator(), data, "set")
        if (val !== element.oldValue) {
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
                    if (!IEVersion) { // W3C
                        bound("input", updateVModel)
                        //非IE浏览器才用这个
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)
                        bound("DOMAutoComplete", updateVModel)
                    } else { //onpropertychange事件无法区分是程序触发还是用户触发
                        // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        if (IEVersion > 8) {
                            bound("input", updateVModel)//IE9使用propertychange无法监听中文输入改动
                        } else {
                            bound("propertychange", function(e) {//IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                                if (e.propertyName === "value") {
                                    updateVModel()
                                }
                            })
                        }
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

    element.avalonSetter = updateVModel
    if (/text|password/.test(element.type)) {
        if (watchProp) {//chrome safari
            element.value = String(data.pipe(evaluator(), data, "set"))
            Object.defineProperty(element, "value", {
                set: function(text) {
                    text = text == null ? "" : String(text)
                    if (this.oldValue !== text) {
                        //先选中表单元素创建一个选区，然后清空value
                        //http://stackoverflow.com/questions/6690752/insert-html-at-caret-in-a-contenteditable-div/6691294#6691294
                        this.select()
                        var range = document.createRange()
                        range.selectNodeContents(this)
                        range.deleteContents()
                        //接着使用insertHTML或insertText命令设置value
                        //http://stackoverflow.com/questions/12027137/javascript-trick-for-paste-as-plain-text-in-execcommand
                        document.execCommand("insertText", false, text)
                        this.blur() // https://github.com/RubyLouvre/avalon/issues/651
                        this.oldValue = text
                    }
                },
                get: function() {
                    return this.oldValue
                }
            })
        } else {
            watchValueInTimer(function() {
                if (root.contains(element)) {
                    if (element.value !== element.oldValue) {
                        updateVModel()
                    }
                } else if (!element.msRetain) {
                    return false
                }
            })
        }
    }
    element.oldValue = element.value
    registerSubscriber(data)
    callback.call(element, element.value)
}
duplexBinding.TEXTAREA = duplexBinding.INPUT

