define(["avalon"], function(avalon) {
    var DOC = document
    var root = DOC.documentElement
    var IEEventMap = {
        "change": "click",
        "focus": "focusin",
        "blur": "focusout"
    }
    var checkMap = {}
    var liveMap = avalon.bindingHandlers.live = function(data, vmodels) {
        var type = data.param
        var live = "noFix"
        if (!DOC.createEvent) {
            var fixCheck = type === "change" && /checkbox|radio/.test(data.element.type)
            if (/focus|blur/.test(type) || fixCheck) {
                live = "fixIE"//旧式IE下使用focusin与focusout来模拟focus、blur，使用click来模拟复选框，单选框的change事件

            } else if (/change|submit|reset|select/.test(type)) {
                live = false//对于一些模拟成本太大的事件直接使用普通的事件绑定
            }
        }
 avalon.bind(DOC, "beforeactivate", function(e) {
     console.log(e.type+"!!!!!!!")
 })
        if (live) {
            if (!liveMap[live + type]) {
                liveMap[live + type] = []
                //   console.log(type + "  " + live)


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

                if (live === "fixIE") {
                    //  var fixType = type === "focus" ? "focusin" : "focusout"
                    avalon.bind(DOC, IEEventMap[type], function(e) {
                        var callbacks = liveMap[live + type]
                        var target = e.target
                        for (var i = callbacks.length, obj; obj = callbacks[--i]; ) {
                            var elem = obj.elem
                            if (root.contains(elem)) {
                                if (elem === target || elem.contains(target)) {
                                    if (type !== "change" || checkMap[elem.name] !== elem) {
                                        var ex = {}
                                        for (var j in e) {
                                            ex[j] = e[j]
                                        }
                                        ex.preventDefault = function() { //阻止默认行为
                                            e.returnValue = false
                                        }
                                        ex.stopPropagation = function() { //阻止事件在DOM树中的传播
                                            e.cancelBubble = true
                                        }
                                        ex.originalEvent = e
                                        ex.type = type
                                        obj.fn.call(elem, ex)
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
            }
            data.specialBind = function(elem, fn) {
                var obj = {
                    elem: elem,
                    fn: fn
                }
                if (/focus|blur/.test(type)) {
                    elem.tabIndex = elem.tabIndex || -1
                }
                if (fixCheck) {
                    obj.__change__ = elem.checked
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