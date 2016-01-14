/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/

//检测两个对象间的依赖关系
var dependencyDetection = (function () {
    var outerFrames = []
    var currentFrame
    return {
        begin: function (binding) {
            //accessorObject为一个拥有callback的对象
            outerFrames.push(currentFrame)
            currentFrame = binding
        },
        end: function () {
            currentFrame = outerFrames.pop()
        },
        collectDependency: function (array) {
            if (currentFrame) {
                //被dependencyDetection.begin调用
                currentFrame.callback(array)
            }
        }
    };
})()

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组
function injectDependency(list, binding) {
    if (binding.oneTime)
        return
    if (list && avalon.Array.ensure(list, binding) && binding.element) {
        injectDisposeQueue(binding, list)
        if (new Date() - beginTime > 444) {
            rejectDisposeQueue()
        }
    }
}


function $watch(expr, funOrObj) {
    var vm = this

    if (vm.hasOwnProperty(expr)) {
        var prop = W3C ? Object.getOwnPropertyDescriptor(vm, expr) :
                vm.$accessors[expr]
        var list = prop && prop.get && prop.get.list
    } else {
        var hive = vm.$events || (vm.$events = {})
        list = hive[expr] || (hive[expr] = [])
    }


    var data = typeof funOrObj === "function" ? {
        update: funOrObj,
        element: {},
        shouldDispose: function () {
            return vm.$active === false
        },
        uuid: getUid(funOrObj)
    } : funOrObj
    funOrObj.shouldDispose = funOrObj.shouldDispose || shouldDispose
    if (avalon.Array.ensure(list, data)) {
        injectDisposeQueue(data, list)
    }
    return function () {
        avalon.Array.remove(list, data)
    }
}

function shouldDispose() {
    var el = this.element
    return !el || el.disposed 
}

function $emit(list, vm, path, a, b, i) {
    if (list.length) {
        try {
            for (i = i || list.length - 1; i >= 0; i--) {
                var data = list[i]
                if (!data.element || data.element.disposed) {
                    list.splice(i, 1)
                } else if (data.update) {
                    data.update.call(vm, a, b, path)
                }
            }
        } catch (e) {
            if (i - 1 > 0)
                $emit(list, vm, path, a, b, i - 1)
            avalon.log(e, path)
        }
        if (new Date() - beginTime > 500) {
            rejectDisposeQueue()
        }
    }
}
function executeBindings(bindings, vmodel) {
    for (var i = 0, binding; binding = bindings[i++]; ) {
        binding.vmodel = vmodel
        var isBreak = directives[binding.type].init(binding)
        avalon.injectBinding(binding)
        if (isBreak === false)
            break
    }
    bindings.length = 0
}

function bindingIs(a, b) {
    return a === b
}

avalon.injectBinding = function (binding) {
    parseExpr(binding.expr, binding.vmodel, binding)
    binding.paths.split("★").forEach(function (path) {
        path = path.trim()
        if (trim) {
            try {
                binding.watchHost.$watch(path, binding)
                delete binding.watchHost
            } catch (e) {
                avalon.log(binding, path)
            }
        }
    })
    delete binding.paths
    binding.update = function () {
        var hasError
        try {
            var value = binding.getter(binding.vmodel)
        } catch (e) {
            hasError = true
            avalon.log(e)
        }
        var dir = directives[binding.type]
        var is = dir.is || bindingIs

        if (!is(value, binding.oldValue)) {
            dir.change(value, binding)
            if (binding.oneTime && !hasError) {
                dir.change = noop
                setTimeout(function () {
                    delete binding.element
                })
            }
            if (dir.old) {
                dir.old(binding, value)
            } else {
                binding.oldValue = value
            }
        }
    }
    binding.update()
}

//一个指令包含以下东西
//init(binding) 用于处理expr
//change(val, binding) 用于更新虚拟DOM树及添加更新真实DOM树的钩子
//update(dom, vnode)   更新真实DOM的具体操作 
//is(newValue, oldValue)? 比较新旧值的方法
//old(binding, oldValue)? 如何保持旧值 


