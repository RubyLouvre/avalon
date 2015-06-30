//处理radio, checkbox, text, textarea, password
duplexBinding.INPUT = function (element, evaluator, data) {
    var $type = element.type,
            $elem = avalon(element)

    function callback(value) {
        data.changed.call(this, value, data)
    }

 
    //当value变化时改变model的值
    var updateVModel = function (e) {
        var nativeType = e.nativeEvent.type
        console.log(nativeType)
        if (inputEvent !== "input" && nativeType !== "datasetchanged" && nativeType !== inputEvent) {
            return
        }
        var val = element.oldValue = element.value //防止递归调用形成死循环
        var lastValue = data.pipe(val, data, "get")
        if ($elem.data("duplexObserve") !== false) {
            evaluator(lastValue)
            callback.call(element, lastValue)
            if ($elem.data("duplex-focus")) {
                avalon.nextTick(function () {
                    element.focus()
                })
            }
        }
    }
    //当model变化时,它就会改变value的值
    data.handler = function () {
        var val = data.pipe(evaluator(), data, "set") + ""
        if (val !== element.oldValue) {
            element.value = val
        }
    }
    if (data.isChecked || $type === "radio") {
        updateVModel = function () {
            if ($elem.data("duplexObserve") !== false) {
                var lastValue = data.pipe(element.value, data, "get")
                evaluator(lastValue)
                callback.call(element, lastValue)
            }
        }
        data.handler = function () {
            var val = evaluator()
            var checked = data.isChecked ? !!val : val + "" === element.value
            element.oldValue = checked
        }
        data.rollback = delegateEvent(element, "change", updateVModel)
    } else if ($type === "checkbox") {
        updateVModel = function () {
            if ($elem.data("duplexObserve") !== false) {
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
        data.handler = function () {
            var array = [].concat(evaluator()) //强制转换为数组
            element.checked = array.indexOf(data.pipe(element.value, data, "get")) > -1
        }
        data.rollback = delegateEvent(element, "change", updateVModel)
    } else {
        var inputEvent = element.getAttribute("data-duplex-event") || "input"
        if (element.attributes["data-event"]) {
            log("data-event指令已经废弃，请改用data-duplex-event")
        }
        var fn0 = delegateEvent(element, "input", updateVModel)
        if (inputEvent !== "input") {
            var fn1 = delegateEvent(element, inputEvent, updateVModel)
        }
        data.rollback = function () {
            fn0()
            fn1 && fn1()
        }
    }

    element.oldValue = element.value
    avalon.injectBinding(data)
    callback.call(element, element.value)
}
duplexBinding.TEXTAREA = duplexBinding.INPUT