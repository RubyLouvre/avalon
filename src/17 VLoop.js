function updateVLoop(array, key, callback, old) {
    if (array) {
        if (Array.isArray(array)) {
            var n = array.length - 1
            for (var i = 0; i <= n; i++) {
                var vm = simpleCopy(old)
                vm[key] = array[i]
                vm["$index"] = i
                vm["$first"] = i === 0
                vm["$last"] = i === n
                /* jshint ignore:start */
                vm["$remove"] = (function (k) {
                    return function () {
                        avalon.Array.removeAt(array, k)
                    }
                })(i)
                /* jshint ignore:end */
                callback(vm)
            }
        } else {
            var keys = Object.keys(array)
            n = keys.length - 1
            for (i = 0; i <= n; i++) {
                vm = clone(old)
                vm["$key"] = keys[i]
                vm["$val"] = array[keys[i]]
                vm["$index"] = i
                vm["$first"] = i === 0
                vm["$last"] = i === n
                callback(vm)
            }
        }
    }
}
function simpleCopy(a) {
    var b = {}
    for (var i in a) {
        b[i] = a[i]
    }
    return b
}
