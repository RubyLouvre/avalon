

var share = require("./share/compact")
var $watch = share.$watch
var $emit = share.$emit
var isSkip = share.isSkip
var $$skipArray = share.$$skipArray
var $$midway = share.$$midway
var makeAccessor = share.makeAccessor
var makeObserver = share.makeObserver
var $modelAccessor = share.$modelAccessor

var makeHashCode = avalon.makeHashCode

var defineProperties = require("./share/defineProperties")


//一个vm总是为Observer的实例
function Observer() {
}
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
    $vmodel = defineProperties($vmodel, accessors, definition)

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

    makeObserver($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}

$$midway.masterFactory = masterFactory

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

    makeObserver($vmodel, options, heirloom, keys, accessors)

    return $vmodel
}

$$midway.slaveFactory = slaveFactory

function mediatorFactory(before, after, heirloom) {
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

    makeObserver($vmodel, heirloom || {}, keys, accessors, {
        id: before.$id,
        hashcode: makeHashCode("$"),
        master: true
    })

    return $vmodel
}


$$midway.mediatorFactory = avalon.mediatorFactory =  mediatorFactory






module.exports = avalon
//使用这个来扁平化数据  https://github.com/gaearon/normalizr
//使用Promise  https://github.com/stefanpenner/es6-promise
//使用这个AJAX库 https://github.com/matthew-andrews/isomorphic-fetch