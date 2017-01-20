avalon.directive("effect", {
    priority: 5,
    init: function (binding) {
        var text = binding.expr,
                className,
                rightExpr
        var colonIndex = text.replace(rexprg, function (a) {
            return a.replace(/./g, "0")
        }).indexOf(":") //取得第一个冒号的位置
        if (colonIndex === -1) { // 比如 ms-class/effect="aaa bbb ccc" 的情况
            className = text
            rightExpr = true
        } else { // 比如 ms-class/effect-1="ui-state-active:checked" 的情况
            className = text.slice(0, colonIndex)
            rightExpr = text.slice(colonIndex + 1)
        }
        if (!rexpr.test(text)) {
            className = quote(className)
        } else {
            className = normalizeExpr(className)
        }
        binding.expr = "[" + className + "," + rightExpr + "]"
    },
    update: function (arr) {
        var name = arr[0]
        var elem = this.element
        if (elem.getAttribute("data-effect-name") === name) {
            return
        } else {
            elem.removeAttribute("data-effect-driver")
        }
        var inlineStyles = elem.style
        var computedStyles = window.getComputedStyle ? window.getComputedStyle(elem) : null
        var useAni = false
        if (computedStyles && (supportTransition || supportAnimation)) {

            //如果支持CSS动画
            var duration = inlineStyles[transitionDuration] || computedStyles[transitionDuration]
            if (duration && duration !== '0s') {
                elem.setAttribute("data-effect-driver", "t")
                useAni = true
            }

            if (!useAni) {

                duration = inlineStyles[animationDuration] || computedStyles[animationDuration]
                if (duration && duration !== '0s') {
                    elem.setAttribute("data-effect-driver", "a")
                    useAni = true
                }

            }
        }

        if (!useAni) {
            if (avalon.effects[name]) {
                elem.setAttribute("data-effect-driver", "j")
                useAni = true
            }
        }
        if (useAni) {
            elem.setAttribute("data-effect-name", name)
        }
    }
})

avalon.effects = {}
avalon.effect = function (name, callbacks) {
    avalon.effects[name] = callbacks
}



var supportTransition = false
var supportAnimation = false

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
        animationEndEvent = ani
    }

}()

var effectPool = []//重复利用动画实例
function effectFactory(el, opts) {
    if (!el || el.nodeType !== 1) {
        return null
    }
    if (opts) {
        var name = opts.effectName
        var driver = opts.effectDriver
    } else {
        name = el.getAttribute("data-effect-name")
        driver = el.getAttribute("data-effect-driver")
    }
    if (!name || !driver) {
        return null
    }

    var instance = effectPool.pop() || new Effect()
    instance.el = el
    instance.driver = driver
    instance.useCss = driver !== "j"
    if (instance.useCss) {
        opts && avalon(el).addClass(opts.effectClass)
        instance.cssEvent = driver === "t" ? transitionEndEvent : animationEndEvent
    }
    instance.name = name
    instance.callbacks = avalon.effects[name] || {}

    return instance


}

function effectBinding(elem, binding) {
    var name = elem.getAttribute("data-effect-name")
    if (name) {
        binding.effectName = name
        binding.effectDriver = elem.getAttribute("data-effect-driver")
        var stagger = +elem.getAttribute("data-effect-stagger")
        binding.effectLeaveStagger = +elem.getAttribute("data-effect-leave-stagger") || stagger
        binding.effectEnterStagger = +elem.getAttribute("data-effect-enter-stagger") || stagger
        binding.effectClass = elem.className || NaN
    }
}
function upperFirstChar(str) {
    return str.replace(/^[\S]/g, function (m) {
        return m.toUpperCase()
    })
}
var effectBuffer = new Buffer()
function Effect() {
}//动画实例,做成类的形式,是为了共用所有原型方法

Effect.prototype = {
    contrustor: Effect,
    enterClass: function () {
        return getEffectClass(this, "enter")
    },
    leaveClass: function () {
        return getEffectClass(this, "leave")
    },
    // 共享一个函数
    actionFun: function (name, before, after) {
        if (document.hidden) {
            return
        }
        var me = this
        var el = me.el
        var isLeave = name === "leave"
        name = isLeave ? "leave" : "enter"
        var oppositeName = isLeave ? "enter" : "leave"
        callEffectHook(me, "abort" + upperFirstChar(oppositeName))
        callEffectHook(me, "before" + upperFirstChar(name))
        if (!isLeave)
            before(el) //这里可能做插入DOM树的操作,因此必须在修改类名前执行
        var cssCallback = function (cancel) {
            avalon.unbind(el, me.cssEvent, me.cssCallback)
            if (isLeave) {
                before(el) //这里可能做移出DOM树操作,因此必须位于动画之后
                avalon(el).removeClass(me.cssClass)
            } else {
                if (me.driver === "a") {
                    avalon(el).removeClass(me.cssClass)
                }
            }
            if (cancel !== true) {
                callEffectHook(me, "after" + upperFirstChar(name))
                after && after(el)
            }
            me.dispose()
        }
        if (me.useCss) {
            if (me.cssCallback) { //如果leave动画还没有完成,立即完成
                me.cssCallback(true)
            }

            me.cssClass = getEffectClass(me, name)
            me.cssCallback = cssCallback

            me.update = function () {
                avalon.bind(el, me.cssEvent, me.cssCallback)
                if (!isLeave && me.driver === "t") {//transtion延迟触发
                    avalon(el).removeClass(me.cssClass)
                }
            }
            avalon(el).addClass(me.cssClass)//animation会立即触发

            effectBuffer.render(true)
            effectBuffer.queue.push(me)

        } else {
            callEffectHook(me, name, cssCallback)

        }
    },
    enter: function (before, after) {
        this.actionFun.apply(this, ["enter"].concat(avalon.slice(arguments)))

    },
    leave: function (before, after) {
        this.actionFun.apply(this, ["leave"].concat(avalon.slice(arguments)))

    },
    dispose: function () {//销毁与回收到池子中
        this.update = this.cssCallback = null
        if (effectPool.unshift(this) > 100) {
            effectPool.pop()
        }
    }


}


function getEffectClass(instance, type) {
    var a = instance.callbacks[type + "Class"]
    if (typeof a === "string")
        return a
    if (typeof a === "function")
        return a()
    return instance.name + "-" + type
}


function callEffectHook(effect, name, cb) {
    var hook = effect.callbacks[name]
    if (hook) {
        hook.call(effect, effect.el, cb)
    }
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

avalon.mix(avalon.effect, {
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
