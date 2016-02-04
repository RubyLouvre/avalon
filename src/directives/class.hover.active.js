//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
var divide = require('./var/divide')
var builtin = require("../base/builtin")
var quote = builtin.quote
var rword = builtin.rword
var markID = builtin.markID
var rsvg = builtin.rsvg

var hooks = require("../vdom/hooks")
var addData = hooks.addData
var addHooks = hooks.addHooks

var directives = avalon.directives
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
            divide(binding)
        } else {
            log('ms-' + method + '-xxx="yyy"这种用法已经过时,请使用ms-' + method + '="xxx:yyy"')
            binding.expr = '[' + quote(oldStyle) + "," + binding.expr + "]"
        }
        var vnode = binding.element
        var classEvent = {}
        if (method === "hover") {//在移出移入时切换类名
            classEvent.mouseenter = activateClass
            classEvent.mouseleave = abandonClass
        } else if (method === "active") {//在获得焦点时切换类名
            vnode.props.tabindex = vnode.props.tabindex || -1
            classEvent.tabIndex = vnode.props.tabindex
            classEvent.mousedown = activateClass
            classEvent.mouseup = abandonClass
            classEvent.mouseleave = abandonClass
        }
        vnode.classEvent = classEvent
    },
    change: function (arr, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        var type = binding.type
        var data = addData(vnode, type + "Data")
        var old = addData(binding, type + "Old")
        var toggle = arr[1]
        for (var i in data) {
            if (old[i]) {
                delete data[i]
                delete old[i]
            }
        }

        arr[0].replace(/\S+/g, function (cls) {
            data[cls] = toggle
            if (toggle) {
                old[cls] = 1
            }
        })
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        var classEvent = vnode.classEvent
        if (classEvent) {
            for (var i in classEvent) {
                if (i === "tabIndex") {
                    node[i] = classEvent[i]
                } else {
                    avalon.bind(node, i, classEvent[i])
                }
            }
            delete vnode.classEvent
        }
        var names = ["class", "hover", "active"]
        names.forEach(function (type) {
            var data = vnode[type + "Data"]
            if (!data)
                return
            if (type === "class") {
                setClass(node, data)
            } else {
                node.targetClass = data
            }
        })
    }
})

function activateClass(e) {
    var elem = e.target
    setClass(elem, elem.targetClass)
}

function abandonClass(e) {
    var elem = e.target
    setClass(elem, elem.targetClass, true)
}

function setClass(node, other, remove) {
    var svg = rsvg.test(node)
    var className = svg ? node.getAttribute("class") : node.className
    var obj = {}
    className.replace(/\S+/g, function (name) {
        obj[name] = true
    })

    for (var name in other) {
        var val = other[name]
        if (val) {
            obj[name] = remove ? false : true
        } else {
            delete obj[name]
        }
    }
    var classArr = []
    for (name in obj) {
        if (obj[name] === true) {
            classArr.push(name)
        }
    }
    className = classArr.join(" ")
    if (svg) {
        node.setAttribute("class", className)
    } else {
        node.className = className
    }
}

markID(activateClass)
markID(abandonClass)

"hover,active".replace(rword, function (name) {
    directives[name] = directives["class"]
})
