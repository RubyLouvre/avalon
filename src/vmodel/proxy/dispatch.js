
function adjustVm(vm, expr) {
    if(vm.$innuendo){
         var toppath = expr.split(".")[0]
         return vm.$innuendo[toppath] || vm
    }else{
        return vm
    }
}

function $watch(expr, callback) {
    var vm = adjustVm(this, expr)
    var hive = vm.$events
    var list = hive[expr] || (hive[expr] = [])
    if (vm !== this) {
        this.$events[expr] = list
    }
    avalon.Array.ensure(list, callback)

    return function () {
        avalon.Array.remove(list, callback)
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
                var callback = list[i]
                callback.call(vm, a, b, path)
            }
        } catch (e) {
            if (i - 1 > 0)
                $emit(list, vm, path, a, b, i - 1)
            avalon.log(e, path)
        }

    }
}


module.exports = {
    adjustVm: adjustVm,
    $emit: $emit,
    $watch: $watch
}
