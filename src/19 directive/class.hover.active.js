//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
avalon.directive("class", {
    is: function (a, b) {
        if (!Array.isArray(b)) {
            return false
        } else {
            return a[0] === b[0] && a[1] === b[1]
        }
    },
    init: function (binding) {
        var oldStyle = binding.param
        var method = binding.type
        if (!oldStyle || isFinite(oldStyle)) {
            binding.param = "" //去掉数字
            directives.effect.init(binding)
        } else {
            log('ms-' + method + '-xxx="yyy"这种用法已经过时,请使用ms-' + method + '="xxx:yyy"')
            binding.expr = '[' + quote(oldStyle) + "," + binding.expr + "]"
        }
        var elem = binding.element
        var classEvent = {}
        if (method === "hover") {//在移出移入时切换类名
            classEvent.mouseenter = activateClass
            classEvent.mouseleave = abandonClass
        } else if (method === "active") {//在获得焦点时切换类名
            elem.props.tabindex   = elem.props.tabindex || -1
            classEvent.tabIndex   = elem.props.tabindex
            classEvent.mousedown  = activateClass
            classEvent.mouseup    = abandonClass
            classEvent.mouseleave = abandonClass
        }
        elem.classEvent = classEvent
    },
    change: function (arr, binding) {
        var type = binding.type
        var data = addData(binding.element, type + "Data")
        var target = arr[0]
        var toggle = arr[1]
        if (binding.oldClass && target !== binding.oldClass) {
            data.toRemove = binding.oldClass
        }
        data.targetClass = target
        data.toggleClass = toggle
        binding.oldClass = target
        addHooks(this, binding)
    },
    update: function (elem, vnode) {
        var classEvent = vnode.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === "tabIndex") {
                    elem[i] = classEvent[i]
                } else {
                    avalon.bind(elem, i, classEvent[i])
                }
            }
            delete vnode.classEvent
        }
        var wrap = avalon(elem)
        Array("class", "hover", "active").forEach(function (type) {
            var data = vnode[type + "Data"]
            if(!data)
               return
            if (data.toRemove) {
                wrap.removeClass(data.toRemvoe)
            }
            if (type === "class") {
                wrap.toggleClass(data.targetClass, data.toggleClass)
            } else {
                elem.targetClass = data.targetClass
                elem.toggleClass = data.toggleClass
            }
        })
    }
})

function activateClass(e) {
    var elem = e.target
    if (elem.toggleClass) {
        avalon(elem).addClass(elem.targetClass)
    }
}

function abandonClass(e) {
    var elem = e.target
    if (elem.toggleClass) {
        avalon(elem).removeClass(elem.targetClass)
    }
}

activateClass.uuid = generateID("e")
abandonClass.uuid  = generateID("e")

"hover,active".replace(rword, function (name) {
    directives[name] = directives["class"]
})
