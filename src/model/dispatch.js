/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/
var gc = require("../core/gc")
var injectDisposeQueue = gc.injectDisposeQueue
var rejectDisposeQueue = gc.rejectDisposeQueue

var builtin = require("../base/builtin")
var rtopsub = require("./builtin").rtopsub


var noop = builtin.noop
var getUid = builtin.getUid

var ap = builtin.ap
var directives = avalon.directives
var parseExpr = require("../parser/parser").parseExpr

function adjustVm(vm, expr) {
    var toppath = expr.split(".")[0], other
    try {
        if (vm.hasOwnProperty(toppath)) {
            if (vm.$accessors) {
                other = vm.$accessors[toppath].get.heirloom.__vmodel__
            } else {
                other = Object.getOwnPropertyDescriptor(vm, toppath).get.heirloom.__vmodel__
            }

        }
    } catch (e) {
        avalon.log("adjustVm "+e)
    }
    return other || vm
}


function $watch(expr, funOrObj) {
    var vm = adjustVm(this, expr)
    var hive = vm.$events
    var list = hive[expr] || (hive[expr] = [])
    if (vm !== this) {
        this.$events[expr] = list
    }
    var data = typeof funOrObj === "function" ? {
        update: funOrObj,
        element: {},
        shouldDispose: function() {
            return vm.$hashcode === false
        },
        uuid: getUid(funOrObj)
    } : funOrObj

    funOrObj.shouldDispose = funOrObj.shouldDispose || shouldDispose

    if (avalon.Array.ensure(list, data)) {
        injectDisposeQueue(data, list)
    }

    return function() {
        avalon.Array.remove(list, data)
    }
}


function shouldDispose() {
    var el = this.element
    return !el || el.disposed
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
        if (new Date() - rejectDisposeQueue.beginTime > 500) {
            rejectDisposeQueue()
        }
    }
}


avalon.injectBinding = function(binding) {

    parseExpr(binding.expr, binding.vmodel, binding)
//在ms-class中,expr: '["XXX YYY ZZZ",true]' 其path为空
    binding.paths.split("★").forEach(function(path) {
        var outerVm = adjustVm(binding.vmodel, path) || {}
        var match = String(outerVm.$hashcode).match(/^(a|o):(\S+):(?:\d+)$/)
        if (match) {
            binding.innerVm = outerVm
            binding.innerPath = path
            var repeatItem = match[2]
            if (path.indexOf(repeatItem) === 0) {
                if (match[1] === "o") {//处理对象循环 $val
                    //处理$val
                    var outerPath = outerVm.$id
                    var sindex = outerPath.lastIndexOf(".*.")
                    if (sindex > 0) {//处理多级对象
                        var innerId = outerPath.slice(0, sindex + 2)
                        for (var kj in outerVm) {//这个以后要移入到repeatItemFactory
                            if (outerVm[kj] && (outerVm[kj].$id === innerId)) {
                                binding.outerVm = outerVm[kj]
                                binding.outerPath = outerPath.slice(sindex + 3)
                                break
                            }
                        }
                    } else {//处理一层对象
                        var idarr = outerPath.match(rtopsub)
                        if (idarr) {
                            binding.outerPath = idarr[2] //顶层vm的$id
                            binding.outerVm = avalon.vmodels[idarr[1]]
                        }
                    }
                } else {//处理对象数组循环 el
                    if (typeof outerVm[repeatItem] === "object") {
                        binding.outerVm = outerVm[repeatItem]
                        binding.outerPath = path.replace(repeatItem + ".", "")
                    }
                }
            }
        } else {
            binding.outerVm = outerVm
            binding.outerPath = path
        }


        if (binding.innerVm) {
            try {
                binding.innerVm.$watch(binding.innerPath, binding)
            } catch (e) {
                avalon.log(e, binding)
            }
        }
        if (binding.innerVm && binding.outerVm) {
            var array = binding.outerVm.$events[binding.outerPath]
            var array2 = binding.innerVm.$events[binding.innerPath]
            if (!array2) {
                avalon.log(binding.innerPath, "对应的订阅数组不存在")
            }
            ap.push.apply(array2 || [], array || [])
            binding.outerVm.$events[binding.outerPath] = array2
        } else if (binding.outerVm) {//简单数组的元素没有outerVm
            try {
                binding.outerVm.$watch(binding.outerPath, binding)
            } catch (e) {
                avalon.log(e, binding)
            }
        }

        delete binding.innerVm
        delete binding.outerVm
    })
    delete binding.paths
    binding.update = function(a, b, p) {
        var vm = binding.vmodel
        //用于高效替换binding上的vmodel
        if (vm.$events.__vmodel__ !== vm) {
            vm = binding.vmodel = vm.$events.__vmodel__
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
                setTimeout(function() {
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


//一个指令包含以下东西
//init(binding) 用于处理expr
//change(val, binding) 用于更新虚拟DOM树及添加更新真实DOM树的钩子
//update(dom, vnode)   更新真实DOM的具体操作 
//is(newValue, oldValue)? 比较新旧值的方法
//old(binding, oldValue)? 如何保持旧值 

module.exports = {
    $emit: $emit,
    $watch: $watch,
    adjustVm: adjustVm
}
