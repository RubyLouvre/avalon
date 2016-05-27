var Recognizer = require('./recognizer')

var pinchRecognizer = {
    events: ['pinchstart', 'pinch', 'pinchin', 'pinchuot', 'pinchend'],
    getScale: function (x1, y1, x2, y2, x3, y3, x4, y4) {
        return Math.sqrt((Math.pow(y4 - y3, 2) + Math.pow(x4 - x3, 2)) / (Math.pow(y2 - y1, 2) + Math.pow(x2 - x1, 2)))
    },
    getCommonAncestor: function (arr) {
        var el = arr[0], el2 = arr[1]
        while (el) {
            if (el.contains(el2) || el === el2) {
                return el
            }
            el = el.parentNode
        }
        return null
    },
    touchstart: function (event) {
        var pointers = Recognizer.pointers
        Recognizer.start(event, avalon.noop)
        var elements = []
        for (var p in pointers) {
            if (pointers[p].startTime) {
                elements.push(pointers[p].element)
            } else {
                delete pointers[p]
            }
        }
        pointers.elements = elements
        if (elements.length === 2) {
            pinchRecognizer.element = pinchRecognizer.getCommonAncestor(elements)
            Recognizer.fire(pinchRecognizer.getCommonAncestor(elements), 'pinchstart', {
                scale: 1,
                touches: event.touches,
                touchEvent: event
            })
        }
    },
    touchmove: function (event) {
        if (pinchRecognizer.element && event.touches.length > 1) {
            var position = [],
                    current = []
            for (var i = 0; i < event.touches.length; i++) {
                var touch = event.touches[i];
                var gesture = Recognizer.pointers[touch.identifier];
                position.push([gesture.startTouch.clientX, gesture.startTouch.clientY]);
                current.push([touch.clientX, touch.clientY]);
            }

            var scale = pinchRecognizer.getScale(position[0][0], position[0][1], position[1][0], position[1][1],
                    current[0][0], current[0][1], current[1][0], current[1][1]);
            pinchRecognizer.scale = scale
            Recognizer.fire(pinchRecognizer.element, 'pinch', {
                scale: scale,
                touches: event.touches,
                touchEvent: event
            })

            if (scale > 1) {
                Recognizer.fire(pinchRecognizer.element, 'pinchout', {
                    scale: scale,
                    touches: event.touches,
                    touchEvent: event
                })

            } else {
                Recognizer.fire(pinchRecognizer.element, 'pinchin', {
                    scale: scale,
                    touches: event.touches,
                    touchEvent: event
                })
            }
        }
        event.preventDefault()
    },
    touchend: function (event) {
        if (pinchRecognizer.element) {
            Recognizer.fire(pinchRecognizer.element, 'pinchend', {
                scale: pinchRecognizer.scale,
                touches: event.touches,
                touchEvent: event
            })
            pinchRecognizer.element = null
        }
        Recognizer.end(event, avalon.noop)
    }
}

pinchRecognizer.touchcancel = pinchRecognizer.touchend

Recognizer.add('pinch', pinchRecognizer)

/*
 *
 在iOS中事件分为三类：
 触摸事件：通过触摸、手势进行触发（例如手指点击、缩放）
 运动事件：通过加速器进行触发（例如手机晃动）
 远程控制事件：通过其他远程设备触发（例如耳机控制按钮）
 */
