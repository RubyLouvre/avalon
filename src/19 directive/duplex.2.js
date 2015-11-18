if (IEVersion) {
    avalon.bind(DOC, "selectionchange", function (e) {
        var el = DOC.activeElement || {}
        if (!el.msFocus && el.avalonSetter) {
            el.avalonSetter()
        }
    })
}
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
    var IE9Value
    //当value变化时改变model的值
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
        var val = data.pipe(evaluator(), data, "set")  //fix #673 #1106
        if (val !== IE9Value) {
            var fixCaret = false
            if (elem.msFocus) {
                try {
                    var pos = getCaret(elem)
                    if (pos.start === pos.end) {
                        pos = pos.start
                        fixCaret = true
                    }
                } catch (e) {
                }
            }
            elem.value = IE9Value = val
            if (fixCaret && !elem.readyOnly) {
                setCaret(elem, pos, pos)
            }
        }
    }
    if (data.isChecked || $type === "radio") {
        var IE6 = IEVersion === 6
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
            elem.oldValue = checked
            if (IE6) {
                setTimeout(function () {
                    //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                    //并且要先设置defaultChecked后设置checked
                    //并且必须设置延迟
                    elem.defaultChecked = checked
                    elem.checked = checked
                }, 31)
            } else {
                elem.checked = checked
            }
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
                var val = data.pipe(elem.value, data, "get")
                avalon.Array[method](array, val)
                callback.call(elem, array)
            }
        }

        data.handler = function () {
            var array = [].concat(evaluator()) //强制转换为数组
            var val = data.pipe(elem.value, data, "get")
            elem.checked = array.indexOf(val) > -1
        }
        bound(W3C ? "change" : "click", updateVModel)
    } else {
        var events = elem.getAttribute("data-duplex-event") || "input"
        if (elem.attributes["data-event"]) {
            log("data-event指令已经废弃，请改用data-duplex-event")
        }

        function delay(e) { // jshint ignore:line
            setTimeout(function () {
                updateVModel(e)
            })
        }
        events.replace(rword, function (name) {
            switch (name) {
                case "input":
                    if (!IEVersion) { // W3C
                        bound("input", updateVModel)
                        //非IE浏览器才用这个
                        bound("compositionstart", compositionStart)
                        bound("compositionend", compositionEnd)
                        bound("DOMAutoComplete", updateVModel)
                    } else { 
                        // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        if (IEVersion > 8) {
                            if(IEVersion === 9){
                                //IE9删除字符后再失去焦点不会同步 #1167
                                bound("keyup", updateVModel)
                            }
                            //IE9使用propertychange无法监听中文输入改动
                            bound("input", updateVModel) 
                        } else {
                            //onpropertychange事件无法区分是程序触发还是用户触发
                            //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                            bound("propertychange", function (e) { 
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


        if (!rnoduplex.test(elem.type)) {
            if (elem.type !== "hidden") {
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
                    if (!elem.msFocus ) {
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
function getCaret(ctrl) {
    var start = NaN, end = NaN   
    //https://github.com/RobinHerbots/jquery.inputmask/blob/3.x/js/inputmask.js#L1736
    if (ctrl.setSelectionRange) {
        start = ctrl.selectionStart
        end = ctrl.selectionEnd
    } else {
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