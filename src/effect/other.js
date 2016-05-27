function effectFactory() {

}



var applyEffect = function (el, dir/*[before, [after, [opts]]]*/) {
    var args = aslice.call(arguments, 0)
    if (typeof args[2] !== 'function') {
        args.splice(2, 0, noop)
    }
    if (typeof args[3] !== 'function') {
        args.splice(3, 0, noop)
    }
    var before = args[2]
    var after = args[3]
    var opts = args[4]
    var effect = effectFactory(el)
    if (!effect) {//没有动画
        before()
        after()
        return false
    }
}

avalon.shadowCopy(avalon.effect, {
    apply: applyEffect,
    append: function (el, parent, before, after) {
        return applyEffect(el, {
            method: 'enter',
            onBeforeEnter: [function () {
                parent.appendChild(el)
            }, before],
            onEnterDone: after
        })
    },
    before: function (el, target, before, after) {
        return applyEffect(el, {
            method: 'enter',
            onBeforeEnter: [function () {
                target.parentNode.insertBefore(el, target)
            }, before ],
            onEnterDone: after
        })
    },
    remove: function (el, parent, before, after) {
        return applyEffect(el, {
            method: 'leave',
            onBeforeLeave: before,
            onLeaveDone: [function () {
                    if (el.parentNode === parent) {
                        parent.removeChild(el)
                    }
                }, after]
        })
    }
})
