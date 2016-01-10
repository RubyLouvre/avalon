
function $watch(expr, funOrObj, exe) {
    var vm = this
    var toppath = expr.split(".")[0]
    try {
        //调整要添加绑定对象或回调的VM
        if (vm.$accessors) {
            vm = vm.$accessors[toppath].get.heirloom.vm
        } else {
            vm = Object.getOwnPropertyDescriptor(vm, toppath).get.heirloom.vm
        }
    } catch (e) {
    }
   
    //如果是通过executeBinding静态绑定的,并且不是单次绑定,并且对象是代理VM,并且表达式用到这代理VM的别名
    if (exe && !funOrObj.oneTime &&
            vm.hasOwnProperty("$repeatItem") &&
            expr.indexOf(vm.$repeatItem ) === 0) {
        if (vm.$repeatObject) {
           //  console.log(expr,vm.$repeatItem,"|",vm.$id )
            //处理 ms-with的代理VM 直接回溯到顶层VM  $val.a --> obj.aa.a
            var arr = vm.$id.match(rtopsub)
            expr = expr.replace(vm.$repeatItem, arr[2])
          
            vm = avalon.vmodels[arr[1]]
              console.log(expr, vm)
        } else {
            //处理 ms-each的代理VM 只回溯到数组的item VM el.a --> a
            console.log(expr, vm.$repeatItem)
            expr = expr.replace(vm.$repeatItem + ".", "")
            vm = vm[vm.$repeatItem]
        }
        funOrObj.expr = expr
    }

    var hive = vm.$events || (vm.$events = {})
    var list = hive[expr] || (hive[expr] = [])

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

function $emit(topVm, curVm, path, a, b, i) {
    var hive = topVm && topVm.$events
    var uniq = {}
    if (hive && hive[path]) {
        var list = hive[path]
        try {
            for (i = i || list.length - 1; i >= 0; i--) {
                var data = list[i]
                if (!data.element || data.element.disposed) {
                    list.splice(i, 1)
                } else if (data.update) {
                    data.update.call(curVm, a, b, path)
                }
            }
        } catch (e) {
            if (i - 1 > 0)
                $emit(topVm, path, a, b, i - 1)
            avalon.log(e, path)
        }
        if (new Date() - beginTime > 500) {
            rejectDisposeQueue()
        }
    }
    if (topVm) {
        var id = topVm.$id
        if (avalon.vtree[id] && !uniq[id]) {
            console.log("更新domTree")
            batchUpdateEntity(id)
        }
    }
}
