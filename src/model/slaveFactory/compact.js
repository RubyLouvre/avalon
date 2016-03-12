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
    var skips = {}
    var accessors = {}
    var pathname = options.pathname
    var resue = before.$accessors || {}
    var key, sid, spath
    
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = true
        if (!isSkip(key, after[key], {})) {
            if (resue[key]) {
                accessors[key] = resue[key]
            } else {
                sid = options.id + "." + key
                spath = pathname ? pathname + "." + key : key
                accessors[key] = makeAccessor(sid, spath, heirloom)
            }
        } else {
            skips[key] = after[key]
        }
    }

    options = before.hashcode || makeHashCode("$")
    accessors.$model = $modelAccessor
    var $vmodel = new Observer()
    $vmodel = defineProperties($vmodel, accessors, skips)

    for (key in skips) {
        $vmodel[key] = skips[key]
        delete after[key]
    }
    
    makeObserve($vmodel, options, heirloom, keys, accessors)
   
    return $vmodel
}



module.exports = slaveFactory