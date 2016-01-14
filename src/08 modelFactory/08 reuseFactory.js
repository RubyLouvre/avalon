
/**
 * 回收已有子vm构建新的子vm
 * 
 * @param {Component} before
 * @param {Component} after
 * @param {Object} heirloom
 * @param {Object} options
 * @returns {Component}
 */
function reuseFactory(before, after, heirloom, options) {
    var keys = {}
    var $accessors = {}
    var $idname = options.idname
    var $pathname = options.pathname
    var resue = before.$accessors || {}

    var key, sid, spath

    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = before[key]
        if (!isSkip(key, after[key], {})) {
            if (resue[key]) {
                $accessors[key] = resue[key]
            } else {
                sid = $idname + "." + key
                spath = $pathname ? $pathname + "." + key : key
                $accessors[key] = makeObservable(sid, spath, heirloom)
            }
        }
    }

    var $vmodel = new SubComponent()
    $vmodel = defineProperties($vmodel, $accessors, keys)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$id", $idname)
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$hashcode", generateID("$"))
    
    return $vmodel
}