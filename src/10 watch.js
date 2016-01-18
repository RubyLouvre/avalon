/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/
function shouldDispose() {
    var el = this.element
    return !el || el.disposed
}

function $watch(expr, funOrObj) {
    var vm = this

    var hive = vm.$events || (vm.$events = {})
    var list = hive[expr] || (hive[expr] = [])
   
    var data = typeof funOrObj === "function" ? {
        update: funOrObj,
        element: {},
        shouldDispose: function () {
            return vm.$hashcode === false
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



/**
 * $fire 方法的内部实现
 * 
 * @param {Array} list 订阅者数组
 * @param {Component} vm
 * @param {String} path 监听属性名或路径
 * @param {Any} a 当前值 
 * @param {Any} b 过去值
 * @param {Number} i 如果抛错,让下一个继续执行
 * @returns {undefined}
 */
function $emit(list, vm, path, a, b, i) {
    if (list && list.length) {
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


avalon.injectBinding = function (binding) {

    binding.shouldDispose = shouldDispose
    parseExpr(binding.expr, binding.vmodel, binding)

    binding.paths.split("★").forEach(function (path) {
        var outerVm = binding.vmodel
        var toppath = path.split(".")[0]
        if (outerVm.hasOwnProperty(toppath)) {
            try {
                //调整要添加绑定对象或回调的VM
                if (outerVm.$accessors) {
                    outerVm = outerVm.$accessors[toppath].get.heirloom.__vmodel__
                } else {
                    outerVm = outerVm.getOwnPropertyDescriptor(outerVm, toppath).get.heirloom.__vmodel__
                }

                if (!outerVm) {
                    throw new Error("不存在")
                }
            } catch (e) {
                avalon.log(path, e)
            }
        }
        //如果不循环,都是放在用户定义的vm上
        if (!outerVm)
            outerVm = binding.vmodel

        var repeatActive = String(outerVm.$hashcode).match(/^(a|o):(\S+):(?:\d+)$/)

        if (repeatActive) {
            if (repeatActive[1] === "o") {//处理对象循环
                binding.innerVm = outerVm
                binding.innerExpr = path
                var outerPath = outerVm.$id
                var sindex = outerPath.lastIndexOf(".*.")
                //  console.log(itemName,outerVm, sindex, outerPath.slice(sindex + 3))
                if (sindex > 0) {
                    var innerId = outerPath.slice(0, sindex+2)
                    for (var kj in outerVm) {//这个以后要移入到repeatItemFactory
                        if (outerVm[kj] && (outerVm[kj].$id === innerId)) {
                            binding.outerVm = outerVm[kj]
                            binding.outerExpr = outerPath.slice(sindex + 3)
                            break
                        }
                    }
                    
                } else {
                    var idarr = outerPath.match(rtopsub)

                    if (idarr) {
                        binding.outerExpr = idarr[2] //顶层vm的$id
                        binding.outerVm = avalon.vmodels[idarr[1]]
                    }
                }
            } else {//处理数组循环
                var itemName = repeatActive[2]
                binding.innerExpr = path
                binding.innerVm = outerVm
                if (typeof outerVm[itemName] === "object" && path.indexOf(itemName) === 0) {
                    binding.outerVm = outerVm[itemName]
                    binding.outerExpr = path.replace(itemName + ".", "")
                }
            }

        } else {
            binding.outerVm = outerVm
            binding.outerExpr = path
        }

        try {
            if (binding.innerVm) {
                binding.innerVm.$watch(binding.innerExpr, binding)
            }
            if (binding.innerVm && binding.outerVm) {
                // console.log(binding.outerVm, binding.outerExpr)
                var array = binding.outerVm.$events[binding.outerExpr]
                var array2 = binding.innerVm.$events[binding.innerExpr]
                ap.push.apply(array2, array || [])
                binding.outerVm.$events[binding.outerExpr] =
                        array2
            } else if (binding.outerVm) {//简单数组的元素没有outerVm
                binding.outerVm.$watch(binding.outerExpr, binding)
            }
            delete binding.innerVm
            delete binding.outerVm
        } catch (e) {
            avalon.log(e, binding, path)
        }

    })
    delete binding.paths
    binding.update = function (a, b, p) {
        var vm = binding.vmodel
        //用于高效替换binding上的vmodel
        if (vm.$events.__vmodel__ !== vm) {
            vm = binding.vmodel = vm.$events.__vmodel__
            //console.log("要换vm", vm)
        }

        var hasError
        try {
            var value = binding.getter(vm)
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

function bindingIs(a, b) {
    return a === b
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
//一个指令包含以下东西
//init(binding) 用于处理expr
//change(val, binding) 用于更新虚拟DOM树及添加更新真实DOM树的钩子
//update(dom, vnode)   更新真实DOM的具体操作 
//is(newValue, oldValue)? 比较新旧值的方法
//old(binding, oldValue)? 如何保持旧值 



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

