//根据VM的属性值或表达式的值切换类名，ms-class="xxx yyy zzz:flag" 
//http://www.cnblogs.com/rubylouvre/archive/2012/12/17/2818540.html
bindingHandlers["class"] = function(data, vmodels) {
    var oldStyle = data.param,
        text = data.value,
        rightExpr
        data.handlerName = "class"
    if (!oldStyle || isFinite(oldStyle)) {
        data.param = "" //去掉数字
        var noExpr = text.replace(rexprg, function(a) {
            return a.replace(/./g, "0")
            //return Math.pow(10, a.length - 1) //将插值表达式插入10的N-1次方来占位
        })
        var colonIndex = noExpr.indexOf(":") //取得第一个冒号的位置
        if (colonIndex === -1) { // 比如 ms-class="aaa bbb ccc" 的情况
            var className = text
        } else { // 比如 ms-class-1="ui-state-active:checked" 的情况 
            className = text.slice(0, colonIndex)
            rightExpr = text.slice(colonIndex + 1)
            parseExpr(rightExpr, vmodels, data) //决定是添加还是删除
            if (!data.evaluator) {
                log("debug: ms-class '" + (rightExpr || "").trim() + "' 不存在于VM中")
                return false
            } else {
                data._evaluator = data.evaluator
                data._args = data.args
            }
        }
        var hasExpr = rexpr.test(className) //比如ms-class="width{{w}}"的情况
        if (!hasExpr) {
            data.immobileClass = className
        }
        parseExprProxy("", vmodels, data, (hasExpr ? scanExpr(className) : 0))
    } else {
        data.immobileClass = data.oldStyle = data.param
        parseExprProxy(text, vmodels, data)
    }
}

bindingExecutors["class"] = function(val, elem, data) {
    var $elem = avalon(elem),
        method = data.type
    if (method === "class" && data.oldStyle) { //如果是旧风格
        $elem.toggleClass(data.oldStyle, !! val)
    } else {
        //如果存在冒号就有求值函数
        data.toggleClass = data._evaluator ? !! data._evaluator.apply(elem, data._args) : true
        data.newClass = data.immobileClass || val
        if (data.oldClass && data.newClass !== data.oldClass) {
            $elem.removeClass(data.oldClass)
        }
        data.oldClass = data.newClass
        switch (method) {
            case "class":
                $elem.toggleClass(data.newClass, data.toggleClass)
                break
            case "hover":
            case "active":
                if (!data.hasBindEvent) { //确保只绑定一次
                    var activate = "mouseenter" //在移出移入时切换类名
                    var abandon = "mouseleave"
                    if (method === "active") { //在聚焦失焦中切换类名
                        elem.tabIndex = elem.tabIndex || -1
                        activate = "mousedown"
                        abandon = "mouseup"
                        var fn0 = $elem.bind("mouseleave", function() {
                            data.toggleClass && $elem.removeClass(data.newClass)
                        })
                    }
                    var fn1 = $elem.bind(activate, function() {
                        data.toggleClass && $elem.addClass(data.newClass)
                    })
                    var fn2 = $elem.bind(abandon, function() {
                        data.toggleClass && $elem.removeClass(data.newClass)
                    })
                    data.rollback = function() {
                        $elem.unbind("mouseleave", fn0)
                        $elem.unbind(activate, fn1)
                        $elem.unbind(abandon, fn2)
                    }
                    data.hasBindEvent = true
                }
                break;
        }
    }
}

"hover,active".replace(rword, function(method) {
    bindingHandlers[method] = bindingHandlers["class"]
})