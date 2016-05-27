var Recognizer = require('./recognizer')

var dragRecognizer = {
    events: ['dragstart', 'drag', 'dragend'],
    touchstart: function (event) {
        Recognizer.start(event, avalon.noop)
    },
    touchmove: function (event) {
        Recognizer.move(event, function (pointer, touch) {
            var extra = {
                deltaX: pointer.deltaX,
                deltaY: pointer.deltaY,
                touch: touch,
                touchEvent: event,
                isVertical: pointer.isVertical
            }
            if ((pointer.status === 'tapping') && pointer.distance > 10) {
                pointer.status = 'panning'
                Recognizer.fire(pointer.element, 'dragstart', extra)
            } else if (pointer.status === 'panning') {
                Recognizer.fire(pointer.element, 'drag', extra)
            }
        })

        event.preventDefault();
    },
    touchend: function (event) {
        Recognizer.end(event, function (pointer, touch) {
            if (pointer.status === 'panning') {
                Recognizer.fire(pointer.element, 'dragend', {
                    deltaX: pointer.deltaX,
                    deltaY: pointer.deltaY,
                    touch: touch,
                    touchEvent: event,
                    isVertical: pointer.isVertical
                })
            }
        })
        Recognizer.pointers = {}
    }
}
dragRecognizer.touchcancel = dragRecognizer.touchend

Recognizer.add('drag', dragRecognizer)
