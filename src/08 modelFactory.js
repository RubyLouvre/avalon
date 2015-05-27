/*********************************************************************
 *                           modelFactory                             *
 **********************************************************************/
//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
var VMODELS = avalon.vmodels = {} //所有vmodel都储存在这里
avalon.define = function (id, factory) {
    var $id = id.$id || id
    if (!$id) {
        log("warning: vm必须指定$id")
    }
    if (VMODELS[$id]) {
        log("warning: " + $id + " 已经存在于avalon.vmodels中")
    }
    if (typeof id === "object") {
        var model = modelFactory(id)
    } else {
        var scope = {
            $watch: noop
        }
        factory(scope) //得到所有定义
        model = modelFactory(scope) //偷天换日，将scope换为model
        stopRepeatAssign = true
        factory(model)
        stopRepeatAssign = false
    }
    model.$id = $id
    return VMODELS[$id] = model
}

//一些不需要被监听的属性
var $$skipArray = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray,$proxy").match(rword)
var defineProperty = Object.defineProperty
var canHideOwn = true
//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
try {
    defineProperty({}, "_", {
        value: "x"
    })
    var defineProperties = Object.defineProperties
} catch (e) {
    canHideOwn = false
}

function modelFactory(source, $special, $model) {
    if (Array.isArray(source)) {
        var arr = source.concat()
        source.length = 0
        var collection = arrayFactory(source)
        collection.pushArray(arr)
        return collection
    }
    //0 null undefined || Node || VModel(fix IE6-8 createWithProxy $val: val引发的BUG)
    if (!source || source.nodeType > 0 || (source.$id && source.$events)) {
        return source
    }
    var $skipArray = Array.isArray(source.$skipArray) ? source.$skipArray : []
    $skipArray.$special = $special || {} //强制要监听的属性
    var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
    $model = $model || {} //vmodels.$model属性
    var $events = {} //vmodel.$events属性
    var accessors = {} //监控属性
    var initCallbacks = [] //初始化才执行的函数

    $$skipArray.forEach(function (name) {
        delete source[name]
    })

    for (var i in source) {
        (function (name, val, accessor) {
            $model[name] = val
            if (!isObservable(name, val, $skipArray)) {
                return //过滤所有非监控属性
            }
            //总共产生三种accessor
            $events[name] = []
            var valueType = avalon.type(val)
            //总共产生三种accessor
            if (valueType === "object" && isFunction(val.get) && Object.keys(val).length <= 2) {
                accessor = makeComputedAccessor(name, val)
                initCallbacks.push(accessor)
            } else if (rcomplexType.test(valueType)) {
                accessor = makeComplexAccessor(name, val, valueType)
                initCallbacks.push(function () {
                    var son = accessor._vmodel
                    son.$events[subscribers] = this.$events[name]
                })
            } else {
                accessor = makeSimpleAccessor(name, val)
            }
            accessors[name] = accessor
        })(i, source[i])// jshint ignore:line
    }

    $vmodel = defineProperties($vmodel, descriptorFactory(accessors), source) //生成一个空的ViewModel
    for (var name in source) {
        if (!accessors[name]) {
            $vmodel[name] = source[name]
        }
    }
    //添加$id, $model, $events, $watch, $unwatch, $fire
    $vmodel.$id = generateID()
    $vmodel.$model = $model
    $vmodel.$events = $events
//    $vmodel.$reset = function (fn) {
//        fn.call($vmodel, accessors)
//    }
    for (i in EventBus) {
        var fn = EventBus[i]
        if (!W3C) { //在IE6-8下，VB对象的方法里的this并不指向自身，需要用bind处理一下
            fn = fn.bind($vmodel)
        }
        $vmodel[i] = fn
    }
    if (canHideOwn) {
        Object.defineProperty($vmodel, "hasOwnProperty", {
            value: function (name) {
                return name in this.$model
            },
            writable: false,
            enumerable: false,
            configurable: true
        })

    } else {
        /* jshint ignore:start */
        $vmodel.hasOwnProperty = function (name) {
            return name in $vmodel.$model
        }
        /* jshint ignore:end */
    }
    initCallbacks.forEach(function (cb) { //收集依赖
        cb.call($vmodel)
    })
    return $vmodel
}
//创建一个简单访问器
var makeSimpleAccessor = function (name, value) {
    function accessor(value) {
        var oldValue = accessor._value
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (!isEqual(value, oldValue)) {
                accessor.updateValue(this, value)
                accessor.notify(this, value, oldValue)
            }
            return this
        } else {
            dependencyDetection.collectDependency(this, accessor)
            return oldValue
        }
    }
    accessorFactory(accessor, name)
    accessor._value = value
    return accessor;
}

