
/**
 * 生成一个vm
 *
 * @param {Object} definition 用户的原始数据
 * @param {Object} heirloom   用来保存顶层vm的引用
 * @param {Object} options
 *        top      {Boolean} 是否顶层vm
 *        idname   {String}  $id
 *        pathname {String}  当前路径
 * @returns {Observer}
 */

function masterFactory(definition, heirloom, options) {

    var $skipArray = {}
    if (definition.$skipArray) {//收集所有不可监听属性
        $skipArray = avalon.oneObject(definition.$skipArray)
        delete definition.$skipArray
    }

    var keys = {}
    options = options || {}
    var accessors = {}
    var hashcode = makeHashCode("$")
    var pathname = options.pathname || ""
    options.id = options.id || hashcode
    options.hashcode = hashcode
    var key, sid, spath
    for (key in definition) {
        if ($$skipArray[key])
            continue
        var val = keys[key] = definition[key]
        if (!isSkip(key, val, $skipArray)) {
            sid = options.id + "." + key
            spath = pathname ? pathname + "." + key : key
            accessors[key] = makeAccessor(sid, spath, heirloom)
        }
    }

    accessors.$model = $modelAccessor
    var $vmodel = new Observer()
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        //对普通监控属性或访问器属性进行赋值
        $vmodel[key] = keys[key]
        //删除系统属性
        if (key in $skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    makeObserve($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}
module.exports = masterFactory