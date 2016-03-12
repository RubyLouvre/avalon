/**
 * 合并两个vm为一个vm,方便依赖收集
 *
 * @param {Component} before
 * @param {Component} after
 * @param {Object} heirloom
 * @returns {Component}
 */

function mediatorFactory(before, after, heirloom) {
    heirloom = heirloom || {}
    var b = before.$accessors || {}
    var a = after.$accessors || {}
    var accessors = {}
    var keys = {}, key
    //收集所有键值对及访问器属性
    for (key in before) {
        keys[key] = before[key]
        if (b[key]) {
            accessors[key] = b[key]
        }
    }

    for (key in after) {
        keys[key] = after[key]
        if (a[key]) {
            accessors[key] = a[key]
        }
    }

    var $vmodel = new Observer()
    $vmodel = defineProperties($vmodel, accessors, keys)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        if (key in $$skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    makeObserve($vmodel, heirloom, keys, accessors, {
        id: before.$id,
        hashcode: makeHashCode("$"),
        master: true
    })

    return $vmodel
}


module.exports = mediatorFactory