/**
 * 合并两个vm为一个vm,方便依赖收集
 * 
 * @param {Component} before 
 * @param {Component} after
 * @param {Boolean}   disabled 让before不可用
 * @returns {Component}
 */
function proxyFactory(before, after) {
    var $accessors = {}
    var keys = {}
    //收集所有键值对及访问器属性
    for (var key in before) {
        keys[key] = before[key]
        var accessor = Object.getOwnPropertyDescriptor(before, key)
        if (accessor.set) {
            $accessors[key] = accessor
        }
    }
    for (var key in after) {
        keys[key] = after[key]
        var accessor = Object.getOwnPropertyDescriptor(after, key)
        if (accessor.set) {
            $accessors[key] = accessor
        }
    }
    

    var $vmodel = new SubComponent()
    Object.defineProperties($vmodel, $accessors)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    makeFire($vmodel)

    hideProperty($vmodel, "$id", before.$id)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$hashcode", makeHashCode("$"))

    return $vmodel
}
/**
 * @private 
 */
avalon.proxyFactory = proxyFactory