var rnoduplex = /^(file|button|reset|submit|checkbox|radio|range)$/
//处理radio, checkbox, text, textarea, password
duplexBinding.INPUT = function (elem, evaluator, data) {
    var $type = elem.type,
            bound = data.bound,
            $elem = avalon(elem),
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
    var IE9Value
    var updateVModel = function () {
        var val = elem.value //防止递归调用形成死循环
        if (composing || val === IE9Value) //处理中文输入法在minlengh下引发的BUG
            return
        var lastValue = data.pipe(val, data, "get")
        if ($elem.data("duplexObserve") !== false) {
            IE9Value = val
            evaluator(lastValue)
            callback.call(elem, lastValue)
        }
    }
    //当model变化时,它就会改变value的值
    data.handler = function () {
        var val = data.pipe(evaluator(), data, "set")
        if (val !== IE9Value) {
            var fixCaret = false
            if (elem.msFocus) {
                try {
                    var start = elem.selectionStart
                    var end = elem.selectionEnd
                    if (start === end) {
                        var pos = start
                        fixCaret = true
                    }
                } catch (e) {
                }
            }
            elem.value = IE9Value = val
            if (fixCaret && !elem.readyOnly) {
                elem.selectionStart = elem.selectionEnd = pos
            }
        }
    }
    if (data.isChecked || $type === "radio") {
        updateVModel = function () {
            if ($elem.data("duplexObserve") !== false) {
                var lastValue = data.pipe(elem.value, data, "get")
                evaluator(lastValue)
                callback.call(elem, lastValue)
            }
        }
        data.handler = function () {
            var val = evaluator()
            var checked = data.isChecked ? !!val : val + "" === elem.value
            elem.checked = elem.oldValue = checked
        }
        bound("click", updateVModel)
    } else if ($type === "checkbox") {
        updateVModel = function () {
            if ($elem.data("duplexObserve") !== false) {
                var method = elem.checked ? "ensure" : "remove"
                var array = evaluator()
                if (!Array.isArray(array)) {
                    log("ms-duplex应用于checkbox上要对应一个数组")
                    array = [array]
                }
                avalon.Array[method](array, data.pipe(elem.value, data, "get"))
                callback.call(elem, array)
            }
        }
        data.handler = function () {
            var array = [].concat(evaluator()) //强制转换为数组
            elem.checked = array.indexOf(data.pipe(elem.value, data, "get")) > -1
        }
        bound("change", updateVModel)
    } else {
        var events = elem.getAttribute("data-duplex-event") || "input"
        if (elem.attributes["data-event"]) {
            log("data-event指令已经废弃，请改用data-duplex-event")
        }
        events.replace(rword, function (name) {
            switch (name) {
                case "input":
                    bound("input", updateVModel)
                    bound("keyup", updateVModel)
                    if (!IEVersion) {
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)
                        bound("DOMAutoComplete", updateVModel)
                    }
                    break
                default:
                    bound(name, updateVModel)
                    break
            }
        })

        if (!rnoduplex.test($type)) {
            if ($type !== "hidden") {
                bound("focus", function () {
                    elem.msFocus = true
                })
                bound("blur", function () {
                    elem.msFocus = false
                })
            }
            elem.avalonSetter = updateVModel //#765
            watchValueInTimer(function () {
                if (root.contains(elem)) {
                    if (!elem.msFocus) {
                        updateVModel()
                    }
                } else if (!elem.msRetain) {
                    return false
                }
            })
        }
    }
    avalon.injectBinding(data)
    callback.call(elem, elem.value)
}
duplexBinding.TEXTAREA = duplexBinding.INPUT