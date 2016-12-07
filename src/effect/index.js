import { avalon, window, Cache } from '../seed/core'
import { cssDiff } from '../directives/css'
import {
    css3,
    animation,
    transition,
    animationEndEvent,
    transitionEndEvent
} from './detect'

var effectDir = avalon.directive('effect', {
    priority: 5,
    diff: function (effect) {
        var vdom = this.node
        if (typeof effect === 'string') {
            this.value = effect = {
                is: effect
            }
            avalon.warn('ms-effect的指令值不再支持字符串,必须是一个对象')
        }
        this.value = vdom.effect = effect
        var ok = cssDiff.call(this, effect, this.oldValue)
        var me = this
        if (ok) {
            setTimeout(function () {
                vdom.animating = true
                effectDir.update.call(me, vdom, vdom.effect)
            })
            vdom.animating = false
            return true
        }
        return false
    },

    update: function (vdom, change, opts) {
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            //要求配置对象必须指定is属性，action必须是布尔或enter,leave,move
            var option = change || opts
            var is = option.is

            var globalOption = avalon.effects[is]
            if (!globalOption) {//如果没有定义特效
                avalon.warn(is + ' effect is undefined')
                return
            }
            var finalOption = {}
            var action = actionMaps[option.action]
            if (typeof Effect.prototype[action] !== 'function') {
                avalon.warn('action is undefined')
                return
            }
            //必须预定义特效

            var effect = new avalon.Effect(dom)
            avalon.mix(finalOption, globalOption, option, { action })

            if (finalOption.queue) {
                animationQueue.push(function () {
                    effect[action](finalOption)
                })
                callNextAnimation()
            } else {

                effect[action](finalOption)

            }
            return true
        }
    }
})


let move = 'move'
let leave = 'leave'
let enter = 'enter'
var actionMaps = {
    'true': enter,
    'false': leave,
    enter,
    leave,
    move,
    'undefined': enter
}

var animationQueue = []
export function callNextAnimation() {
    var fn = animationQueue[0]
    if (fn) {
        fn()
    }
}

avalon.effects = {}
avalon.effect = function (name, opts) {
    var definition = avalon.effects[name] = (opts || {})
    if (css3 && definition.css !== false) {
        patchObject(definition, 'enterClass', name + '-enter')
        patchObject(definition, 'enterActiveClass', definition.enterClass + '-active')
        patchObject(definition, 'leaveClass', name + '-leave')
        patchObject(definition, 'leaveActiveClass', definition.leaveClass + '-active')
    }
    return definition
}

function patchObject(obj, name, value) {
    if (!obj[name]) {
        obj[name] = value
    }
}

var Effect = function (dom) {
    this.dom = dom
}

avalon.Effect = Effect

Effect.prototype = {
    enter: createAction('Enter'),
    leave: createAction('Leave'),
    move: createAction('Move')
}


function execHooks(options, name, el) {
    var fns = [].concat(options[name])
    for (var i = 0, fn; fn = fns[i++];) {
        if (typeof fn === 'function') {
            fn(el)
        }
    }
}
var staggerCache = new Cache(128)

function createAction(action) {
    var lower = action.toLowerCase()
    return function (option) {
        var dom = this.dom
        var elem = avalon(dom)
        //处理与ms-for指令相关的stagger
        //========BEGIN=====
        var staggerTime = isFinite(option.stagger) ? option.stagger * 1000 : 0
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
        //=======END==========
        var stopAnimationID
        var animationDone = function (e) {
            var isOk = e !== false
            if (--dom.__ms_effect_ === 0) {
                avalon.unbind(dom, transitionEndEvent)
                avalon.unbind(dom, animationEndEvent)
            }
            clearTimeout(stopAnimationID)
            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(option, 'on' + action + dirWord, dom)
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
        //执行开始前的钩子
        execHooks(option, 'onBefore' + action, dom)

        if (option[lower]) {
            //使用JS方式执行动画
            option[lower](dom, function (ok) {
                animationDone(ok !== false)
            })
        } else if (css3) {
            //使用CSS3方式执行动画
            elem.addClass(option[lower + 'Class'])
            elem.removeClass(getNeedRemoved(option, lower))

            if (!dom.__ms_effect_) {
                //绑定动画结束事件
                elem.bind(transitionEndEvent, animationDone)
                elem.bind(animationEndEvent, animationDone)
                dom.__ms_effect_ = 1
            } else {
                dom.__ms_effect_++
            }
            setTimeout(function () {
                //用xxx-active代替xxx类名的方式 触发CSS3动画
                var time = avalon.root.offsetWidth === NaN
                elem.addClass(option[lower + 'ActiveClass'])
                //计算动画时长
                time = getAnimationTime(dom) 
                if (!time === 0) {
                    //立即结束动画
                    animationDone(false)
                } else if (!staggerTime) {
                    //如果动画超出时长还没有调用结束事件,这可能是元素被移除了
                    //如果强制结束动画
                    stopAnimationID = setTimeout(function () {
                        animationDone(false)
                    }, time + 32)
                }
            }, 17 + staggerTime * staggerIndex)// = 1000/60
        }
    }
}

avalon.applyEffect = function (dom, vdom, opts) {
    var cb = opts.cb
    var curEffect = vdom.effect
    if (curEffect && dom && dom.nodeType === 1) {
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
        avalon.directives.effect.update(vdom, curEffect, avalon.shadowCopy({}, opts))

    } else if (cb) {
        cb(dom)
    }
}
/**
 * 获取方向
 */
export function getAction(opts) {
    if (!opts.action) {
        return opts.action = opts.hook.replace(/^on/, '').replace(/Done$/, '').toLowerCase()
    }
}
/**
 * 需要移除的类名
 */
function getNeedRemoved(options, name) {
    var name = name === 'leave' ? 'enter' : 'leave'
    return Array(name + 'Class', name + 'ActiveClass').map(function (cls) {
        return options[cls]
    }).join(' ')
}
/**
 * 计算动画长度
 */
var transitionDuration = avalon.cssName('transition-duration')
var animationDuration = avalon.cssName('animation-duration')
var rsecond = /\d+s$/
export function toMillisecond(str) {
    var ratio = rsecond.test(str) ? 1000 : 1
    return parseFloat(str) * ratio
}

export function getAnimationTime(dom) {
    var computedStyles = window.getComputedStyle(dom,null)
    var tranDuration = computedStyles[transitionDuration]
    var animDuration = computedStyles[animationDuration]
   return toMillisecond(tranDuration) || toMillisecond(animDuration)
}
/**
 * 
<!DOCTYPE html>
<html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <script src="dist/avalon.js"></script>
        <script>
            avalon.effect('animate')
            var vm = avalon.define({
                $id: 'ani',
                a: true
            })
        </script>
        <style>
            .animate-enter, .animate-leave{
                width:100px;
                height:100px;
                background: #29b6f6;
                transition:all 2s;
                -moz-transition: all 2s; 
                -webkit-transition: all 2s;
                -o-transition:all 2s;
            }  
            .animate-enter-active, .animate-leave{
                width:300px;
                height:300px;
            }
            .animate-leave-active{
                width:100px;
                height:100px;
            }
        </style>
    </head>
    <body>
        <div :controller='ani' >
            <p><input type='button' value='click' :click='@a =!@a'></p>
            <div :effect="{is:'animate',action:@a}"></div>
        </div>
</body>
</html>
 * 
 */