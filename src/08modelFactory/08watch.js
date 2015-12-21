function $watch(expr, funOrObj) {
    var hive = this.$events || (this.$events = {})
    var list = hive[expr] || (hive[expr] = [])
    var data = typeof funOrObj === "function" ? {
        update: funOrObj,
        element: {}
    } : funOrObj
    if (avalon.Array.ensure(list, data)) {
        injectDisposeQueue(data, list)
    }
    return function () {
        avalon.Array.remove(list, data)
    }
}

function $emit(topVm, curVm, path, a, b, i) {
    
    var hive = topVm && topVm.$events
    //console.log(path, hive,topVm)
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
                $emit(topVm, curVm, path, a, b, i - 1)
            avalon.log(e, path)
        }
    }
    if (new Date() - beginTime > 444) {
        setTimeout(function () {
            rejectDisposeQueue()
        })

    }
}
