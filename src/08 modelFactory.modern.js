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

function modelFactory(source, $special, $model) {
    if (Array.isArray(source)) {
        var arr = source.concat()
        source.length = 0
        var collection = arrayFactory(source)// jshint ignore:line
        collection.pushArray(arr)
        return collection
    }
    //0 null undefined || Node || VModel(fix IE6-8 createWithProxy $val: val引发的BUG)
    if (!source || source.nodeType > 0 || (source.$id && source.$events)) {
        return source
    }
    var $skipArray = Array.isArray(source.$skipArray) ? source.$skipArray : []
    $skipArray.$special = $special || createMap() //强制要监听的属性
    var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
    $model = $model || {} //vmodels.$model属性
    var $events = createMap() //vmodel.$events属性
    var accessors = createMap() //监控属性
    var computed = []
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
                computed.push(accessor)
            } else if (rcomplexType.test(valueType)) {
                accessor = makeComplexAccessor(name, val, valueType, $events[name])
            } else {
                accessor = makeSimpleAccessor(name, val)
            }
            accessors[name] = accessor
        })(i, source[i])// jshint ignore:line
    }

    $vmodel = Object.defineProperties($vmodel, descriptorFactory(accessors)) //生成一个空的ViewModel
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
        $vmodel[i] = EventBus[i]
    }

    Object.defineProperty($vmodel, "hasOwnProperty", {
        value: function (name) {
            return name in this.$model
        },
        writable: false,
        enumerable: false,
        configurable: true
    })
    $vmodel.$compute = function () {
        computed.forEach(function (accessor) {
            dependencyDetection.begin({
                callback: function (vm, dependency) {//dependency为一个accessor
                    var name = dependency._name
                    if (dependency !== accessor) {
                        var list = vm.$events[name]
                        accessor.vm = $vmodel
                        injectDependency(list, accessor.digest)
                    }
                }
            })
            try {
                accessor.get.call($vmodel)
            } finally {
                dependencyDetection.end()
            }
        })
    }
    $vmodel.$compute()
    return $vmodel
}

//创建一个简单访问器
function makeSimpleAccessor(name, value) {
    function accessor(value) {
        var oldValue = accessor._value
        if (arguments.length > 0) {
            if (!stopRepeatAssign && !isEqual(value, oldValue)) {
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

///创建一个计算访问器
function makeComputedAccessor(name, options) {
    options.set = options.set || noop
    function accessor(value) {//计算属性
        var oldValue = accessor._value
        var init = "_value" in accessor
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            accessor.set.call(this, value)
            return this
        } else {
            //将依赖于自己的高层访问器或视图刷新函数（以绑定对象形式）放到自己的订阅数组中
            value = accessor.get.call(this)
            if (oldValue !== value) {
                accessor.updateValue(this, value)
                init && accessor.notify(this, value, oldValue) //触发$watch回调
            }
            //将自己注入到低层访问器的订阅数组中
            return value
        }

    }
    accessor.set = options.set || noop
    accessor.get = options.get
    accessorFactory(accessor, name)
    var id
    accessor.digest = function () {
        accessor.updateValue = globalUpdateModelValue
        accessor.notify = noop
        accessor.call(accessor.vm)
        clearTimeout(id)//如果计算属性存在多个依赖项，那么等它们都更新了才更新视图
        id = setTimeout(function () {
            accessorFactory(accessor, accessor._name)
            accessor.call(accessor.vm)
        })
    }
    return accessor
}

//创建一个复杂访问器
function makeComplexAccessor(name, initValue, valueType, list) {
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
                        if (data.rollback) {
                            data.rollback() //还原 ms-with ms-on
                        }
                        bindingHandlers[data.type](data, data.vmodels)
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
    var son = accessor._vmodel = modelFactory(initValue)
    son.$events[subscribers] = list
    return accessor
}

function globalUpdateValue(vmodel, value) {
    vmodel.$model[this._name] = this._value = value
}
function globalUpdateModelValue(vmodel, value) {
    vmodel.$model[this._name] = value
}
function globalNotify(vmodel, value, oldValue) {
    var name = this._name
    var array = vmodel.$events[name] //刷新值
    if (array) {
        fireDependencies(array) //同步视图
        EventBus.$fire.call(vmodel, name, value, oldValue) //触发$watch回调
    }
}

function accessorFactory(accessor, name) {
    accessor._name = name
    //同时更新_value与model
    accessor.updateValue = globalUpdateValue
    accessor.notify = globalNotify
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

var descriptorFactory = function (obj) {
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
}

