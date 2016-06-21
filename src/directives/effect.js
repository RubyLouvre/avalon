var support = require('../effect/index')
var Cache = require('../seed/cache')
var update = require('./_update')

avalon.directive('effect', {
    priority: 5,
    diff: function (copy, src, name) {
        var copyObj = copy[name]
        copyObj = copy.$model || copyObj
        if(typeof copyObj === 'string'){
            var is = copyObj
            copyObj = {
                is: is
            }
           
        }else if (Array.isArray(copyObj)) {
            copyObj = avalon.mix.apply({}, copyObj)
        }
    
        copyObj.action = copyObj.action || 'enter'
       
        if (Object(copyObj) === copyObj) {
            var srcObj = src[name]
            if ( Object(srcObj) !== srcObj || diffObj(copyObj, srcObj ))  {
                src[name] = copyObj
                update(src, this.update, 'afterChange')
            }
        }
        delete copy[name]
    },
    update: function (dom, vnode, parent, option) {
        if(dom.animating ){
            return
        }
        dom.animating = true
        var localeOption = vnode['ms-effect']
        var type = localeOption.is
        option = option || {}
        if(!type){//如果没有指定类型
            return avalon.warn('need is option')
        }
      
        var effects = avalon.effects
        if(support.css && !effects[type]){
            avalon.effect(type, {})
        }
        var globalOption = effects[type]
        if(!globalOption){//如果没有定义特效
            return avalon.warn(type+' effect is undefined')
        }
        var action = option.action || localeOption.action
        var Effect = avalon.Effect
        if (typeof Effect.prototype[action] !== 'function'){
            return avalon.warn(action+' action is undefined')
        }   
        var effect = new Effect(dom)
        var finalOption = avalon.mix(option, globalOption, localeOption)
        if (finalOption.queue) {
            animationQueue.push(function () {
                effect[action](finalOption)
            })
            callNextAnimation()
        } else {
            setTimeout(function(){
               effect[action](finalOption)
            },4)
        }
    }
})
function diffObj(a, b){
    for(var i in a){
        if(a[i] !== b[i])
            return true
    }
    return false
}

var animationQueue = []
function callNextAnimation() {
    if (animationQueue.lock)
        return
    var fn = animationQueue[0]
    if (fn) {
       callNextAnimation.lock = true
       fn()
    }
}

avalon.effects = {}
//这里定义CSS动画


avalon.effect = function (name, definition) {
    avalon.effects[name] = definition || {}
    if (support.css) {
        if (!definition.enterClass) {
            definition.enterClass = name + '-enter'
        }
        if (!definition.enterActiveClass) {
            definition.enterActiveClass = definition.enterClass + '-active'
        }
        if (!definition.leaveClass) {
            definition.leaveClass = name + '-leave'
        }
        if (!definition.leaveActiveClass) {
            definition.leaveActiveClass = definition.leaveClass + '-active'
        }
    }
    if (!definition.action) {
        definition.action = 'enter'
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
function toMillisecond(str){
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
        var enterAnimateDone
        var staggerTime = isFinite(option.stagger) ? option.stagger * 1000 : 0
        if(staggerTime){
            if(option.staggerKey){
                var stagger = staggerCache.get(option.staggerKey) || 
                        staggerCache.put(option.staggerKey, {
                    count:0,
                    items:0
                })
                stagger.count++
                stagger.items++
            }
        }
        var staggerIndex = stagger && stagger.count || 0
        var animationDone = function(e) {
            var isOk = e !== false
            elem.animating = void 0
            enterAnimateDone = true
            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(option, 'on' + action + dirWord, elem)
            avalon.unbind(elem,support.transitionEndEvent)
            avalon.unbind(elem,support.animationEndEvent)
            if(stagger){
                if(--stagger.items === 0){
                    stagger.count = 0
                }
            }
            if(option.queue){
                animationQueue.lock = false
                animationQueue.shift()
                callNextAnimation()
            }
        }
        execHooks(option, 'onBefore' + action, elem)

        if (option[lower]) {
            option[lower](elem, function (ok) {
                animationDone(ok !== false)
            })
        } else if (support.css) {
            
            $el.addClass(option[lower + 'Class'])
            if(lower === 'leave'){
                $el.removeClass(option.enterClass+' '+option.enterActiveClass)
            }else if(lower === 'enter'){
                $el.removeClass(option.leaveClass+' '+option.leaveActiveClass)
            }

            $el.bind(support.transitionEndEvent, animationDone)
            $el.bind(support.animationEndEvent, animationDone)
            setTimeout(function () {
                enterAnimateDone = avalon.root.offsetWidth === NaN
                $el.addClass(option[lower + 'ActiveClass'])
                var computedStyles = window.getComputedStyle(elem)
                var tranDuration = computedStyles[support.transitionDuration]
                var animDuration = computedStyles[support.animationDuration]
                var time = toMillisecond(tranDuration) || toMillisecond(animDuration)
                if (!time === 0) {
                    animationDone(false)
                }else if(!staggerTime ){
                    setTimeout(function(){
                        if(!enterAnimateDone){
                            animationDone(false)
                        }
                    },time + 130 )
                }
            }, 17+ staggerTime * staggerIndex)// = 1000/60
        }
    }
}

avalon.applyEffect = function(node, vnode, opts){
    var cb = opts.cb
    var hook = opts.hook
    var curEffect = vnode['ms-effect']
    if(curEffect && !avalon.document.hidden ){
        var old = curEffect[hook]
        if(cb){
            if(Array.isArray(old)){
                old.push(cb)
            }else if(old){
                curEffect[hook] = [old, cb]
            }else{
                curEffect[hook] = [cb]
            }
        }
        getAction(opts)
        node.animate = true
        avalon.directives.effect.update(node,vnode, 0, avalon.shadowCopy({},opts) ) 

    }else if(cb){
        cb()
    }
}

function getAction(opts){
    if(!opts.acton){
        opts.action = opts.hook.replace(/^on/,'').replace(/Done$/,'').toLowerCase()
    }
}

