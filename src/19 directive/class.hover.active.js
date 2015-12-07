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
        if (method === "hover" || method === "active") { //确保只绑定一次
            if (!binding.hasBindEvent) {
                var elem = binding.element
                var $elem = avalon(elem)
                var activate = "mouseenter" //在移出移入时切换类名
                var abandon = "mouseleave"
                if (method === "active") { //在聚焦失焦中切换类名
                    elem.tabIndex = elem.tabIndex || -1
                    activate = "mousedown"
                    abandon = "mouseup"
                    var fn0 = $elem.bind("mouseleave", function () {
                        binding.toggleClass && $elem.removeClass(binding.newClass)
                    })
                }
            }

            var fn1 = $elem.bind(activate, function () {
                binding.toggleClass && $elem.addClass(binding.newClass)
            })
            var fn2 = $elem.bind(abandon, function () {
                binding.toggleClass && $elem.removeClass(binding.newClass)
            })
            binding.rollback = function () {
                $elem.unbind("mouseleave", fn0)
                $elem.unbind(activate, fn1)
                $elem.unbind(abandon, fn2)
            }
            binding.hasBindEvent = true
        }

    },
    update: function (arr) {
        var binding = this
        var $elem = avalon(this.element)
        binding.newClass = arr[0]
        binding.toggleClass = !!arr[1]
        if (binding.oldClass && binding.newClass !== binding.oldClass) {
            $elem.removeClass(binding.oldClass)
        }
        binding.oldClass = binding.newClass
        if (binding.type === "class") {
            if (binding.oldStyle) {
                $elem.toggleClass(binding.oldStyle, !!arr[1])
            } else {
                $elem.toggleClass(binding.newClass, binding.toggleClass)
            }
        }
    }
})

"hover,active".replace(rword, function (name) {
    directives[name] = directives["class"]
})
