/*********************************************************************
 *                           依赖调度系统                             *
 **********************************************************************/
//检测两个对象间的依赖关系
var dependencyDetection = (function () {
    var outerFrames = []
    var currentFrame
    return {
        begin: function (accessorObject) {
            //accessorObject为一个拥有callback的对象
            outerFrames.push(currentFrame)
            currentFrame = accessorObject
        },
        end: function () {
            currentFrame = outerFrames.pop()
        },
        collectDependency: function (vmodel, accessor) {
            if (currentFrame) {
                //被dependencyDetection.begin调用
                currentFrame.callback(vmodel, accessor);
            }
        }
    };
})()
//将绑定对象注入到其依赖项的订阅数组中
var ronduplex = /^(duplex|on)$/
avalon.injectBinding = function (data) {
    var valueFn = data.evaluator
    if (valueFn) { //如果是求值函数
        dependencyDetection.begin({
            callback: function (vmodel, dependency) {
                injectDependency(vmodel.$events[dependency._name], data)
            }
        })
        try {
            var value = ronduplex.test(data.type) ? data : valueFn.apply(0, data.args)
            if(value === void 0){
                delete data.evaluator
            }
            if (data.handler) {
                data.handler(value, data.element, data)
            }
        } catch (e) {
            log("warning:exception throwed in [avalon.injectBinding] " , e)
            delete data.evaluator
            var node = data.element
            if (node && node.nodeType === 3) {
                var parent = node.parentNode
                if (kernel.commentInterpolate) {
                    parent.replaceChild(DOC.createComment(data.value), node)
                } else {
                    node.data = openTag + (data.oneTime ? "::" : "") + data.value + closeTag
                }
            }
        } finally {
            dependencyDetection.end()
        }
    }
}

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组 
function injectDependency(list, data) {
    if (data.oneTime)
        return
    if (list && avalon.Array.ensure(list, data) && data.element) {
        injectDisposeQueue(data, list)
        if (new Date() - beginTime > 444 ) {
            rejectDisposeQueue()
        }
    }
}

//通知依赖于这个访问器的订阅者更新自身
function fireDependencies(list) {
    if (list && list.length) {
        if (new Date() - beginTime > 444 && typeof list[0] === "object") {
            rejectDisposeQueue()
        }
        var args = aslice.call(arguments, 1)
        for (var i = list.length, fn; fn = list[--i]; ) {
            var el = fn.element
            if (el && el.parentNode) {
                try {
                    var valueFn = fn.evaluator
                    if (fn.$repeat) {
                        fn.handler.apply(fn, args) //处理监控数组的方法
                    }else if("$repeat" in fn || !valueFn ){//如果没有eval,先eval
                        bindingHandlers[fn.type](fn, fn.vmodels)
                    } else if (fn.type !== "on") { //事件绑定只能由用户触发,不能由程序触发
                       var value = valueFn.apply(0, fn.args || [])
                       fn.handler(value, el, fn)
                    }
                } catch (e) { 
                    avalon.log(e)
                }
            }
        }
    }
}