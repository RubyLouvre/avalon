/*********************************************************************
 *                           modelFactory                             *
 **********************************************************************/
//avalon最核心的方法的两个方法之一（另一个是avalon.scan），返回一个ViewModel(VM)
var VMODELS = avalon.vmodels = {} //所有vmodel都储存在这里
avalon.define = function(id, factory) {
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
function modelFactory($scope, $special, $model) {
    if (Array.isArray($scope)) {
        var arr = $scope.concat()
        $scope.length = 0
        var collection = Collection($scope)
        collection.pushArray(arr)
        return collection
    }
    if (typeof $scope.nodeType === "number") {
        return $scope
    }
    if ($scope.$id && $scope.$model && $scope.$events) { //fix IE6-8 createWithProxy $val: val引发的BUG
        return $scope
    }
    if (!Array.isArray($scope.$skipArray)) {
        $scope.$skipArray = []
    }
    $scope.$skipArray.$special = $special || {} //强制要监听的属性
    var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
    $model = $model || {} //vmodels.$model属性
    var $events = {} //vmodel.$events属性
    var watchedProperties = {} //监控属性
    var computedProperties = [] //计算属性
    for (var i in $scope) {
        (function(name, val) {
            $model[name] = val
            if (!isObservable(name, val, $scope.$skipArray)) {
                return //过滤所有非监控属性
            }
            //总共产生三种accessor
            var accessor
            var valueType = avalon.type(val)
            $events[name] = []
            //总共产生三种accessor
            if (valueType === "object" && isFunction(val.get) && Object.keys(val).length <= 2) {
                var setter = val.set
                var getter = val.get
                //第1种对应计算属性， 因变量，通过其他监控属性触发其改变
                accessor = function(newValue) {
                    var $events = $vmodel.$events
                    var oldValue = $model[name]
                    if (arguments.length) {
                        if (stopRepeatAssign) {
                            return
                        }
                        if (isFunction(setter)) {
                            var backup = $events[name]
                            $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                            setter.call($vmodel, newValue)
                            $events[name] = backup
                        }
                    } else {
                        if (avalon.openComputedCollect) { // 收集视图刷新函数
                            collectSubscribers($events[name])
                        }
                    }
                    newValue = $model[name] = getter.call($vmodel) //同步$model
                    if (!isEqual(oldValue, newValue)) {
                        notifySubscribers($events[name]) //同步视图
                        safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                    }
                    return newValue
                }
                computedProperties.push(function() {
                    Registry[expose] = {
                        evaluator: accessor,
                        element: head,
                        type: "computed::" + name,
                        handler: noop,
                        args: []
                    }
                    accessor()
                    collectSubscribers($events[name])
                    delete Registry[expose]
                })
            } else if (rcomplexType.test(valueType)) {
                //第2种对应子ViewModel或监控数组 
                accessor = function(newValue) {
                    var childVmodel = accessor.child
                    var oldValue = $model[name]
                    if (arguments.length) {
                        if (stopRepeatAssign) {
                            return
                        }
                        if (!isEqual(oldValue, newValue)) {
                            childVmodel = accessor.child = neutrinoFactory($vmodel, name, newValue, valueType)
                            newValue = $model[name] = childVmodel.$model //同步$model
                            var fn = midway[childVmodel.$id]
                            fn && fn() //同步视图
                            safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                        }
                    } else {
                        collectSubscribers($events[name]) //收集视图函数
                        return childVmodel
                    }
                }
                var childVmodel = accessor.child = modelFactory(val, 0, $model[name])
                childVmodel.$events[subscribers] = $events[name]
            } else {
                //第3种对应简单的数据类型，自变量，监控属性
                accessor = function(newValue) {
                    var oldValue = $model[name]
                    if (arguments.length) {
                        if (!isEqual(oldValue, newValue)) {
                            $model[name] = newValue //同步$model
                            notifySubscribers($events[name]) //同步视图
                            safeFire($vmodel, name, newValue, oldValue) //触发$watch回调
                        }
                    } else {
                        collectSubscribers($events[name])
                        return oldValue
                    }
                }
            }
            watchedProperties[name] = accessor
        })(i, $scope[i])
    }

    $$skipArray.forEach(function(name) {
        delete $scope[name]
        delete $model[name] //这些特殊属性不应该在$model中出现
    })

    $vmodel = defineProperties($vmodel, descriptorFactory(watchedProperties), $scope) //生成一个空的ViewModel
    for (var name in $scope) {
        if (!watchedProperties[name]) {
            $vmodel[name] = $scope[name]
        }
    }
    //添加$id, $model, $events, $watch, $unwatch, $fire
    $vmodel.$id = generateID()
    $vmodel.$model = $model
    $vmodel.$events = $events
    for (var i in EventManager) {
        var fn = EventManager[i]
        if (!W3C) { //在IE6-8下，VB对象的方法里的this并不指向自身，需要用bind处理一下
            fn = fn.bind($vmodel)
        }
        $vmodel[i] = fn
    }

    if (canHideOwn) {
        Object.defineProperty($vmodel, "hasOwnProperty", {
            value: function(name) {
                return name in $vmodel.$model
            },
            writable: false,
            enumerable: false,
            configurable: true
        })
    } else {
        $vmodel.hasOwnProperty = function(name) {
            return name in $vmodel.$model
        }
    }

    computedProperties.forEach(function(collect) { //收集依赖
        collect()
    })
    return $vmodel
}

//比较两个值是否相等
var isEqual = Object.is || function(v1, v2) {
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
        EventManager.$fire.call(a, b, c, d)
    }
}

var descriptorFactory = W3C ? function(obj) {
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
} : function(a) {
    return a
}



//应用于第2种accessor
var midway = {}
function neutrinoFactory(parent, name, value, valueType) {
    //a为原来的VM， b为新数组或新对象
    var son = parent[name]
    if (valueType === "array") {
        if (!Array.isArray(value) || son === value) {
            return son //fix https://github.com/RubyLouvre/avalon/issues/261
        }
        son.clear()

        son.pushArray(value.concat())
        return son
    } else {//object
        var iterators = parent.$events[name]
        var pool = son.$events.$withProxyPool
        if (pool) {
            proxyCinerator(pool)
            son.$events.$withProxyPool = null
        }
        var ret = modelFactory(value)
        ret.$events[subscribers] = iterators
        midway[ret.$id] = function(data) {
            while (data = iterators.shift()) {
                (function(el) {
                    if (el.type) { //重新绑定
                        avalon.nextTick(function() {
                            el.rollback && el.rollback() //还原 ms-with ms-on
                            bindingHandlers[el.type](el, el.vmodels)
                        })
                    }
                })(data)
            }
            delete midway[ret.$id]
        }
        return ret
    }
}
