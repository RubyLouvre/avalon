/**
 * 回收已有子vm构建新的子vm
 * 用于vm.obj = newObj 的场合
 * 
 * @param {Observer} before
 * @param {Observer} after
 * @param {Object} heirloom
 * @param {Object} options
 * @returns {Observer}
 */
function slaveFactory(before, after, heirloom, options) {
    var keys = {}
    var accessors = {}
    var pathname = options.pathname
    var key, sid, spath
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = after[key]
        if (!isSkip(key, after[key], {})) {
            var accessor = Object.getOwnPropertyDescriptor(before, key)
            if (accessor && accessor.get) {
                accessors[key] = accessor
            } else {
                sid = options.id + "." + key
                spath = pathname ? pathname + "." + key : key
                accessors[key] = makeObservable(sid, spath, heirloom)
            }
        }
    }
    for (key in before) {
        delete before[key]
    }

    accessors.$model = $modelAccessor
    var $vmodel = before
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }
     makeObserve($vmodel, options, heirloom, keys, accessors)

    return $vmodel
}

module.exports = slaveFactory