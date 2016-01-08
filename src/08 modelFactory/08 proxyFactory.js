
//用于合并两个VM为一个VM

function proxyFactory(before, after, heirloom) {
    var b = before.$accessors || {}
    var a = after.$accessors || {}
    var $accessors = {}
    var keys = {}, key
    //收集所有键值对及访问器属性
    for (key in before) {
        keys[key] = before[key]
        if (b[key]) {
            $accessors[key] = b[key]
        }
    }
    for (key in after) {
        keys[key] = after[key]
        if (a[key]) {
            $accessors[key] = a[key]
        }
    }
    var $vmodel = new Component()
    $vmodel = defineProperties($vmodel, $accessors, keys)

    for (key in keys) {
        if (!$accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        if (key in $$skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }
    }

    function hasOwnKey(key) {
        return keys[key] === true
    }

    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    var id = after.$id ? before.$id + "??" + after.$id : before.$id
    hideProperty($vmodel, id)

    makeFire($vmodel, heirloom || {})
    hideProperty($vmodel, "$active", true)
    return $vmodel
}
