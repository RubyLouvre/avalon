/**
 * ------------------------------------------------------------
 * avalon基于纯净的Object.defineProperties的vm工厂 
 * masterFactory,slaveFactory,mediatorFactory, ArrayFactory
 * ------------------------------------------------------------
 */
var share = require('./parts/modern')
var isSkip = share.isSkip
var $$midway = share.$$midway
var $$skipArray = share.$$skipArray
delete $$skipArray.$accessors
delete $$skipArray.__data__
delete $$skipArray.__proxy__
delete $$skipArray.__const__

var makeAccessor = share.makeAccessor
var initViewModel = share.initViewModel
var modelAccessor = share.modelAccessor
var modelAdaptor = share.modelAdaptor
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
$$midway.masterFactory = masterFactory

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

$$midway.slaveFactory = slaveFactory

function mediatorFactory(before, after) {
    var keys = {}
    var accessors = {}
    var unresolve = {}
    var heirloom = {}
    var $skipArray ={}
    var arr = avalon.slice(arguments)
    var config
    var configName
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i]
        //收集所有键值对及访问器属性
        for (var key in obj) {
         
            keys[key] = obj[key]
            
            if(key === '$skipArray' && Array.isArray(obj.$skipArray)){
                obj.$skipArray.forEach(function(el){
                    $skipArray[el] = 1
                })
            }
            var accessor = Object.getOwnPropertyDescriptor(obj, key)
            if (accessor.set) {
                if (arr.indexOf(obj[key]) === -1) {
                    accessors[key] = accessor
                } else { //去掉vm那个配置对象
                    config = keys[key]
                    configName = key
                    delete keys[key]
                }
            } else if (typeof keys[key] !== 'function') {
                unresolve[key] = 1
            }
        }
    }
    if(typeof this === 'function'){
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
        if (configName && accessors[key] && config.hasOwnProperty(key)) {
            var $$ = accessors[key]
            if (!$$.get.$decompose) {
                $$.get.$decompose = {}
            }
            $$.get.$decompose[configName+'.'+key] = $vmodel
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

$$midway.mediatorFactory = avalon.mediatorFactory = mediatorFactory

var __array__ = share.__array__
var ap = Array.prototype
var _splice = ap.splice
function notifySize(array, size) {
    if (array.length !== size) {
        array.notify('length', array.length, size, true)
    }
}

__array__.removeAll = function (all) { //移除N个元素
    var size = this.length
    if (Array.isArray(all)) {
        for (var i = this.length - 1; i >= 0; i--) {
            if (all.indexOf(this[i]) !== -1) {
                _splice.call(this, i, 1)
            }
        }
    } else if (typeof all === 'function') {
        for (i = this.length - 1; i >= 0; i--) {
            var el = this[i]
            if (all(el, i)) {
                _splice.call(this, i, 1)
            }
        }
    } else {
        _splice.call(this, 0, this.length)

    }

    notifySize(this, size)
    this.notify()
}


var __method__ = ['push', 'pop', 'shift', 'unshift', 'splice']
__method__.forEach(function (method) {
    var original = ap[method]
    __array__[method] = function (a, b) {
        // 继续尝试劫持数组元素的属性
        var args = [], size = this.length
        if (method === 'splice' && Object(this[0]) === this[0]) {
            var old = this.slice(a, b)
            var neo = ap.slice.call(arguments, 2)
            var args = [a, b]
            for (var j = 0, jn = neo.length; j < jn; j++) {
                var item = old[j]
                args[j + 2] = modelAdaptor(neo[j], item, (item && item.$events||{}), {
                    id: this.$id + '.*',
                    master: true
                })
            }
        } else {
            for (var i = 0, n = arguments.length; i < n; i++) {
                args[i] = modelAdaptor(arguments[i], 0, {}, {
                    id: this.$id + '.*',
                    master: true
                })
            }
        }

        var result = original.apply(this, args)

        notifySize(this, size)
        this.notify()

        return result
    }
})

'sort,reverse'.replace(avalon.rword, function (method) {
    __array__[method] = function () {
        ap[method].apply(this, arguments)
        this.notify()
        return this
    }
})


module.exports = avalon
