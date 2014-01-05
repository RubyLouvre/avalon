define(["avalon"], function(avalon) {
    var DOC = document
    var root = DOC.documentElement
    var IEEventMap = {
        "change": "click",
        "focus": "focusin",
        "blur": "focusout"
    }
    var checkMap = {}
    function getVal(elem) {
        var type = elem.type
        if (type === "select-multiple") {
            if (elem.selectedIndex > -1) {
                var ret = []
                for (var i = 0, el; el = elem.options[i++]; ) {
                    ret.push(el.selected)
                }
                return ret.join("-")
            } else {
                return ""
            }

        } else if (elem.nodeName.toLowerCase() === "select") {
            return  elem.selectedIndex;
        }

        return  elem.value
    }

    function testChange(e) {
        var callbacks = liveMap["fixChangechange"]
        var target = e.target
        for (var i = callbacks.length, obj; obj = callbacks[--i]; ) {
            var elem = obj.elem
            if (root.contains(elem)) {
                if (elem === target || elem.contains(target)) {
                    var curVal = getVal(elem)
                    if (obj.__change__ !== curVal) {
                        e.type = "change"
                        obj.fn.call(elem, e)
                        obj.__change__ = curVal
                    }
                }
            } else {
                callbacks.splice(i, 1)
            }
        }

    }
    var liveMap = avalon.bindingHandlers.live = function(data, vmodels) {
        var type = data.param
        var live = "noFix"
        if (!DOC.createEvent) {
            if (/focus|blur/.test(type)) {
                live = "fixFocus"//旧式IE下使用focusin与focusout来模拟focus、blur，使用click来模拟复选框，单选框的change事件
            } else if (type == "change") {
                var elem = data.element
                var elemType = elem.type
                if (elemType == "radio" || elemType === "checkbox") {
                    live = "fixFocus"
                } else {
                    live = "fixChange"
                }
            } else if (/submit|reset|select/.test(type)) {
                live = false//对于一些模拟成本太大的事件直接使用普通的事件绑定
            }
        }

        if (live) {
            if (!liveMap[live + type]) {
                liveMap[live + type] = []
                if (live === "noFix") {
                    avalon.bind(DOC, type, function(e) {
                        var callbacks = liveMap[live + type]
                        var target = e.target
                        for (var i = callbacks.length, obj; obj = callbacks[--i]; ) {
                            if (root.contains(obj.elem)) {
                                if (obj.elem === target || obj.elem.contains(target)) {
                                    obj.fn.call(obj.elem, e)
                                }
                            } else {
                                callbacks.splice(i, 1)
                            }
                        }
                    }, true)

                }

                if (live === "fixFocus") {
                    avalon.bind(DOC, IEEventMap[type], function(e) {
                        var callbacks = liveMap[live + type]
                        var target = e.target
                        for (var i = callbacks.length, obj; obj = callbacks[--i]; ) {
                            var elem = obj.elem
                            if (root.contains(elem)) {
                                if (elem === target || elem.contains(target)) {
                                    if (type !== "change" || checkMap[elem.name] !== elem) {
                                        e.type = type
                                        obj.fn.call(elem, e)
                                        if (type === "change") {
                                            checkMap[elem.name] = elem
                                        }
                                    }
                                }
                            } else {
                                callbacks.splice(i, 1)
                            }
                        }
                    })
                }
                if (live === "fixChange") {
                    avalon.bind(DOC, "beforeactivate", testChange)
                    avalon.bind(DOC, "beforedeactivate", testChange)
                }
            }
            data.specialBind = function(elem, fn) {
                var obj = {
                    elem: elem,
                    fn: fn
                }
                if (/focus|blur/.test(type)) {
                    elem.tabIndex = elem.tabIndex || -1
                }
                if (live === "fixChange") {
                    obj.__change__ = getVal(elem)
                }
                var callbacks = liveMap[live + type]
                callbacks.unshift(obj)
                data.specialUnbind = function() {
                    avalon.Array.remove(callbacks, obj)
                    delete data.specialBind
                    delete data.specialUnbind
                }
            }
        }

        avalon.bindingHandlers.on(data, vmodels)
    }

})
//avalon的事件代理模块