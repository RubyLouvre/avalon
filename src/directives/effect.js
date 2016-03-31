avalon.directive("effect", {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-effect"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var definition = cur.props['ms-effect']
        if (Array.isArray(definition)) {
            cur.props['ms-effect'] = definition = avalon.mix.apply({}, definition)
        }
        if (definition && typeof definition == 'object') {
            if (!pre.props['ms-effect']) {
                var list = cur.afterChange = cur.afterChange || []
                avalon.Array.ensure(list, this.update)
            }
        }
    },
    update: function (dom, vnode) {
        var definition = vnode.props['ms-effect']
        var type = definition.is
        var options = avalon.effects[type]
        var method = definition.method
        var effect = new avalon.Effect(dom)
        if (!type || !options || typeof effect[method] !== 'function')
            return

        if (options.queue && animationQueue.length) {
            animationQueue.push(function () {
                effect[method](options)
            })
        } else {
            effect[method](options)
        }
    }
})
var animationQueue = []
var lock = false
function callNextAniation() {
    animationQueue.shift()
    if (lock)
        return
    lock = true
    var fn = animationQueue[0]
    if (fn) {
        avalon.nextTick(function () {
            lock = false
            fn()
        })
    }
}

avalon.effects = {}
avalon.effect = function (name, define) {
    var obj = avalon.effects[name] = define
    if (supportCssAnimation) {
        if (!obj.enterClass) {
            obj.enterClass = name + '-enter'
        }
        if (!obj.enterActiveClass) {
            obj.enterClass = obj.enterClass + '-active'
        }
        if (!obj.leaveClass) {
            obj.leaveClass = name + '-leave'
        }
        if (!obj.leaveActiveClass) {
            obj.leaveClass = obj.leaveClass + '-active'
        }

    }
    if (obj.dir) {
        obj.dir = 'enter'
    }
    //js 则需要
}


var Effect = function (el) {
    this.el = el
}
avalon.Effect = Effect
Effect.prototype = {
    enter: createMethod('enter'),
    leave: createMethod('leave'),
    move: createMethod('move')
}
function callHooks(options, name, el) {
    var list = options[name]
    list = Array.isArray(list) ? list : typeof list === 'function' ? [list] : []
    list.forEach(function (fn) {
        fn(el)
    })
}
function createMethod(action) {
    var lower = action.toLowerCase()
    return  function (options) {
        function wrapDone(e) {
            var isOk = e !== false
            var dirWord = isOk ? 'Done' : 'Abort'
            callHooks(options, 'on' + action + dirWord, elem)

            el.unbind(transitionEndEvent)
            el.unbind(animationEndEvent)
            el.removeClass(options[lower + 'ActiveClass'])
            callNextAniation()
        }
        var elem = this.el
        callHooks(options, 'onBefore' + action, elem)

        if (options[lower]) {
            options[lower](elem, function (ok) {
                wrapDone(!!ok)
            })
        } else if (supportCssAnimation) {
            var el = avalon(elem)
            el.addClass(options[lower + 'Class'])
            function wrapDone(e) {
                var isOk = e !== false
                var dirWord = isOk ? 'Done' : 'Abort'
                callHooks(options, 'on' + action + dirWord, elem)
                el.unbind(transitionEndEvent)
                el.unbind(animationEndEvent)
                el.removeClass(options[lower + 'ActiveClass'] || '')
                callNextAniation()
            }
            el.bind(transitionEndEvent, wrapDone)
            el.bind(animationEndEvent, wrapDone)
            avalon.nextTick(function () {
                el.addClass(options[lower + 'ActiveClass'])
                var el = window.getComputedStyle(elem)
                var tranDuration = computedStyles[transitionDuration]
                var animDuration = computedStyles[animationDuration]
                if (tranDuration == '0s' && animDuration === '0s') {
                    wrapDone(false)
                }
            })
        }
    }
}


function effectFactory() {

}



var applyEffect = function (el, dir/*[before, [after, [opts]]]*/) {
    var args = aslice.call(arguments, 0)
    if (typeof args[2] !== "function") {
        args.splice(2, 0, noop)
    }
    if (typeof args[3] !== "function") {
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
    append: function (el, parent, after) {
        return applyEffect(el, {
            method: 'enter',
            onBeforeEnter: function () {
                parent.appendChild(el)
            },
            onEnterDone: after
        })
    },
    before: function (el, target, after) {
        return applyEffect(el, {
            method: 'enter',
            onBeforeEnter: function () {
                target.parentNode.insertBefore(el, target)
            },
            onEnterDone: after
        })
    },
    remove: function (el, parent, after) {
        return applyEffect(el, {
            method: 'leave',
            onLeaveDone: [function () {
                    if (el.parentNode === parent) {
                        parent.removeChild(el)
                    }
                }, after]
        })
    }
})
