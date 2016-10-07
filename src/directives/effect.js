var support = require('../effect/index')
var Cache = require('../seed/cache')
var update = require('./_update')

avalon.directive('effect', {
    priority: 5,
    diff: function (copy, src, name) {
        var is = copy[name]
        if (typeof is === 'string') {
            copy[name] = {
                is: is
            }
            avalon.warn('ms-effect的指令值不再支持字符串,必须是一个对象')
        }
        avalon.directives.css.diff.call(this, copy, src, name, 'afterChange')
    },
    update: function (dom, vdom, parent, opts) {
        /* istanbul ignore if */
        if (dom && dom.nodeType === 1) {
            var name = 'ms-effect'
            var option = vdom[name] || opts || {}
            vdom.dynamic[name] = 1
            var type = option.is
            /* istanbul ignore if */
            if (!type) {//如果没有指定类型
                return avalon.warn('need is option')
            }
            var effects = avalon.effects
            /* istanbul ignore if */
            if (support.css && !effects[type]) {
                avalon.effect(type)
            }
            var globalOption = effects[type]
            /* istanbul ignore if */
            if (!globalOption) {//如果没有定义特效
                return avalon.warn(type + ' effect is undefined')
            }
            var finalOption = {}
            var action = option.action
            if (typeof action === 'boolean') {
                finalOption.action = action ? 'enter' : 'leave'
            }
            var Effect = avalon.Effect
            /* istanbul ignore if */

            var effect = new Effect(dom)
            avalon.mix(finalOption, globalOption, option)
            dom.animating = finalOption.action
            /* istanbul ignore if */
            /* istanbul ignore else */
            if (finalOption.queue) {
                animationQueue.push(function () {
                    effect[action](finalOption)
                })
                callNextAnimation()
            } else {
                setTimeout(function () {
                    effect[action](finalOption)
                }, 4)
            }
        }
    }
})


var animationQueue = []
function callNextAnimation() {
    var fn = animationQueue[0]
    if (fn) {
        fn()
    }
}

avalon.effects = {}
//这里定义CSS动画


avalon.effect = function (name, opts) {
    var definition = avalon.effects[name] = (opts || {})
    if (support.css && definition.css !== false) {
        patchObject(definition, 'enterClass', name + '-enter')
        patchObject(definition, 'enterActiveClass', definition.enterClass + '-active')
        patchObject(definition, 'leaveClass', name + '-leave')
        patchObject(definition, 'leaveActiveClass', definition.leaveClass + '-active')

    }
    patchObject(definition, 'action', 'enter')

}
function patchObject(obj, name, value) {
    if (!obj[name]) {
        obj[name] = value
    }
}

var Effect = function (el) {
    this.el = el
}
avalon.Effect = Effect
Effect.prototype = {
    enter: createAction('Enter'),
    leave: createAction('Leave'),
    move: createAction('Move')
}

var rsecond = /\d+s$/
function toMillisecond(str) {
    var ratio = rsecond.test(str) ? 1000 : 1
    return parseFloat(str) * ratio
}

function execHooks(options, name, el) {
    var list = options[name]
    list = Array.isArray(list) ? list : typeof list === 'function' ? [list] : []
    list.forEach(function (fn) {
        fn && fn(el)
    })
}
var staggerCache = new Cache(128)

function createAction(action) {
    var lower = action.toLowerCase()
    return function (option) {
        var elem = this.el
        var $el = avalon(elem)
        var isAnimateDone
        var staggerTime = isFinite(option.stagger) ? option.stagger * 1000 : 0
        /* istanbul ignore if */
        if (staggerTime) {
            if (option.staggerKey) {
                var stagger = staggerCache.get(option.staggerKey) ||
                        staggerCache.put(option.staggerKey, {
                            count: 0,
                            items: 0
                        })
                stagger.count++
                stagger.items++
            }
        }
        var staggerIndex = stagger && stagger.count || 0
        var animationDone = function (e) {
            var isOk = e !== false
            if (--elem.__ms_effect_ === 0) {
                avalon.unbind(elem, support.transitionEndEvent)
                avalon.unbind(elem, support.animationEndEvent)
            }
            elem.animating = void 0
            isAnimateDone = true
            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(option, 'on' + action + dirWord, elem)

            if (stagger) {
                if (--stagger.items === 0) {
                    stagger.count = 0
                }
            }
            if (option.queue) {
                animationQueue.shift()
                callNextAnimation()
            }
        }
        execHooks(option, 'onBefore' + action, elem)
        /* istanbul ignore if */
        /* istanbul ignore else */
        if (option[lower]) {
            option[lower](elem, function (ok) {
                animationDone(ok !== false)
            })
        } else if (support.css) {
            $el.addClass(option[lower + 'Class'])
            if (lower === 'leave') {
                $el.removeClass(option.enterClass + ' ' + option.enterActiveClass)
            } else if (lower === 'enter') {
                $el.removeClass(option.leaveClass + ' ' + option.leaveActiveClass)
            }
            if (!elem.__ms_effect_) {
                $el.bind(support.transitionEndEvent, animationDone)
                $el.bind(support.animationEndEvent, animationDone)
                elem.__ms_effect_ = 1
            } else {
                elem.__ms_effect_++
            }
            setTimeout(function () {
                isAnimateDone = avalon.root.offsetWidth === NaN
                $el.addClass(option[lower + 'ActiveClass'])
                var computedStyles = window.getComputedStyle(elem)
                var tranDuration = computedStyles[support.transitionDuration]
                var animDuration = computedStyles[support.animationDuration]
                var time = toMillisecond(tranDuration) || toMillisecond(animDuration)
                if (!time === 0) {
                    animationDone(false)
                } else if (!staggerTime) {
                    setTimeout(function () {
                        if (!isAnimateDone) {
                            animationDone(false)
                        }
                    }, time + 32)
                }
            }, 17 + staggerTime * staggerIndex)// = 1000/60
        }
    }
}

avalon.applyEffect = function (node, vnode, opts) {
    var cb = opts.cb
    var curEffect = vnode['ms-effect']
    if (curEffect && node && node.nodeType === 1) {
        var hook = opts.hook
        var old = curEffect[hook]
        if (cb) {
            if (Array.isArray(old)) {
                old.push(cb)
            } else if (old) {
                curEffect[hook] = [old, cb]
            } else {
                curEffect[hook] = [cb]
            }
        }
        getAction(opts)
        avalon.directives.effect.update(node, vnode, 0, avalon.shadowCopy({}, opts))

    } else if (cb) {
        cb(node)
    }
}

function getAction(opts) {
    if (!opts.action) {
        opts.action = opts.hook.replace(/^on/, '').replace(/Done$/, '').toLowerCase()
    }
}

