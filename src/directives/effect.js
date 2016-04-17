var support = require('../effect/index')
avalon.directive('effect', {
    priority:1,
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-effect"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var curObj = cur.props[name]
        if(typeof curObj === 'string'){
            var is = curObj
            curObj = cur.props[name] = {
                is: is
            }
           
        }else if (Array.isArray(curObj)) {
            curObj = cur.props[name] = avalon.mix.apply({}, curObj)
        }
    
        curObj.action = curObj.action || 'enter'
       
        if (Object(curObj) === curObj) {
            var preObj = pre.props[name]
            if ( Object(preObj) !== preObj || diffObj(curObj, preObj ))  {
                var list = cur.afterChange = cur.afterChange || []
                if(avalon.Array.ensure(list, this.update)){
                   steps.count += 1
                }
            }
        }
    },
    update: function (dom, vnode, parent, action) {
        var localeOption = vnode.props['ms-effect']
        var type = localeOption.is
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
        action = action || localeOption.action
        var Effect = avalon.Effect
        if (typeof Effect.prototype[action] !== 'function'){
            return avalon.warn(action+' action is undefined')
        }   
        var effect = new Effect(dom)
        var finalOption = avalon.mix({}, globalOption, localeOption)
        if (finalOption.queue && animationQueue.length) {
            animationQueue.push(function () {
                effect[action](finalOption)
            })
        } else {
            effect[action](finalOption)
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
//这里定义CSS动画
avalon.effect = function (name, definition) {
    avalon.effects[name] = definition
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
function createAction(action) {
    var lower = action.toLowerCase()
    return function (options) {
        var elem = this.el
        var $el = avalon(elem)
        var enterAnimateDone

        var animationDone = function(e) {
            var isOk = e !== false
            enterAnimateDone = true
            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(options, 'on' + action + dirWord, elem)
            avalon.unbind(elem,support.transitionEndEvent)
            avalon.unbind(elem,support.animationEndEvent)
            callNextAniation()
        }
        execHooks(options, 'onBefore' + action, elem)

        if (options[lower]) {
            options[lower](elem, function (ok) {
                animationDone(ok !== false)
            })
        } else if (support.css) {
            
            $el.addClass(options[lower + 'Class'])
            if(lower === 'leave'){
                $el.removeClass(options.enterClass+' '+options.enterActiveClass)
            }else if(lower === 'enter'){
                $el.removeClass(options.leaveClass+' '+options.leaveActiveClass)
            }
            $el.bind(support.transitionEndEvent, animationDone)
            $el.bind(support.animationEndEvent, animationDone)
            setTimeout(function () {
                enterAnimateDone = avalon.root.offsetWidth === NaN
                $el.addClass(options[lower + 'ActiveClass'])
                var computedStyles = window.getComputedStyle(elem)
                var tranDuration = computedStyles[support.transitionDuration]
                var animDuration = computedStyles[support.animationDuration]
                var time = toMillisecond(tranDuration) || toMillisecond(animDuration)
                if (!time === 0) {
                    animationDone(false)
                }else{
                    setTimeout(function(){
                        if(!enterAnimateDone){
                            animationDone(false)
                        }
                    },time + 17)
                }
                //console.log(tranDuration , animDuration)
            }, 17)// = 1000/60
        }
    }
}

avalon.applyEffect = function(node, vnode, type, callback){
    var hasEffect = vnode.props && vnode.props['ms-effect']
    if(hasEffect){
        var old = hasEffect[type]
        if(Array.isArray(old)){
            old.push(callback)
        }else if(old){
             hasEffect[type] = [old, callback]
        }else{
             hasEffect[type] = [callback]
        }
        var action = type.replace(/^on/,'').replace(/Done$/,'').toLowerCase()
        avalon.directives.effect.update(node, vnode, 0,  action)
    }else{
        callback()
    }
}

