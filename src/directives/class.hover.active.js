//根据VM的属性值或表达式的值切换类名，ms-class='xxx yyy zzz:flag'
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
import { avalon, directives, getLongID as markID } from '../seed/core'

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



avalon.directive('class', {
    diff: function (newVal, oldVal) {
        var type = this.type
        var vdom = this.node
        var classEvent = vdom.classEvent || {}
        if (type === 'hover') {//在移出移入时切换类名
            classEvent.mouseenter = activateClass
            classEvent.mouseleave = abandonClass
        } else if (type === 'active') {//在获得焦点时切换类名
            classEvent.tabIndex = vdom.props.tabindex || -1
            classEvent.mousedown = activateClass
            classEvent.mouseup = abandonClass
            classEvent.mouseleave = abandonClass
        }
        vdom.classEvent = classEvent

        var className = classNames(newVal)

        if (typeof oldVal === void 0 || oldVal !== className) {
            this.value = className

            vdom['change-' + type] = className
            return true
        }
    },
    update: function (vdom, value) {
        var dom = vdom.dom
        if (dom && dom.nodeType == 1) {

            var dirType = this.type
            var change = 'change-' + dirType
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
                if (dirType !== type)
                    return
                if (type === 'class') {
                    dom && setClass(dom, value)
                } else {
                    var oldClass = dom.getAttribute(change)
                    if (oldClass) {
                        avalon(dom).removeClass(oldClass)
                    }
                    var name = 'change-' + type
                    dom.setAttribute(name, value)
                }
            })
        }
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

function setClass(dom, neo) {
    var old = dom.getAttribute('change-class')
    if (old !== neo) {
        avalon(dom).removeClass(old).addClass(neo)
        dom.setAttribute('change-class', neo)
    }

}

markID(activateClass)
markID(abandonClass)

