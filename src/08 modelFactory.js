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
var $$skipArray = String("$id,$watch,$unwatch,$fire,$events,$model,$skipArray,$proxy,$reinitialize").match(rword)
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
    var computed = []
    $$skipArray.forEach(function (name) {
        delete source[name]
    })
    var names = []
    for (var i in source) {
        if(source.hasOwnProperty(i)){
        (function (name, val, accessor) {
            names.push(name)
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
    }

    $vmodel = defineProperties($vmodel, descriptorFactory(accessors), source) //生成一个空的ViewModel
    for(i = 0; i < names.length; i++){
        var  name = names[i]
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
        Object.defineProperty($vmodel, "hasOwnProperty", hasOwnDescriptor)
    } else {
        /* jshint ignore:start */
        $vmodel.hasOwnProperty = function (name) {
            return name in $vmodel.$model
        }
        /* jshint ignore:end */
    }

    $vmodel.$reinitialize = function () {
        computed.forEach(function (accessor) {
            delete accessor._value
            delete accessor.oldArgs
            accessor.digest = function () {
                accessor.call($vmodel)
            }
            dependencyDetection.begin({
                callback: function (vm, dependency) {//dependency为一个accessor
                    var name = dependency._name
                    if (dependency !== accessor) {
                        var list = vm.$events[name]
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
    $vmodel.$reinitialize()
    return $vmodel
}

var hasOwnDescriptor = {
    value: function (name) {
        return name in this.$model
    },
    writable: false,
    enumerable: false,
    configurable: true
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

//创建一个计算访问器
function makeComputedAccessor(name, options) {
    function accessor(value) {//计算属性
        var oldValue = accessor._value
        var init = ("_value" in accessor)
        if (arguments.length > 0) {
            if (stopRepeatAssign) {
                return this
            }
            if (typeof accessor.set === "function") {
                if (accessor.oldArgs !== value) {
                    accessor.oldArgs = value
                    var $events = this.$events
                    var lock = $events[name]
                    $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                    accessor.set.call(this, value)
                    $events[name] = lock
                    value = accessor.get.call(this)
                    if (value !== oldValue) {
                        accessor.updateValue(this, value)
                        accessor.notify(this, value, oldValue) //触发$watch回调
                    }
                }
            }
            return this
        } else {
            //将依赖于自己的高层访问器或视图刷新函数（以绑定对象形式）放到自己的订阅数组中
            //将自己注入到低层访问器的订阅数组中
            value = accessor.get.call(this)
            accessor.updateValue(this, value)
            if (init && oldValue !== value) {
                accessor.notify(this, value, oldValue) //触发$watch回调
            }
            return value
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
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
          var a = son, b = value,
                  an = a.length,
                    bn = b.length
                    a.$lock = true
                    if (an > bn) {
                        a.splice(bn, an - bn)
                    } else if (bn > an) {
                        a.push.apply(a, b.slice(an))
                    }
                    var n = Math.min(an, bn)
                    for (var i = 0; i < n; i++) {
                        a.set(i, b[i])
                    }
                    delete a.$lock 
                    a._fire("set")
            } else if (valueType === "object") {
                var $proxy = son.$proxy
                son = accessor._vmodel = modelFactory(value)
                var observes = son.$events[subscribers] = this.$events[name] || []
                var iterators = observes.concat()
                observes.length = 0
                son.$proxy = $proxy
                while (a = iterators.shift()) {
                     var fn = bindingHandlers[a.type]
                     if (fn) { //#753
                         a.rollback && a.rollback() //还原 ms-with ms-on
                         fn(a, a.vmodels)
                     }
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

//    function diff(newObject, oldObject) {
//        var added = []
//        for (var i in newObject) {
//            if (newObject.hasOwnProperty(i)) {
//                if (!oldObject.hasOwnerProperty(i)) {
//                    added.push({
//                        name: i,
//                        value: newObject[i]
//                    })
//                }
//            }
//        }
//        var deleted = []
//        for (var i in newObject) {
//            if (oldObject.hasOwnProperty(i)) {
//                if (!newObject.hasOwnerProperty(i)) {
//                    deleted.push( Object.getOwnPropertyDescriptor(oldObject, i).get)
//                }
//            }
//        }
//        for(var i = 0; i < added.length; i++){
//            var a = added[i]
//            var fn = deleted.shift()
//            fn._name = a.name
//            fn._value = a.value
//        }
//    }