function SubComponent() {
}

//创建子VM
function reuseFactory(before, after, heirloom, pathname) {
    var resue = before.$accessors || {}
    var $accessors = {}
    var keys = {}, key, path
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = before[key]
        if (!isSkip(key, after[key], {})) {
            if (resue[key]) {
                $accessors[key] = resue[key]
            } else {
                path = pathname ? pathname + "." + key : key
                $accessors[key] = makeObservable(path, heirloom)
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
    $vmodel.$id = before.$id
    hideProperty($vmodel, "$accessors", $accessors)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$active", true)
    return $vmodel
}