avalon.directive("if", {
    priority: 10,
    update: function (val) {
        var binding = this
        var elem = this.element
        var stamp = binding.stamp = +new Date()
        var par
        var after = function () {
            if (stamp !== binding.stamp)
                return
            binding.recoverNode = null
        }
        if (binding.recoverNode)
            binding.recoverNode() // 还原现场，有移动节点的都需要还原现场
        try {
            if (!elem.parentNode)
                return
            par = elem.parentNode
        } catch (e) {
            return
        }
        if (val) { //插回DOM树
            function alway() {// jshint ignore:line
                if (elem.getAttribute(binding.name)) {
                    elem.removeAttribute(binding.name)
                    scanAttr(elem, binding.vmodels)
                }
                binding.rollback = null
            }
            if (elem.nodeType === 8) {
                var keep = binding.keep
                var hasEffect = avalon.effect.apply(keep, 1, function () {
                    if (stamp !== binding.stamp)
                        return
                    elem.parentNode.replaceChild(keep, elem)
                    elem = binding.element = keep //这时可能为null
                    if (keep.getAttribute("_required")) {//#1044
                        elem.required = true
                        elem.removeAttribute("_required")
                    }
                    if (elem.querySelectorAll) {
                        avalon.each(elem.querySelectorAll("[_required=true]"), function (el) {
                            el.required = true
                            el.removeAttribute("_required")
                        })
                    }
                    alway()
                }, after)
                hasEffect = hasEffect === false
            }
            if (!hasEffect)
                alway()
        } else { //移出DOM树，并用注释节点占据原位置
            if (elem.nodeType === 1) {
                if (elem.required === true) {
                    elem.required = false
                    elem.setAttribute("_required", "true")
                }
                try {//如果不支持querySelectorAll或:required,可以直接无视
                    avalon.each(elem.querySelectorAll(":required"), function (el) {
                        elem.required = false
                        el.setAttribute("_required", "true")
                    })
                } catch (e) {
                }

                var node = binding.element = DOC.createComment("ms-if"),
                        pos = elem.nextSibling
                binding.recoverNode = function () {
                    binding.recoverNode = null
                    if (node.parentNode !== par) {
                        par.insertBefore(node, pos)
                        binding.keep = elem
                    }
                }

                avalon.effect.apply(elem, 0, function () {
                    binding.recoverNode = null
                    if (stamp !== binding.stamp)
                        return
                    elem.parentNode.replaceChild(node, elem)
                    //解决 当使用ms-if条件为常量表达式时 if节点泄漏
                    //https://github.com/RubyLouvre/avalon2/issues/78
                    //通过判断binding.getter()调用是否抛异常，来判断ms-if的表达式是否为常量。
                    try{
                        if(!binding.getter()){  //如果binding.expr是常量，binding.getter调用会返回false，不需要将elem移动到ifGroup
                           binding.keep = elem //元素节点
                           binding.rollback = noop
                        }else{
                            //never been here
                            log('directive:ms-if: never been here.')
                        }
                    }catch(e){ //如果是vm属性绑定，binding.getter调用会抛异常. 把节点移到ifGroup
                        binding.keep = elem //元素节点
                        ifGroup.appendChild(elem)
                        binding.rollback = function () {
                            if (elem.parentNode === ifGroup) {
                                ifGroup.removeChild(elem)
                            }
                        }
                    }
                }, after)
            }
        }
    }
})
