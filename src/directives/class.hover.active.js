//根据VM的属性值或表达式的值切换类名，ms-class='xxx yyy zzz:flag'
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
var markID = require('../seed/lang.share').getLongID
var update = require('./_update')

var directives = avalon.directives
avalon.directive('class', {
    parse: function (binding, num) {
        //必须是布尔对象或字符串数组
        return 'vnode' + num + '.props["' + binding.name + '"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var type = name.slice(3)
        var curValue = cur.props[name]
        var preValue = pre.props[name]
        if (!pre.classEvent) {
            var classEvent = {}
            if (type === 'hover') {//在移出移入时切换类名
                classEvent.mouseenter = activateClass
                classEvent.mouseleave = abandonClass
            } else if (type === 'active') {//在获得焦点时切换类名
                cur.props.tabindex = cur.props.tabindex || -1
                classEvent.tabIndex = cur.props.tabindex
                classEvent.mousedown = activateClass
                classEvent.mouseup = abandonClass
                classEvent.mouseleave = abandonClass
            }
            cur.classEvent = classEvent
        } else {
            cur.classEvent = pre.classEvent
        }
        pre.classEvent = null

        var className = avalon.noop
        if (Array.isArray(curValue)) {
            //处理复杂的一维数组
           className = curValue.map(function(el){
                return el && typeof el === 'object' ? processBooleanObject(el) :
                        el ? el : ''
            }).join(' ')
        } else if (avalon.isObject(curValue)) {
            //处理布尔对象
            className = processBooleanObject(curValue)
        } else if (curValue) {
            //处理其他真值，如字符串，数字
            className = String(curValue)
        }
        if(className === avalon.noop){
            return
        }
        className = cur.props[name] = className.trim().replace(/\s+/, ' ')
        if (preValue !== className) {
            cur['change-' + type] = className
            update(cur, this.update, steps, type )
        }
    },
    update: function (node, vnode) {
   
        if(!node || node.nodeType !==1)
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
            var value = vnode[ name ]
            if (value === void 0)
                return
            if (type === 'class') {
                node && setClass(node, vnode)
            } else {
                var oldType = node.getAttribute('change-'+type)
                if (oldType) {
                    avalon(node).removeClass(oldType)
                }
                node.setAttribute(name, value)
            }
        })
    }
})

directives.active = directives.hover = directives['class']

function processBooleanObject(obj) {
    return Object.keys(obj).filter(function (name) {
        return obj[name]
    }).join(' ')
}

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
    var old = node.getAttribute('old-change-class') || ''
    var neo = vnode.props['ms-class']
    avalon(node).removeClass(old).addClass(neo)
    node.setAttribute('old-change-class', neo)
}

markID(activateClass)
markID(abandonClass)


