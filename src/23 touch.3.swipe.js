var swipeRecognizer = {
    events: ['swipe', 'swipeleft', 'swiperight', 'swipeup', 'swipedown'],
    getAngle: function (x, y ) {
       return Math.atan2(y, x) * 180 / Math.PI
    },
    getDirection: function (x, y) {
        var angle = swipeRecognizer.getAngle(x, y)
        if ((angle < -45) && (angle > -135)) {
            return "up"
        } else if ((angle >= 45) && (angle < 315)) {
            return "down"
        } else if ((angle > -45) && (angle <= 45)) {
            return "right"
        } else{
            return "left"
        }
    },
    touchstart: function (event) {
        Recognizer.start(event, noop)
    },
    touchmove: function (event) {
        Recognizer.move(event, noop)
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
