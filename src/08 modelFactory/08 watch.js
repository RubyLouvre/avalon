
function $watch(expr, funOrObj, exe) {
    var vm = this
    var vmodel = funOrObj.vmodel
    //如果是通过executeBinding静态绑定的,并且不是单次绑定,并且对象是代理VM,并且表达式用到这代理VM的别名
    if (exe && !funOrObj.oneTime && 
            vmodel && vmodel.hasOwnProperty("$repeatItem") &&
            expr.indexOf(vmodel.$repeatItem + ".") === 0) {
        vm = vmodel[vmodel.$repeatItem]
        var old = expr
        expr = expr.replace(/^[^.]+\./, "")
        console.log(vmodel.$repeatItem,vm,expr,vmodel)
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
                    if (data.vmodel) {
                        var id = data.vmodel.$id.split("??")[0]
                        if (avalon.vtree[id] && !uniq[id]) {
                            console.log(topVm, curVm)
                            uniq[id] = 1
                            batchUpdateEntity(id)
                        }
                    }

                }
            }
        } catch (e) {
            if (i - 1 > 0)
                $emit(topVm, curVm, path, a, b, i - 1)
            avalon.log(e, path)
        }
    }

    if (new Date() - beginTime > 500) {
        rejectDisposeQueue()
    }
}
