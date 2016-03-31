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

        if (options.queue) {
            if (animationQueue.length) {
                animationQueue.push(function () {
                    effect[method](dom, options)
                })
            } else {
                effect[method](dom, options)
            }
        } else {
            effect[method](dom, options)
        }
    }
})
var animationQueue = []
var lock = false
function callNextAniation() {
    if (lock)
        return
    lock = true
    var fn = animationQueue.shift()
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

function createMethod(action) {
    var lower = action.toLowerCase()
    return  function (options) {
        function wrapDone(e) {
            var isOk = e !== false
            var dirWord = isOk ? 'Done' : 'Abort'
            var callback = options['on' + action + dirWord]
            callback = callback || noop
            callback.call(elem, {
                type: action + dirWord.toLowerCase(),
                target: elem
            })
            el.unbind(transitionEndEvent)
            el.unbind(animationEndEvent)
            el.removeClass(options[lower + 'ActiveClass'])
            callNextAniation()
        }
        var elem = this.el
        var onBeforeEnter = options['onBefore' + action]
        if (onBeforeEnter) {
            onBeforeEnter.call(elem, {type: 'before' + lower, target: elem})
        }
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
                var callback = options['on' + action + dirWord]
                callback = callback || noop
                callback.call(elem, {
                    type: action + dirWord.toLowerCase(),
                    target: elem
                })
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



var supportTransition = false
var supportAnimation = false
var supportCssAnimation = false

var transitionEndEvent
var animationEndEvent
var transitionDuration = avalon.cssName("transition-duration")
var animationDuration = avalon.cssName("animation-duration")
new function () {// jshint ignore:line
    var checker = {
        'TransitionEvent': 'transitionend',
        'WebKitTransitionEvent': 'webkitTransitionEnd',
        'OTransitionEvent': 'oTransitionEnd',
        'otransitionEvent': 'otransitionEnd'
    }
    var tran
    //有的浏览器同时支持私有实现与标准写法，比如webkit支持前两种，Opera支持1、3、4
    for (var name in checker) {
        if (window[name]) {
            tran = checker[name]
            break;
        }
        try {
            var a = document.createEvent(name);
            tran = checker[name]
            break;
        } catch (e) {
        }
    }
    if (typeof tran === "string") {
        supportTransition = true
        supportCssAnimation = true
        transitionEndEvent = tran
    }

    //大致上有两种选择
    //IE10+, Firefox 16+ & Opera 12.1+: animationend
    //Chrome/Safari: webkitAnimationEnd
    //http://blogs.msdn.com/b/davrous/archive/2011/12/06/introduction-to-css3-animat ions.aspx
    //IE10也可以使用MSAnimationEnd监听，但是回调里的事件 type依然为animationend
    //  el.addEventListener("MSAnimationEnd", function(e) {
    //     alert(e.type)// animationend！！！
    // })
    checker = {
        'AnimationEvent': 'animationend',
        'WebKitAnimationEvent': 'webkitAnimationEnd'
    }
    var ani;
    for (name in checker) {
        if (window[name]) {
            ani = checker[name];
            break;
        }
    }
    if (typeof ani === "string") {
        supportTransition = true
        supportCssAnimation = true
        animationEndEvent = ani
    }


}()



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
    var effect = effectFactory(el, opts)
    if (!effect) {
        before()
        after()
        return false
    } else {
        var method = dir ? 'enter' : 'leave'
        effect[method](before, after)
    }
}

avalon.shadowCopy(avalon.effect, {
    apply: applyEffect,
    append: function (el, parent, after, opts) {
        return applyEffect(el, 1, function () {
            parent.appendChild(el)
        }, after, opts)
    },
    before: function (el, target, after, opts) {
        return applyEffect(el, 1, function () {
            target.parentNode.insertBefore(el, target)
        }, after, opts)
    },
    remove: function (el, parent, after, opts) {
        return applyEffect(el, 0, function () {
            if (el.parentNode === parent)
                parent.removeChild(el)
        }, after, opts)
    }
})
