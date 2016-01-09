function SubComponent() {
}

function reuseFactory(before, after, heirloom, options) {
    var $pathname = options.pathname
    var $accessors = {}
    var keys = {}, key
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = after[key]
        if (!isSkip(key, after[key], {})) {
            var accessor = Object.getOwnPropertyDescriptor(before, key)
            if (accessor && accessor.get) {
                $accessors[key] = accessor
            } else {
                $accessors[key] = makeObservable($pathname + "." + key, heirloom)
            }
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

    hideProperty($vmodel, "$id", $pathname)
    hideProperty($vmodel, "hasOwnProperty", hasOwnKey)
    hideProperty($vmodel, "$active", true)
    return $vmodel
}

