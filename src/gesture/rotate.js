var Recognizer = require('./recognizer')

var rotateRecognizer = {
    events: ['rotate', 'rotatestart', 'rotateend'],
    getAngle180: function (p1, p2) {
        // 角度， 范围在{0-180}， 用来识别旋转角度
        var agl = Math.atan((p2.pageY - p1.pageY) * -1 / (p2.pageX - p1.pageX)) * (180 / Math.PI)
        return parseInt((agl < 0 ? (agl + 180) : agl), 10)
    },
    rotate: function (event, status) {
        var finger = rotateRecognizer.finger
        var endAngel = rotateRecognizer.getAngle180(rotateRecognizer.center, finger.lastTouch)
        var diff = rotateRecognizer.startAngel - endAngel
        var direction = (diff > 0 ? 'right' : 'left')
        var count = 0;
        var __rotation = ~~finger.element.__rotation
        while (Math.abs(diff - __rotation) > 90 && count++ < 50) {
            if (__rotation < 0) {
                diff -= 180
            } else {
                diff += 180
            }
        }
        var rotation = finger.element.__rotation = __rotation = diff
        rotateRecognizer.endAngel = endAngel
        var extra = {
            touch: event.changedTouches[0],
            touchEvent: event,
            rotation: rotation,
            direction: direction
        }
        if (status === "end") {
            Recognizer.fire(finger.element, 'rotateend', extra)
            finger.element.__rotation = 0
        } else if (finger.status === 'tapping' && diff) {
            finger.status = "panning"
            Recognizer.fire(finger.element, 'rotatestart', extra)
        } else {
            Recognizer.fire(finger.element, 'rotate', extra)
        }
    },
    touchstart: function (event) {
        var pointers = Recognizer.pointers
        Recognizer.start(event, avalon.noop)
        var finger
        for (var p in pointers) {
            if (pointers[p].startTime) {
                if (!finger) {
                    finger = pointers[p]
                } else {//如果超过一个指头就中止旋转
                    return
                }
            }
        }
        rotateRecognizer.finger = finger
        var el = finger.element
        var docOff = avalon(el).offset()
        rotateRecognizer.center = {//求得元素的中心
            pageX: docOff.left + el.offsetWidth / 2,
            pageY: docOff.top + el.offsetHeight / 2
        }
        rotateRecognizer.startAngel = rotateRecognizer.getAngle180(rotateRecognizer.center, finger.startTouch)
    },
    touchmove: function (event) {
        Recognizer.move(event, avalon.noop)
        rotateRecognizer.rotate(event)
    },
    touchend: function (event) {
        rotateRecognizer.rotate(event, "end")
        Recognizer.end(event, avalon.noop)
    }
}

rotateRecognizer.touchcancel = rotateRecognizer.touchend

Recognizer.add('rotate', rotateRecognizer)