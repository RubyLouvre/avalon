
var share = require("./share/modern")
var $watch = share.$watch
var $emit = share.$emit
var isSkip = share.isSkip
var $$skipArray = share.$$skipArray
var $$midway = share.$$midway
var makeAccessor = share.makeAccessor
var makeObserver = share.makeObserver
var $modelAccessor = share.$modelAccessor

var makeHashCode = avalon.makeHashCode



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

    makeObserver($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}
$$midway.masterFactory = masterFactory

function slaveFactory(before, after, heirloom, options) {
    var keys = {}
    var accessors = {}
    var pathname = options.pathname
    var key, sid, spath
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = after[key]
        if (!isSkip(key, after[key], {})) {
            var accessor = Object.getOwnPropertyDescriptor(before, key)
            if (accessor && accessor.get) {
                accessors[key] = accessor
            } else {
                sid = options.id + "." + key
                spath = pathname ? pathname + "." + key : key
                accessors[key] = makeObservable(sid, spath, heirloom)
            }
        }
    }
    for (key in before) {
        delete before[key]
    }

    accessors.$model = $modelAccessor
    var $vmodel = before
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }
    makeObserver($vmodel, options, heirloom, keys, accessors)

    return $vmodel
}

$$midway.slaveFactory = slaveFactory

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

$$midway.mediatorFactory = avalon.mediatorFactory = mediatorFactory


module.exports = avalon