//创建一个计算访问器
var makeComputedAccessor = function (name, options) {
    options.set = options.set || noop
    function accessor(value) {//计算属性
        var oldValue = accessor._value
        var name = accessor._name
        var getter = accessor.get
        var setter = accessor.set
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            var $events = this.$events
            var lock = $events[name]
            $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
            setter.call(this, value)
            $events[name] = lock
            value = getter.call(this)
            if (!isEqual(oldValue, value)) {
                accessor.updateValue(this, value)
                accessor.notify(this, value, oldValue) //触发$watch回调
            }
            return this
        } else {
            //将依赖于自己的高层访问器或视图刷新函数（以绑定对象形式）放到自己的订阅数组中
            dependencyDetection.collectDependency(this, accessor)
            value = getter.call(this)
            if (oldValue !== value) {
                accessor.updateValue(this, value)
                accessor.notify(this, value, oldValue) //触发$watch回调
            }
            //将自己注入到低层访问器的订阅数组中
            return value
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
    return accessor
}

//创建一个复杂访问器
var makeComplexAccessor = function (name, initValue, valueType) {
    function accessor(value) {
        var oldValue = accessor._value
        var son = accessor._vmodel
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (valueType === "array") {
                var old = son._
                son._ = []
                son.clear()
                son._ = old
                son.pushArray(value)
            } else if (valueType === "object") {
                var $proxy = son.$proxy
                var observes = this.$events[name] || []
                son = accessor._vmodel = modelFactory(value)
                son.$proxy = $proxy
                if (observes.length) {
                    observes.forEach(function (data) {
                        if (data.rollback && data.type !== "duplex") {
                            data.rollback() //还原 ms-with ms-on
                            bindingHandlers[data.type](data, data.vmodels)
                        }
                    })
                    son.$events[name] = observes
                }
            }
            accessor.updateValue(this, son.$model)
            accessor.notify(this, this._value, oldValue)
            return this
        } else {
            dependencyDetection.collectDependency(this, accessor)
            return son
        }
    }
    accessorFactory(accessor, name)
    accessor._vmodel = modelFactory(initValue)
    return accessor
}

function accessorFactory(accessor, name) {
    accessor._name = name
    //同时更新_value与model
    accessor.updateValue = function (vmodel, value) {
        vmodel.$model[this._name] = this._value = value
    }
    accessor.notify = function (vmodel, value, oldValue) {
        var name = this._name
        var array = vmodel.$events[name] //刷新值
        if (array) {
            notifySubscribers(array) //同步视图
            EventBus.$fire.call(vmodel, name, value, oldValue) //触发$watch回调
        }
    }
}

//比较两个值是否相等
var isEqual = Object.is || function (v1, v2) {
    if (v1 === 0 && v2 === 0) {
        return 1 / v1 === 1 / v2
    } else if (v1 !== v1) {
        return v2 !== v2
    } else {
        return v1 === v2
    }
}

function isObservable(name, value, $skipArray) {
    if (isFunction(value) || value && value.nodeType) {
        return false
    }
    if ($skipArray.indexOf(name) !== -1) {
        return false
    }
    var $special = $skipArray.$special
    if (name && name.charAt(0) === "$" && !$special[name]) {
        return false
    }
    return true
}

var descriptorFactory = W3C ? function (obj) {
    var descriptors = {}
    for (var i in obj) {
        descriptors[i] = {
            get: obj[i],
            set: obj[i],
            enumerable: true,
            configurable: true
        }
    }
    return descriptors
} : function (a) {
    return a
}

