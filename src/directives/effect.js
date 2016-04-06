var support = require('../effect/index')
avalon.directive('effect', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-effect"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var curObj = cur.props[name]
        if(typeof curObj === 'string'){
            var is = curObj
            curObj = cur.props['ms-effect'] = {
                is: is,
                action: 'enter'
            }
           
        }else if (Array.isArray(curObj)) {
            curObj = cur.props[name] = avalon.mix.apply({}, curObj)
        }
        if (Object(curObj) == curObj) {
            var preObj = pre.props[name]
            if ( Object(preObj) !== preObj || diffObj(curObj, preObj ))  {
                var list = cur.afterChange = cur.afterChange || []
                avalon.Array.ensure(list, this.update)
                steps.count += 1
            }
        }
    },
    update: function (dom, vnode) {
        var definition = vnode.props['ms-effect']
        var type = definition.is
        
        var effects = avalon.effects
        if(support.css && !effects[type]){
            avalon.effect(type, {})
        }
        var options = effects[type]
        var action = definition.action

        var effect = new avalon.Effect(dom)
        if (!type || !options || typeof effect[action] !== 'function'){
            return
        }   
       
        if (options.queue && animationQueue.length) {
            animationQueue.push(function () {
                effect[action](options)
            })
        } else {
            effect[action](options)
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
    enter: createMethod('Enter'),
    leave: createMethod('Leave'),
    move: createMethod('Move')
}
function execHooks(options, name, el) {
    var list = options[name]
    list = Array.isArray(list) ? list : typeof list === 'function' ? [list] : []
    list.forEach(function (fn) {
       fn && fn(el)
    })
}
function createMethod(action) {
    var lower = action.toLowerCase()
    return function (options) {
        var elem = this.el
        var $el = avalon(elem)
        var animationDone = function(e) {
            var isOk = e !== false
            var dirWord = isOk ? 'Done' : 'Abort'
            execHooks(options, 'on' + action + dirWord, elem)
            $el.unbind(support.transitionEndEvent)
            $el.unbind(support.animationEndEvent)
            callNextAniation()
        }
       
        execHooks(options, 'onBefore' + action, elem)

        if (options[lower]) {
            options[lower](elem, function (ok) {
                animationDone(!!ok)
            })
        } else if (support.css) {
            
            $el.addClass(options[lower + 'Class'])
            if(lower === 'leave'){
                $el.removeClass(options.enterClass)
                $el.removeClass(options.enterActiveClass)
            }else if(lower === 'enter'){
                $el.removeClass(options.leaveClass)
                $el.removeClass(options.leaveActiveClass)
            }
            $el.bind(support.transitionEndEvent, animationDone)
            $el.bind(support.animationEndEvent, animationDone)
            setTimeout(function () {
                var forceReflow = avalon.root.offsetWidth
                $el.addClass(options[lower + 'ActiveClass'])
                var computedStyles = window.getComputedStyle(elem)
                var tranDuration = computedStyles[support.transitionDuration]
                var animDuration = computedStyles[support.animationDuration]
                if (tranDuration === '0s' && animDuration === '0s') {
                    animationDone(false)
                }
            }, 17)// = 1000/60
        }
    }
}



