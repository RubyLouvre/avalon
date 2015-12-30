//双工绑定
;
(function () {

    var rduplexType = /^(?:checkbox|radio)$/
    var rduplexParam = /^(?:radio|checked)$/
    var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/
    avalon.directive("duplex", {
        priority: 2000,
        init: function (binding, hasCast) {
            var elem = binding.element
            var vmodel = binding.vmodel
            var fn = getBindingValue(elem, "data-duplex-changed", vmodel)
            if (typeof fn !== "function") {
                fn = noop
            }
            binding.changed = fn
            var nodeName = elem.type
            if (nodeName === "input" && !elem.props.type) {
                elem.props.type = "text"
            }
            var elemType = elem.props.type
            var params = []
            var casting = oneObject("string,number,boolean,checked")
            if (elemType === "radio" && binding.param === "") {
                binding.param = "checked"
            }

            binding.param.replace(rw20g, function (name) {
                if (rduplexType.test(elemType) && rduplexParam.test(name)) {
                    if (name === "radio")
                        log("ms-duplex-radio已经更名为ms-duplex-checked")
                    name = "checked"
                    elem.props.isChecked = true
                    elem.props.xtype = "radio"
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
            binding.param = params.join("-")
            if (!elem.props.xtype) {
                elem.props.xtype = nodeName === "select" ? "select" :
                        elemType === "checkbox" ? "checkbox" :
                        elemType === "radio" ? "radio" :
                        /^change/.test(elem.props["data-duplex-event"]) ? "change" :
                        "input"
            }
            var duplexEvents = {}
            switch (elem.props.xtype) {
                case "radio":
                    duplexEvents.click = inputListener
                    break
                case "checkbox":
                    duplexEvents[W3C ? "change" : "click"] = checkboxListener
                    break
                case "change":
                    duplexEvents.change = inputListener
                    break
                case "select":
                    duplexEvents.change = selectListener
                    break
                case "input":
                    if (!IEVersion) { // W3C
                        duplexEvents.input = inputListener
                        duplexEvents.compositionstart = compositionStart
                        duplexEvents.compositionend = compositionEnd
                        duplexEvents.DOMAutoComplete = inputListener
                    } else {
                        // IE下通过selectionchange事件监听IE9+点击input右边的X的清空行为，及粘贴，剪切，删除行为
                        if (IEVersion > 8) {
                            if (IEVersion === 9) {
                                //IE9删除字符后再失去焦点不会同步 #1167
                                duplexEvents.keyup = inputListener
                            }
                            //IE9使用propertychange无法监听中文输入改动
                            duplexEvents.input = inputListener
                        } else {
                            //onpropertychange事件无法区分是程序触发还是用户触发
                            //IE6-8下第一次修改时不会触发,需要使用keydown或selectionchange修正
                            duplexEvents.propertychange = propertychangeListener
                        }
                        duplexEvents.dragend = dragendListener
                        //http://www.cnblogs.com/rubylouvre/archive/2013/02/17/2914604.html
                        //http://www.matts411.com/post/internet-explorer-9-oninput/
                    }
                    break

            }

            if (elem.props.xtype === "input" && !rnoduplexInput.test(elemType)) {
                if (elemType !== "hidden") {
                    duplexEvents.focus = duplexFocus
                    duplexEvents.blur = duplexBlur
                }
                elem.watchValueInTimer = true
            }
            elem.duplexEvents = duplexEvents
        },
        change: function (value, binding) {
            var elem = binding.element
            if (!elem || elem.disposed)
                return
            elem["data-pipe"] = binding.param
            elem.setter = function (a, b, c) {
                binding.setter(binding.vmodel, a, b, c)
            }

            if (elem.type === "select") {
                addHook(elem, selectUpdate, "afterChange")
            }
            elem.getterValue = value
            elem.changed = binding.changed
            addHooks(this, binding)
        },
        update: function (elem, vnode) {
            elem.setter = vnode.setter
            var getterValue = elem.getterValue = vnode.getterValue
            var events = vnode.duplexEvents
            if (events) {
                elem.setAttribute("data-pipe", vnode['data-pipe'])
                delete vnode['data-pipe']
                elem.changed = vnode.changed
                delete vnode.changed
                for (var eventName in events) {
                    avalon.bind(elem, eventName, events[eventName])
                }
                delete vnode.duplexEvents
            }
            if (vnode.watchValueInTimer) {
                elem.avalonSetter = inputListener //#765
                watchValueInTimer(function () {
                    if (!vnode.disposed) {
                        if (!elem.msFocus) {
                            elem.avalonSetter()
                        }
                    } else if (!elem.msRetain) {
                        return false
                    }
                })
                delete vnode.watchValueInTimer
            }
            var curValue
            switch (vnode.props.xtype) {
                case "input":
                case "change":
                    curValue = pipe(getterValue, elem, "set")  //fix #673
                    if (curValue !== elem.oldValue) {
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
                        elem.value = elem.oldValue = curValue
                        if (fixCaret) {
                            setCaret(elem, pos, pos)
                        }
                    }
                    break
                case "radio":
                    curValue = vnode.props.isChecked ? !!getterValue : getterValue + "" === elem.value
                    if (IEVersion === 6) {
                        setTimeout(function () {
                            //IE8 checkbox, radio是使用defaultChecked控制选中状态，
                            //并且要先设置defaultChecked后设置checked
                            //并且必须设置延迟
                            elem.defaultChecked = curValue
                            elem.checked = curValue
                        }, 31)
                    } else {
                        elem.checked = curValue
                    }
                    break
                case "checkbox":
                    var array = [].concat(getterValue) //强制转换为数组
                    curValue = pipe(elem.value, elem, "get")
                    elem.checked = array.indexOf(curValue) > -1
                    break
                case "select":
                    //在afterChange中处理
                    break
            }
        }
    })

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
    function inputListener() { //原来的updateVModel
        var elem = this
        var val = elem.value //防止递归调用形成死循环
        if (elem.composing || val === elem.oldValue)
            return
        var lastValue = pipe(val, elem, "get")
        try {
            elem.oldValue = val
            elem.setter(lastValue)
            elem.changed(lastValue)
        } catch (ex) {
            log(ex)
        }
    }
    function propertychangeListener(e) {
        if (e.propertyName === "value") {
            inputListener.call(this, e)
        }
    }

    function dragendListener(e) {
        var elem = this
        setTimeout(function () {
            inputListener.call(elem, e)
        }, 17)
    }

    function checkboxListener() {
        var elem = this
        var method = elem.checked ? "ensure" : "remove"
        var array = elem.getterValue
        if (!Array.isArray(array)) {
            log("ms-duplex应用于checkbox上要对应一个数组")
            array = [array]
        }
        var val = pipe(elem.value, elem, "get")
        avalon.Array[method](array, val)
        elem.changed(array)
    }

//用于更新VM
    function selectListener() {
        var elem = this
        var val = avalon(elem).val() //字符串或字符串数组
        if (Array.isArray(val)) {
            val = val.map(function (v) {
                return pipe(v, elem, "get")
            })
        } else {
            val = pipe(val, elem, "get")
        }
        if (val + "" !== elem.oldValue) {
            try {
                elem.setter(val)
            } catch (ex) {
                log(ex)
            }
        }
    }
    function selectUpdate(elem, vnode) {
        avalon(elem).val(vnode.getterValue)
    }
    selectUpdate.priority = 2001

    markID(compositionStart)
    markID(compositionEnd)
    markID(duplexFocus)
    markID(duplexBlur)
    markID(inputListener)
    markID(propertychangeListener)
    markID(dragendListener)
    markID(checkboxListener)
    markID(selectListener)

    if (IEVersion) {
        avalon.bind(DOC, "selectionchange", function (e) {
            var el = DOC.activeElement || {}
            if (!el.msFocus && el.avalonSetter) {
                el.avalonSetter()
            }
        })
    }

    function fixNull(val) {
        return val == null ? "" : val
    }
    avalon.duplexHooks = {
        checked: {
            get: function (val, elem) {
                return !elem.oldValue
            }
        },
        string: {
            get: function (val) { //同步到VM
                return val
            },
            set: fixNull
        },
        "boolean": {
            get: function (val) {
                return val === "true"
            },
            set: fixNull
        },
        number: {
            get: function (val, elem) {
                var number = parseFloat(val + "")
                if (-val === -number) {
                    return number
                }

                var arr = /strong|medium|weak/.exec(elem.getAttribute("data-duplex-number")) || ["medium"]
                switch (arr[0]) {
                    case "strong":
                        return 0
                    case "medium":
                        return val === "" ? "" : 0
                    case "weak":
                        return val
                }
            },
            set: fixNull
        }
    }

    function pipe(val, elem, action) {
        var param = elem.getAttribute("data-pipe") || ""
        param.replace(rw20g, function (name) {
            var hook = avalon.duplexHooks[name]
            if (hook && typeof hook[action] === "function") {
                val = hook[action](val, elem)
            }
        })
        return val
    }
//---------------

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

    var watchValueInTimer = noop
    ;(function () { // jshint ignore:line
        try { //#272 IE9-IE11, firefox
            var setters = {}
            var aproto = HTMLInputElement.prototype
            var bproto = HTMLTextAreaElement.prototype
            function newSetter(value) { // jshint ignore:line
                setters[this.tagName].call(this, value)
                if (!this.msFocus && this.avalonSetter) {
                    this.avalonSetter()
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


})()