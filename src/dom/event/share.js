var canBubbleUp = require('./canBubbleUp')

var rconstant = /^[A-Z_]+$/
var rhandleHasVm = /^e/
var stopImmediate = false
var typeRegExp = {}

function avEvent(event) {
    /* istanbul ignore if */
    if (event.originalEvent) {
        return event
    }
    for (var i in event) {
        if (!rconstant.test(i) && typeof event[i] !== 'function') {
            this[i] = event[i]
        }
    }
    if (this.fixIE) {
        this.fixIE()
    }
    this.timeStamp = new Date() - 0
    this.originalEvent = event
}
avEvent.prototype = {
    preventDefault: function () {
        var e = this.originalEvent || {}
        e.returnValue = this.returnValue = false
        if (e.preventDefault) {
            e.preventDefault()
        }
    },
    stopPropagation: function () {
        var e = this.originalEvent || {}
        e.cancelBubble = this.cancelBubble = true
        if (e.stopPropagation) {
            e.stopPropagation()
        }
    },
    stopImmediatePropagation: function () {
        stopImmediate = true;
        this.stopPropagation()
    },
    toString: function () {
        return '[object Event]'//#1619
    }
}


function dispatch(event) {
    event = new avEvent(event)
    var type = event.type
    var elem = event.target
    var handlers = []
    collectHandlers(elem, type, handlers)
    var i = 0, j, uuid, handler
    while ((handler = handlers[i++]) && !event.cancelBubble) {
        var host = event.currentTarget = handler.elem
        j = 0
        while ((uuid = handler.uuids[ j++ ])) {
            if (stopImmediate) {
                stopImmediate = false
                break
            }
            var fn = avalon.eventListeners[uuid]
            if (fn) {
                var vm = rhandleHasVm.test(uuid) ? handler.elem._ms_context_ : 0
                if (vm && vm.$hashcode === false) {
                    return avalon.unbind(elem, type, fn)
                }

                var ret = fn.call(vm || elem, event, host._ms_local)

                if (ret === false) {
                    event.preventDefault()
                    event.stopPropagation()
                }
            }
        }
    }
}


function collectHandlers(elem, type, handlers) {
    var value = elem.getAttribute('avalon-events')
    if (value && (elem.disabled !== true || type !== 'click')) {
        var uuids = []
        var reg = typeRegExp[type] || (typeRegExp[type] = new RegExp("\\b" + type + '\\:([^,\\s]+)', 'g'))
        value.replace(reg, function (a, b) {
            uuids.push(b)
            return a
        })
        if (uuids.length) {
            handlers.push({
                elem: elem,
                uuids: uuids
            })
        }
    }
    elem = elem.parentNode
    var g = avalon.gestureEvents || {}
    if (elem && elem.getAttribute && (canBubbleUp[type] || g[type])) {
        collectHandlers(elem, type, handlers)
    }

}

module.exports = {
    canBubbleUp: canBubbleUp,
    avEvent: avEvent,
    dispatch: dispatch
}