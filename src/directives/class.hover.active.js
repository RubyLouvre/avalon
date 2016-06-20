//根据VM的属性值或表达式的值切换类名，ms-class='xxx yyy zzz:flag'
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
var markID = require('../seed/lang.share').getLongID
var update = require('./_update')

function classNames() {
    var classes = []
    for (var i = 0; i < arguments.length; i++) {
        var arg = arguments[i]
        var argType = typeof arg
        if (argType === 'string' || argType === 'number' || arg === true) {
            classes.push(arg)
        } else if (Array.isArray(arg)) {
            classes.push(classNames.apply(null, arg))
        } else if (argType === 'object') {
            for (var key in arg) {
                if (arg.hasOwnProperty(key) && arg[key]) {
                    classes.push(key)
                }
            }
        }
    }

    return classes.join(' ')
}

var directives = avalon.directives
avalon.directive('class', {
    diff: function (cur, pre, steps, name) {
        var type = name.slice(3)
        var curValue = cur[name]
        var preValue = pre[name] || ''

        if (!pre.classEvent) {
            var classEvent = {}
            if (type === 'hover') {//在移出移入时切换类名
                classEvent.mouseenter = activateClass
                classEvent.mouseleave = abandonClass
            } else if (type === 'active') {//在获得焦点时切换类名
                pre.props.tabindex = cur.props.tabindex || -1
                classEvent.tabIndex = pre.props.tabindex
                classEvent.mousedown = activateClass
                classEvent.mouseup = abandonClass
                classEvent.mouseleave = abandonClass
            }
            pre.classEvent = classEvent
        }

        var className = classNames(curValue)
        var uniq = {}, arr = []
        className.replace(/\S+/g, function (el) {
            if (!uniq[el]) {
                uniq[el] = 1
                arr.push(el)
            }
        })
        
        className = arr.join(' ')
       
        if (preValue !== className) {
            pre[name] = className
            pre['change-' + type] = className
            update(pre, this.update, steps, type)
        }
    },
    update: function (node, vnode) {
        if (!node || node.nodeType !== 1)
            return
        var classEvent = vnode.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === 'tabIndex') {
                    node[i] = classEvent[i]
                } else {
                    avalon.bind(node, i, classEvent[i])
                }
            }
            vnode.classEvent = {}
        }
        var names = ['class', 'hover', 'active']
        names.forEach(function (type) {
            var name = 'change-' + type
            var value = vnode[name]
            if (value === void 0)
                return
            if (type === 'class') {
                node && setClass(node, vnode)
            } else {
                var oldType = node.getAttribute('change-' + type)
                if (oldType) {
                    avalon(node).removeClass(oldType)
                }
                node.setAttribute(name, value)
            }
        })
    }
})

directives.active = directives.hover = directives['class']


var classMap = {
    mouseenter: 'change-hover',
    mouseleave: 'change-hover',
    mousedown: 'change-active',
    mouseup: 'change-active'
}

function activateClass(e) {
    var elem = e.target
    avalon(elem).addClass(elem.getAttribute(classMap[e.type]) || '')
}

function abandonClass(e) {
    var elem = e.target
    var name = classMap[e.type]
    avalon(elem).removeClass(elem.getAttribute(name) || '')
    if (name !== 'change-active') {
        avalon(elem).removeClass(elem.getAttribute('change-active') || '')
    }
}

function setClass(node, vnode) {
    var old = node.getAttribute('old-change-class')
    var neo = vnode['ms-class']
    if (old !== neo) {
        avalon(node).removeClass(old).addClass(neo)
        node.setAttribute('old-change-class', neo)
    }

}

markID(activateClass)
markID(abandonClass)


