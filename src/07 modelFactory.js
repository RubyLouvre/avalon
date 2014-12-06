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

//===================修复浏览器对Object.defineProperties的支持=================
var defineProperty = Object.defineProperty
//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现
try {
    defineProperty({}, "_", {
        value: "x"
    })
    var defineProperties = Object.defineProperties
} catch (e) {
    if ("__defineGetter__" in avalon) {
        defineProperty = function(obj, prop, desc) {
            if ('value' in desc) {
                obj[prop] = desc.value
            }
            if ("get" in desc) {
                obj.__defineGetter__(prop, desc.get)
            }
            if ('set' in desc) {
                obj.__defineSetter__(prop, desc.set)
            }
            return obj
        }
        defineProperties = function(obj, descs) {
            for (var prop in descs) {
                if (descs.hasOwnProperty(prop)) {
                    defineProperty(obj, prop, descs[prop])
                }
            }
            return obj
        }
    }
}
//IE6-8使用VBScript类的set get语句实现
if (!defineProperties && window.VBArray) {
    window.execScript([
        "Function parseVB(code)",
        "\tExecuteGlobal(code)",
        "End Function",
        "Dim VBClassBodies",
        "Set VBClassBodies=CreateObject(\"Scripting.Dictionary\")",
        "Function findOrDefineVBClass(name,body)",
        "\tDim found",
        "\tfound=\"\"",
        "\tFor Each key in VBClassBodies",
        "\t\tIf body=VBClassBodies.Item(key) Then",
        "\t\t\tfound=key",
        "\t\t\tExit For",
        "\t\tEnd If",
        "\tnext",
        "\tIf found=\"\" Then",
        "\t\tparseVB(\"Class \" + name + body)",
        "\t\tVBClassBodies.Add name, body",
        "\t\tfound=name",
        "\tEnd If",
        "\tfindOrDefineVBClass=found",
        "End Function"
    ].join("\n"), "VBScript")

    function VBMediator(accessingProperties, name, value) {
        var accessor = accessingProperties[name]
        if (typeof accessor === "function") {
            if (arguments.length === 3) {
                accessor(value)
            } else {
                return accessor()
            }
        }
    }
    defineProperties = function(name, accessors, properties) {
        var className = "VBClass" + setTimeout("1"),
                buffer = []
        buffer.push(
                "\r\n\tPrivate [__data__], [__proxy__]",
                "\tPublic Default Function [__const__](d, p)",
                "\t\tSet [__data__] = d: set [__proxy__] = p",
                "\t\tSet [__const__] = Me", //链式调用
                "\tEnd Function")
        //添加普通属性,因为VBScript对象不能像JS那样随意增删属性，必须在这里预先定义好
        for (name in properties) {
            if (!accessors.hasOwnProperty(name)) {
                buffer.push("\tPublic [" + name + "]")
            }
        }
        $$skipArray.forEach(function(name) {
            if (!accessors.hasOwnProperty(name)) {
                buffer.push("\tPublic [" + name + "]")
            }
        })
        buffer.push("\tPublic [" + 'hasOwnProperty' + "]")
        //添加访问器属性 
        for (name in accessors) {
            buffer.push(
                    //由于不知对方会传入什么,因此set, let都用上
                    "\tPublic Property Let [" + name + "](val" + expose + ")", //setter
                    "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
                    "\tEnd Property",
                    "\tPublic Property Set [" + name + "](val" + expose + ")", //setter
                    "\t\tCall [__proxy__]([__data__], \"" + name + "\", val" + expose + ")",
                    "\tEnd Property",
                    "\tPublic Property Get [" + name + "]", //getter
                    "\tOn Error Resume Next", //必须优先使用set语句,否则它会误将数组当字符串返回
                    "\t\tSet[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                    "\tIf Err.Number <> 0 Then",
                    "\t\t[" + name + "] = [__proxy__]([__data__],\"" + name + "\")",
                    "\tEnd If",
                    "\tOn Error Goto 0",
                    "\tEnd Property")

        }

        buffer.push("End Class")
        var code = buffer.join("\r\n"),
                realClassName = window['findOrDefineVBClass'](className, code) //如果该VB类已定义，返回类名。否则用className创建一个新类。
        if (realClassName === className) {
            window.parseVB([
                "Function " + className + "Factory(a, b)", //创建实例并传入两个关键的参数
                "\tDim o",
                "\tSet o = (New " + className + ")(a, b)",
                "\tSet " + className + "Factory = o",
                "End Function"
            ].join("\r\n"))
        }
        var ret = window[realClassName + "Factory"](accessors, VBMediator) //得到其产品
        return ret //得到其产品
    }
}