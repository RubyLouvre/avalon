/*********************************************************************
 *                           modelFactory                             *
 **********************************************************************/
//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
var VMODELS = avalon.vmodels = createMap() //所有vmodel都储存在这里
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
    if ($$skipArray.indexOf(name) !== -1) {
        return false
    }
    var $special = $skipArray.$special
    if (name && name.charAt(0) === "$" && !$special[name]) {
        return false
    }
    return true
}
//ms-with,ms-each, ms-repeat绑定生成的代理对象储存池
var midway = createMap()
function getNewValue(accessor, name, value, $vmodel) {
    switch (accessor.type) {
        case 0://计算属性
            var getter = accessor.get
            var setter = accessor.set
            if (isFunction(setter)) {
                var $events = $vmodel.$events
                var lock = $events[name]
                $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                setter.call($vmodel, value)
                $events[name] = lock
            }
            return  getter.call($vmodel) //同步$model
        case 1://监控属性
            return value
        case 2://对象属性（包括数组与哈希）
            if (value !== $vmodel.$model[name]) {
                var svmodel = accessor.svmodel = objectFactory($vmodel, name, value, accessor.valueType)
                value = svmodel.$model //同步$model
                var fn = midway[svmodel.$id]
                fn && fn() //同步视图
            }
            return value
    }
}

function modelFactory(source, $special, $model) {
    if (Array.isArray(source)) {
        var arr = source.concat()
        source.length = 0
        var collection = Collection(source)// jshint ignore:line
        collection.pushArray(arr)
        return collection
    }
    //0 null undefined || Node || VModel
    if (!source || source.nodeType > 0 || (source.$id && source.$events)) {
        return source
    }
    if (!Array.isArray(source.$skipArray)) {
        source.$skipArray = []
    }
    source.$skipArray.$special = $special || createMap() //强制要监听的属性
    var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
    $model = $model || {} //vmodels.$model属性
    var $events = createMap() //vmodel.$events属性
    var watchedProperties = createMap() //监控属性
    var initCallbacks = [] //初始化才执行的函数
    for (var i in source) {
        (function (name, val) {
            $model[name] = val
            if (!isObservable(name, val, source.$skipArray)) {
                return //过滤所有非监控属性
            }
            //总共产生三种accessor
            $events[name] = []
            var valueType = avalon.type(val)
            var accessor = function (newValue) {
                var name = accessor._name
                var $vmodel = this
                var $model = $vmodel.$model
                var oldValue = $model[name]
                var $events = $vmodel.$events

                if (arguments.length) {
                    if (stopRepeatAssign) {
                        return
                    }
                    //计算属性与对象属性需要重新计算newValue
                    if (accessor.type !== 1) {
                        newValue = getNewValue(accessor, name, newValue, $vmodel)
                        if (!accessor.type)
                            return
                    }
                    if (!isEqual(oldValue, newValue)) {
                        $model[name] = newValue
                        notifySubscribers($events[name]) //同步视图
                        safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                    }
                } else {
                    if (accessor.type === 0) { //type 0 计算属性 1 监控属性 2 对象属性
                        //计算属性不需要收集视图刷新函数,都是由其他监控属性代劳
                        newValue = accessor.get.call($vmodel)
                        if (oldValue !== newValue) {
                            $model[name] = newValue
                            //这里不用同步视图
                            safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                        }
                        return newValue
                    } else {
                        collectSubscribers($events[name]) //收集视图函数
                        return accessor.svmodel || oldValue
                    }
                }
            }
            //总共产生三种accessor
            if (valueType === "object" && isFunction(val.get) && Object.keys(val).length <= 2) {
                //第1种为计算属性， 因变量，通过其他监控属性触发其改变
                accessor.set = val.set
                accessor.get = val.get
                accessor.type = 0
                initCallbacks.push(function () {
                    var data = {
                        evaluator: function () {
                            data.type = Math.random(),
                                    data.element = null
                            $model[name] = accessor.get.call($vmodel)
                        },
                        element: head,
                        type: Math.random(),
                        handler: noop,
                        args: []
                    }
                    Registry[expose] = data
                    accessor.call($vmodel)
                    delete Registry[expose]
                })
            } else if (rcomplexType.test(valueType)) {
                //第2种为对象属性，产生子VM与监控数组
                accessor.type = 2
                accessor.valueType = valueType
                initCallbacks.push(function () {
                    var svmodel = modelFactory(val, 0, $model[name])
                    accessor.svmodel = svmodel
                    svmodel.$events[subscribers] = $events[name]
                })
            } else {
                accessor.type = 1
                //第3种为监控属性，对应简单的数据类型，自变量
            }
            accessor._name = name
            watchedProperties[name] = accessor
        })(i, source[i])// jshint ignore:line
    }

    $$skipArray.forEach(function (name) {
        delete source[name]
        delete $model[name] //这些特殊属性不应该在$model中出现
    })

    $vmodel = Object.defineProperties($vmodel, descriptorFactory(watchedProperties), source) //生成一个空的ViewModel
    for (var name in source) {
        if (!watchedProperties[name]) {
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

    initCallbacks.forEach(function (cb) { //收集依赖
        cb()
    })
    return $vmodel
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

function safeFire(a, b, c, d) {
    if (a.$events) {
        EventBus.$fire.call(a, b, c, d)
    }
}

var descriptorFactory = function (obj) {
    var descriptors = createMap()
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

//应用于第2种accessor
function objectFactory(parent, name, value, valueType) {
    //a为原来的VM， b为新数组或新对象
    var son = parent[name]
    if (valueType === "array") {
        if (!Array.isArray(value) || son === value) {
            return son //fix https://github.com/RubyLouvre/avalon/issues/261
        }
        son._.$unwatch()
        son.clear()
        son._.$watch()
        son.pushArray(value.concat())
        return son
    } else {
        var iterators = parent.$events[name]
        var pool = son.$events.$withProxyPool
        if (pool) {
            recycleProxies(pool, "with")
            son.$events.$withProxyPool = null
        }
        var ret = modelFactory(value)
        ret.$events[subscribers] = iterators
        midway[ret.$id] = function (data) {
            while (data = iterators.shift()) {
                (function (el) {
                    avalon.nextTick(function () {
                        var type = el.type
                        if (type && bindingHandlers[type]) { //#753
                            el.rollback && el.rollback() //还原 ms-with ms-on
                            bindingHandlers[type](el, el.vmodels)
                        }
                    })
                })(data)// jshint ignore:line
            }
            delete midway[ret.$id]
        }
        return ret
    }
}