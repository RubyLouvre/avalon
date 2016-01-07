
function $watch(expr, funOrObj, exe) {
    var vm = this
    if (exe && !funOrObj.oneTime && expr.indexOf(".") > 0 &&  funOrObj.element &&
            funOrObj.element.type && funOrObj.vmodel.$id.indexOf("??") > 1) {
        var item = expr.split(".")[0]
        var vmodel = funOrObj.vmodel
        if (vmodel.hasOwnProperty(item) && vmodel.hasOwnProperty("$first") && vmodel.hasOwnProperty("$last")) {
            vm = vmodel[item]
            expr = expr.replace(/^\w+\./, "")
            funOrObj.expr = expr
        }
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
                    if(data.vmodel){
                       var id = data.vmodel.$id.split("??")[0]
                       if(avalon.vtree[id] && !uniq[id]){
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
