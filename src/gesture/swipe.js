var Recognizer = require('./recognizer')

var swipeRecognizer = {
    events: ['swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown'],
    getAngle: function (x, y ) {
       return Math.atan2(y, x) * 180 / Math.PI
    },
    getDirection: function (x, y) {
        if (abs(x) >= abs(y)) {
           return x < 0 ? 'left' : 'right';
        }
        return y < 0 ? 'up' : 'down';
    },
    touchstart: function (event) {
        Recognizer.start(event, avalon.noop)
    },
    touchmove: function (event) {
        Recognizer.move(event, avalon.noop)
    },
    touchend: function (event) {
        if(event.changedTouches.length !== 1){
            return
        }
        Recognizer.end(event, function (pointer, touch) {
            var isflick = (pointer.distance > 30 && pointer.distance / pointer.duration > 0.65)
            if (isflick) {
                var extra = {
                    deltaX : pointer.deltaX,
                    deltaY: pointer.deltaY,
                    touch: touch,
                    touchEvent: event,
                    direction:  swipeRecognizer.getDirection(pointer.deltaX, pointer.deltaY),
                    isVertical: pointer.isVertical
                }
                var target = pointer.element
                Recognizer.fire(target, 'swipe', extra)
                Recognizer.fire(target, 'swipe' + extra.direction, extra)
            }
        })
    }
}

swipeRecognizer.touchcancel = swipeRecognizer.touchend
Recognizer.add('swipe', swipeRecognizer)
