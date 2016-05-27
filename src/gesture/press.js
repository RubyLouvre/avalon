var Recognizer = require('./recognizer')

var pressRecognizer = {
    events: ['longtap', 'doubletap'],
    cancelPress: function (pointer) {
        clearTimeout(pointer.pressingHandler)
        pointer.pressingHandler = null
    },
    touchstart: function (event) {
        Recognizer.start(event, function (pointer, touch) {
            pointer.pressingHandler = setTimeout(function () {
                if (pointer.status === 'tapping') {
                    Recognizer.fire(event.target, 'longtap', {
                        touch: touch,
                        touchEvent: event
                    })
                }
                pressRecognizer.cancelPress(pointer)
            }, 500)
            if (event.changedTouches.length !== 1) {
                pointer.status = 0
            }
        })

    },
    touchmove: function (event) {
        Recognizer.move(event, function (pointer) {
            if (pointer.distance > 10 && pointer.pressingHandler) {
                pressRecognizer.cancelPress(pointer)
                if (pointer.status === 'tapping') {
                    pointer.status = 'panning'
                }
            }
        })
    },
    touchend: function (event) {
        Recognizer.end(event, function (pointer, touch) {
            pressRecognizer.cancelPress(pointer)
            if (pointer.status === 'tapping') {
                pointer.lastTime = Date.now()
                if (pressRecognizer.lastTap && pointer.lastTime - pressRecognizer.lastTap.lastTime < 300) {
                    Recognizer.fire(pointer.element, 'doubletap', {
                        touch: touch,
                        touchEvent: event
                    })
                }

                pressRecognizer.lastTap = pointer
            }
        })

    },
    touchcancel: function (event) {
        Recognizer.end(event, function (pointer) {
            pressRecognizer.cancelPress(pointer)
        })
    }
}
Recognizer.add('press', pressRecognizer)