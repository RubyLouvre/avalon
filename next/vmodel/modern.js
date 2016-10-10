/**
 * ------------------------------------------------------------
 * avalon基于纯净的Object.defineProperties的vm工厂 
 * masterFactory,slaveFactory,mediatorFactory, ArrayFactory
 * ------------------------------------------------------------
 */
import {avalon} from '../seed/core'
import {warlords} from  './warlords'
import './methods.modern'
import {$$skipArray} from './skipArray'

var isSkip = warlords.isSkip
delete $$skipArray.$accessors
delete $$skipArray.__data__
delete $$skipArray.__proxy__
delete $$skipArray.__const__

var makeAccessor = warlords.makeAccessor
var modelAccessor = warlords.modelAccessor
var initViewModel = warlords.initViewModel

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
    heirloom = heirloom || {}
    var accessors = {}
    var hashcode = makeHashCode('$')
    var pathname = options.pathname || ''
    options.id = options.id || hashcode
    options.hashcode = hashcode
    var key, sid, spath
    for (key in definition) {
        if ($$skipArray[key])
            continue
        var val = keys[key] = definition[key]
        if (!isSkip(key, val, $skipArray)) {
            sid = options.id + '.' + key
            spath = pathname ? pathname + '.' + key : key
            accessors[key] = makeAccessor(sid, spath, heirloom)
        }
    }

    accessors.$model = modelAccessor
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
    initViewModel($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}
warlords.masterFactory = masterFactory

var empty = {}
function slaveFactory(before, after, heirloom, options) {
    var keys = {}
    var accessors = {}
    var pathname = options.pathname
    heirloom = heirloom || {}
    var key, sid, spath
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = after[key]
        if (!isSkip(key, after[key], empty)) {
            var accessor = Object.getOwnPropertyDescriptor(before, key)
            if (accessor && accessor.get) {
                accessors[key] = accessor
            } else {
                sid = options.id + '.' + key
                spath = pathname ? pathname + '.' + key : key
                accessors[key] = makeAccessor(sid, spath, heirloom)
            }
        }
    }
    for (key in before) {
        delete before[key]
    }

    options.hashcode = before.$hashcode || makeHashCode('$')
    accessors.$model = modelAccessor
    var $vmodel = before
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        keys[key] = true
    }
    initViewModel($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}

warlords.slaveFactory = slaveFactory

function mediatorFactory(before, after) {
    var keys = {}
    var accessors = {}
    var unresolve = {}
    var heirloom = {}
    var $skipArray = {}
    var arr = avalon.slice(arguments)
    var config
    var configName
    var isWidget = typeof this === 'function' && this.isWidget
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i]
        //收集所有键值对及访问器属性
        for (var key in obj) {
            var cur = obj[key]
            if (key === '$skipArray') {
                if (Array.isArray(cur)) {
                    cur.forEach(function (el) {
                        $skipArray[el] = 1
                    })
                }
                continue
            }
            if (isWidget && arr.indexOf(cur) !== -1) {//处理配置对象
                config = cur
                configName = key
                continue
            }
            var accessor = Object.getOwnPropertyDescriptor(obj, key)

            keys[key] = cur

            if (accessors[key] && avalon.isObject(cur)) {//处理子vm
                delete accessors[key]
            }
            if (accessor.set) {
                accessors[key] = accessor
            } else if (typeof keys[key] !== 'function') {
                unresolve[key] = 1
            }
        }
    }
    if (typeof this === 'function') {
        this(keys, unresolve)
    }
    for (key in unresolve) {
        if ($$skipArray[key] || accessors[key])
            continue
        if (!isSkip(key, keys[key], $skipArray)) {
            accessors[key] = makeAccessor(before.$id + '.' + key, key, heirloom)
            accessors[key].set(keys[key])
        }
    }

    var $vmodel = new Observer()
    Object.defineProperties($vmodel, accessors)

    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性
            $vmodel[key] = keys[key]
        }
        if (isWidget && config && accessors[key] && config.hasOwnProperty(key)) {
            var GET = accessors[key].get
            if (!GET.$decompose) {
                GET.$decompose = {}
            }
            GET.$decompose[configName + '.' + key] = $vmodel
        }
        keys[key] = true
    }

    initViewModel($vmodel, heirloom, keys, accessors, {
        id: before.$id,
        hashcode: makeHashCode("$"),
        master: true
    })

    return $vmodel
}

avalon.mediatorFactory = mediatorFactory
