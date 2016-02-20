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
        avalon.log("adjustVm " + e)
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
        expr: "[[ " + expr + " ]]",
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

var rparseRepeatItem = /^(a|o):(\w+):(\S+):(?:\d+)$/
avalon.injectBinding = function (binding) {

    parseExpr(binding.expr, binding.vmodel, binding)
//在ms-class中,expr: '["XXX YYY ZZZ",true]' 其path为空
    binding.paths.split("★").forEach(function (path) {
        var vm = adjustVm(binding.vmodel, path) || {}
        var match = String(vm.$hashcode).match(rparseRepeatItem)
        try {
            if (match) {
                var repeatItem = match[2]
                var spath = match[3]
                if (match[1] === "a") {
                    if (typeof vm[repeatItem] === "object") {
                        vm[repeatItem].$watch(path.replace(repeatItem + ".", ""), binding)
                    } else {
                        vm.$watch(repeatItem, binding)
                    }
                } else if (match[1] === "o") {
                    if (path === repeatItem) {//el
                        vm.$watch(spath, binding)
                    } else if (path.indexOf(repeatItem + ".") === 0) {//el.ccc
                        vm.$watch(path.replace(repeatItem, spath), binding)
                    }
                }

            } else {
                vm.$watch(path, binding)
            }
        } catch (e) {
            avalon.log(e, binding)
        }
    })
    delete binding.paths
    binding.update = function (a, b, p) {
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
