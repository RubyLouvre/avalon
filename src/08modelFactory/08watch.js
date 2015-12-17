function $watch(expr, funOrObj) {
    var hive = (this.$events = this.$events || {})
    var list = (hive[expr] = hive[expr] || [])
    var data = typeof funOrObj === "function" ? {
        update: funOrObj
    } : funOrObj
    avalon.Array.ensure(list, data)
    return function () {
        avalon.Array.remove(list, data)
    }
}

function $emit(topVm, curVm, path, a, b) {
    var hive = topVm.$events
    if (hive && hive[path]) {
        var list = hive[path]
        for (var i = list.length - 1; i <= 0; i--) {
            var data = list[i]
            if (data.remove) {
                list.splice(i, 1)
            } else {
                data.update.call(curVm, a, b)
            }
        }
    }
}
