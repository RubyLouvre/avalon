/**
 * ------------------------------------------------------------
 * avalon基于纯净的Object.defineProperties的vm工厂 
 * masterFactory,slaveFactory,mediatorFactory, ArrayFactory
 * ------------------------------------------------------------
 */
import avalon from '../seed/core'
import {warlords} from  './warlords'
import './methods.compact'

var isSkip = warloads.isSkip
var $$skipArray = warloads.$$skipArray
if (warloads.canHideProperty) {
    delete $$skipArray.$accessors
    delete $$skipArray.__data__
    delete $$skipArray.__proxy__
    delete $$skipArray.__const__
}

var makeAccessor = warloads.makeAccessor
var modelAccessor = warloads.modelAccessor
var createViewModel = warloads.createViewModel
var initViewModel = warloads.initViewModel

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
    options.hashcode = options.hashcode || hashcode
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
    $vmodel = createViewModel($vmodel, accessors, definition)

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
    var skips = {}
    var accessors = {}
    heirloom = heirloom || {}
    var pathname = options.pathname
    var resue = before.$accessors || {}
    var key, sid, spath
    for (key in after) {
        if ($$skipArray[key])
            continue
        keys[key] = true//包括可监控与不可监控的
        if (!isSkip(key, after[key], empty)) {
            if (resue[key]) {
                accessors[key] = resue[key]
            } else {
                sid = options.id + '.' + key
                spath = pathname ? pathname + '.' + key : key
                accessors[key] = makeAccessor(sid, spath, heirloom)
            }
        } else {
            skips[key] = after[key]
            delete after[key]
        }
    }

    options.hashcode = before.$hashcode || makeHashCode('$')
    accessors.$model = modelAccessor
    var $vmodel = new Observer()
    $vmodel = createViewModel($vmodel, accessors, skips)

    for (key in skips) {
        $vmodel[key] = skips[key]
    }

    initViewModel($vmodel, heirloom, keys, accessors, options)

    return $vmodel
}

warlords.slaveFactory = slaveFactory

function mediatorFactory(before, after) {
    var keys = {}, key
    var accessors = {}//新vm的访问器
    var unresolve = {}//需要转换的属性集合
    var heirloom = {}
    var arr = avalon.slice(arguments)
    var $skipArray = {}
    var isWidget = typeof this === 'function' && this.isWidget
    var config
    var configName
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i]
        //收集所有键值对及访问器属性
        var $accessors = obj.$accessors
        for (var key in obj) {
            if (!obj.hasOwnProperty(key)) {
                continue
            }
            var cur = obj[key]
            if (key === '$skipArray') {//处理$skipArray
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

            keys[key] = cur
            if (accessors[key] && avalon.isObject(cur)) {//处理子vm
                delete accessors[key]
            }
            if ($accessors && $accessors[key]) {
                accessors[key] = $accessors[key]
            } else if (typeof keys[key] !== 'function') {
                unresolve[key] = 1
            }
        }
    }


    if (typeof this === 'function') {
        this(keys, unresolve)
    }
    for (key in unresolve) {
        //系统属性跳过,已经有访问器的属性跳过
        if ($$skipArray[key] || accessors[key])
            continue
        if (!isSkip(key, keys[key], $skipArray)) {

            accessors[key] = makeAccessor(before.$id, key, heirloom)
            accessors[key].set(keys[key])
        }
    }

    var $vmodel = new Observer()
    $vmodel = createViewModel($vmodel, accessors, keys)
    for (key in keys) {
        if (!accessors[key]) {//添加不可监控的属性

            $vmodel[key] = keys[key]
        }
        //用于通过配置对象触发组件的$watch回调
        if (isWidget && config && accessors[key] && config.hasOwnProperty(key)) {
            var GET = accessors[key].get
            //  GET.heirloom = heirloom
            if (!GET.$decompose) {
                GET.$decompose = {}
            }
            GET.$decompose[configName + '.' + key] = $vmodel
        }

        if (key in $$skipArray) {
            delete keys[key]
        } else {
            keys[key] = true
        }

    }

    initViewModel($vmodel, heirloom, keys, accessors, {
        id: before.$id,
        hashcode: makeHashCode('$'),
        master: true
    })

    return $vmodel
}


avalon.mediatorFactory = mediatorFactory



