/**
 * 合并两个vm为一个vm,方便依赖收集
 *
 * @param {Component} before
 * @param {Component} after
 * @param {Object} heirloom
 * @returns {Component}
 */
function mediatorFactory(before, after, heirloom) {
    var keys = {}
    var accessors = {}

    //收集所有键值对及访问器属性
    for (var key in before) {
        keys[key] = before[key]
        var accessor = Object.getOwnPropertyDescriptor(before, key)
        if (accessor.set) {
            accessors[key] = accessor
        }
    }
    for (var key in after) {
        keys[key] = after[key]
        var accessor = Object.getOwnPropertyDescriptor(after, key)
        if (accessor.set) {
            accessors[key] = accessor
        }
    }

    var $vmodel = new Observer()
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }
    
    makeObserve($vmodel, heirloom || {}, keys, accessors, {
        id: before.$id,
        hashcode: makeHashCode("$"),
        master: true
    })


    return $vmodel
}

module.exports = mediatorFactory