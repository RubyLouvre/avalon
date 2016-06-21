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
    diff: function (copy, src, name) {
        var type = name.slice(3)
        var copyValue = copy[name]
        var srcValue = src[name] || ''

        if (!src.classEvent) {
            var classEvent = {}
            if (type === 'hover') {//在移出移入时切换类名
                classEvent.mouseenter = activateClass
                classEvent.mouseleave = abandonClass
            } else if (type === 'active') {//在获得焦点时切换类名
                src.props.tabindex = copy.props.tabindex || -1
                classEvent.tabIndex = src.props.tabindex
                classEvent.mousedown = activateClass
                classEvent.mouseup = abandonClass
                classEvent.mouseleave = abandonClass
            }
            src.classEvent = classEvent
        }

        var className = classNames(copyValue)
        var uniq = {}, arr = []
        className.replace(/\S+/g, function (el) {
            if (!uniq[el]) {
                uniq[el] = 1
                arr.push(el)
            }
        })
        
        className = arr.join(' ')
       
        if (srcValue !== className) {
            src[name] = className
            src['change-' + type] = className
            update(src, this.update, type)
        }
    },
    update: function (dom, vdom) {
        if (!dom || dom.nodeType !== 1)
            return
        var classEvent = vdom.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === 'tabIndex') {
                    dom[i] = classEvent[i]
                } else {
                    avalon.bind(dom, i, classEvent[i])
                }
            }
            vdom.classEvent = {}
        }
        var names = ['class', 'hover', 'active']
        names.forEach(function (type) {
            var name = 'change-' + type
            var value = vdom[name]
            if (value === void 0)
                return
            if (type === 'class') {
                dom && setClass(dom, vdom)
            } else {
                var oldType = dom.getAttribute('change-' + type)
                if (oldType) {
                    avalon(dom).removeClass(oldType)
                }
                dom.setAttribute(name, value)
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

function setClass(dom, vdom) {
    var old = dom.getAttribute('old-change-class')
    var neo = vdom['ms-class']
    if (old !== neo) {
        avalon(dom).removeClass(old).addClass(neo)
        dom.setAttribute('old-change-class', neo)
    }

}

markID(activateClass)
markID(abandonClass)


