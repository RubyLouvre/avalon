define(["avalon"], function(avalon) {
    var DOC = document
    var root = DOC.documentElement
    var liveMap = avalon.bindingHandlers.live = function(data, vmodels) {
        var type = data.param
        if (!DOC.createEvent && /focus|blur|change|submit|reset|select/.test(type)) {
            throw Error("IE6-8不支持" + type + "的事件代理")
        }
        if (!liveMap[type]) {
            liveMap[type] = []
            avalon.bind(DOC, type, function(e) {
                var callbacks = liveMap[type]
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
        data.specialBind = function(elem, fn) {
            var obj = {
                elem: elem,
                fn: fn
            }
            var callbacks = liveMap[type]
            callbacks.unshift(obj)
            data.specialUnbind = function() {
                avalon.Array.remove(callbacks, obj)
                delete data.specialBind
                delete data.specialUnbind
            }
        }
        avalon.bindingHandlers.on(data, vmodels)
    }

})
//avalon的事件代理模块