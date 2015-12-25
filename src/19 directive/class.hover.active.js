//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag"
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
avalon.directive("class", {
    init: function (binding) {
        var oldStyle = binding.param
        var method = binding.type
        if (!oldStyle || isFinite(oldStyle)) {
            binding.param = "" //去掉数字
            directives.effect.init(binding)
        } else {
            log('ms-' + method + '-xxx="yyy"这种用法已经过时,请使用ms-' + method + '="xxx:yyy"')
            binding.expr = '[' + quote(oldStyle) + "," + binding.expr + "]"
            binding.oldStyle = oldStyle
        }
    },
    is: function (a, b) {
        if (!Array.isArray(b)) {
            return false
        } else {
            return a[0] === b[0] && a[1] === b[1]
        }
    },
    change: function (arr, binding) {
        var obj = binding.element.changeClass = {}
        if (binding.oldStyle) {
            obj[arr[0]] = arr[1]
        } else {
            var toggle = arr[1]
            var keep = binding.keep || {}
            for (var i in keep) {
                if (keep[i] === true && toggle) {
                    obj[i] = true
                    delete obj[i]
                }
            }
            var str = arr[0]
            str.replace(rword, function (name) {
                keep[name] = obj[name] = toggle
            })
            binding.keep = keep
        }
        addHooks(this, binding)
    },
    update: function (elem, vnode) {
        var $elem = avalon(elem)
        var changeClass = vnode.changeClass
        for (var i in changeClass) {
            $elem.toggleClass(i, changeClass[i])
        }
    }
})

//"hover,active".replace(rword, function (name) {
//    directives[name] = directives["class"]
//})

