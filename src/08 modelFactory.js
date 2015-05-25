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
var $$skipArray = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray").match(rword)

function isObservable(name, value, $skipArray) {
    if (isFunction(value) || value && value.nodeType) {
        return false
    }
    if ($skipArray.indexOf(name) !== -1) {
        return false
    }
//    if ($$skipArray.indexOf(name) !== -1) {
//        return false
//    }
    var $special = $skipArray.$special
    if (name && name.charAt(0) === "$" && !$special[name]) {
        return false
    }
    return true
}


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
        var collection = Collection(source)// jshint ignore:line
        collection.pushArray(arr)
        return collection
    }
    //0 null undefined || Node || VModel(fix IE6-8 createWithProxy $val: val引发的BUG)
    if (!source || source.nodeType > 0 || (source.$id && source.$events)) {
        return source
    }
    var $skipArray = source.$skipArray || []
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
    var dependencies = {}
    var initializing = true
    var isSetting = false
    function accessor(value) {//计算属性
        var oldValue = accessor._value
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (typeof accessor.set === "function") {
                isSetting = true
                accessor.set.call(this, value)
                isSetting = false
            }
            //如果依赖发现改变
            if (haveDependenciesChanged(dependencies)) {
                accessor.updateValue(this, value)//更新自身的值
                updateDependencies(dependencies)//更新检测对象上依赖项的值
                accessor.notify(this, value, oldValue)//触发$watch回调及视图刷新
            }
            return this
        } else {
            //将依赖于自己的高层访问器或视图刷新函数（以绑定对象形式）放到自己的订阅数组中
            dependencyDetection.collectDependency(this, accessor)
            if (initializing || haveDependenciesChanged(dependencies)) {
                //将自己注入到低层访问器的订阅数组中
                oldValue = computeAndInjectSubscribers(this, true)
                updateDependencies(dependencies)
            }
            return oldValue
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)

    function computeAndInjectSubscribers(vmodel, isInject) {
        var oldValue = accessor._value
        if (isInject) {
            dependencyDetection.begin({
                callback: function (vm, dependency) {//dependency为一个accessor
                    var name = dependency._name
                    if (!dependencies[name]) {
                        if (dependency !== accessor) {
                            var trackingObj = {
                                _target: dependency
                            }
                            dependencies[name] = trackingObj
                            trackingObj._value = dependency._value
                        }
                        var list = vm.$events[name]
                        injectSubscribers(list, function () {
                            return computeAndInjectSubscribers(vmodel)
                        })
                    }
                }
            })
        }
        try {
            var newValue = accessor.get.call(vmodel)
        } finally {
            if (isInject)
                dependencyDetection.end()
            initializing = false
        }
        if (!isEqual(newValue, oldValue)) {
            accessor.updateValue(vmodel, newValue)
            // 不能在这里使用 updateDependencies， 这会让修改fullName，无法触发fullName的$watch回调
            if (!isInject)
                accessor.notify(vmodel, newValue, oldValue)
            oldValue = newValue
        }
        return oldValue
    }

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
                son = accessor._vmodel = modelFactory(value)
            }
            accessor.updateValue(this, son.$model)
            accessor.notify(this, this._value, oldValue)
            return son
        } else {
            dependencyDetection.collectDependency(this, accessor)
            return oldValue
        }
    }
    accessorFactory(accessor, name)
    accessor._vmodel = modelFactory(initValue)
    return accessor
}

function accessorFactory(accessor, name) {
    accessor._name = name
    //判其值有没有变化
    accessor.hasChanged = function (curValue) {
        return this._value !== curValue
    }
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


//它应该放在所有updateVersion方法之前
function updateDependencies(dependencies) {
    for (var id in dependencies) {
        var dependency = dependencies[id]
        dependency._value = dependency._target._value
    }
}

//判定此计算属性的所依赖的访问器们有没有发生改动
function haveDependenciesChanged(dependencies) {
    var id, dependency;
    for (id in dependencies) {
        if (dependencies.hasOwnProperty(id)) {
            dependency = dependencies[id];
            if (dependency._target.hasChanged(dependency._value)) {
                return true
            }
        }
    }
}