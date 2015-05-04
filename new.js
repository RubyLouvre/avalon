var dependencyDetection = (function () {
    var outerFrames = [],
            currentFrame,
            lastId = 0;

    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop()
    }

    return {
        begin: begin,
        end: end,
        registerDependency: function (accessor, vmodel) {
            if (currentFrame) {
                if (!accessor._id) {
                    accessor._id = getId()
                }
                //  console.log(otherAccessor._name + "进入依赖收集系统" + currentFrame)
                currentFrame.callback(accessor, vmodel);
            }
        },
        ignore: function (callback, callbackTarget, callbackArgs) {
            try {
                begin();
                return callback.apply(callbackTarget, callbackArgs || []);
            } finally {
                end();
            }
        },
        getDependenciesCount: function () {
            if (currentFrame)
                return currentFrame.computed.getDependenciesCount();
        },
        isInitial: function () {
            if (currentFrame)
                return currentFrame.isInitial;
        }
    };
})()
function accessorFactory(accessor, name) {
    accessor._name = name
    accessor.updateValue = function (value) {
        this._value = value
    }
    accessor.hasChanged = function (value) {
       return this._value !== value
    }
    accessor.collect = function (evaluator) {
        var name = this._name
        var array = this.$vmodel.$events[name]
        if (array) {
            array.push({
                element: 1,
                handler: function(){},
                evaluator: evaluator,
                args: [true]
            })
        }
    }
    accessor.notify = function (value) {
        var name = this._name
        var vmodel = this.$vmodel
        var model = vmodel.$model
        var oldValue = model[name]
        model[name] = value
        var array = vmodel.$events[name] //刷新值
        if (array) {
            notifySubscribers(array)
            for (var i = 0, fn; fn = array[i++]; ) {
                if(typeof fn === "function")
                fn.call(vmodel, value, oldValue, name)
            }
        }
    }
}
//创建一个简单访问器
var makeSimpleAccessor = function (name) {
    function accessor(newValue) {
        var value = accessor._value
        if(!accessor.$vmodel){
            accessor.$vmodel = this
        }
        if (arguments.length > 0) {
            if (value !== newValue) {
                accessor.updateValue(newValue)
                accessor.notify(newValue)
            }
            return this
        } else {
            dependencyDetection.registerDependency(accessor)
            return value
        }
    }
    accessorFactory(accessor, name)
    return accessor;
}
var rebindings = {}

//创建一个简单访问器
var makeObjectAccessor = function (name, valueType) {
    function accessor(value) {
        var name = accessor._name
        var vmodel = accessor.$vmodel || (accessor.$vmodel = this)
        var oldVmodel = vmodel[name]
        var oldValue = oldVmodel.$model
        if (arguments.length > 0) {
            if (oldValue !== value) {
               var newVmodel = updateChild(vmodel, name, value, valueType)
                value = vmodel.$model[name] = newVmodel.$model //同步$model
                var fn = rebindings[newVmodel.$id]
                fn && fn() //同步视图
                accessor.updateValue(value)
                accessor.notify(value)
            }
            return this
        } else {
            dependencyDetection.registerDependency(accessor)
            return oldVmodel
        }
    }
    accessorFactory(accessor, name)
    return accessor;
}
var updateObjectAccessor = function(parent, name, value, valueType){
     //a为原来的VM， b为新数组或新对象
//    var son = parent[name]
//    if (valueType === "array") {
//        if (!Array.isArray(value) || son === value) {
//            return son //fix https://github.com/RubyLouvre/avalon/issues/261
//        }
//        son._.$unwatch()
//        son.clear()
//        son._.$watch()
//        son.pushArray(value.concat())
//        return son
//    } else {
//        var iterators = parent.$events[name]
//        var pool = son.$events.$withProxyPool
//        if (pool) {
//            recycleProxies(pool, "with")
//            son.$events.$withProxyPool = null
//        }
//        var ret = modelFactory(value)
//        ret.$events[subscribers] = iterators
//        midway[ret.$id] = function (data) {
//            while (data = iterators.shift()) {
//                (function (el) {
//                    avalon.nextTick(function () {
//                        var type = el.type
//                        if (type && bindingHandlers[type]) { //#753
//                            el.rollback && el.rollback() //还原 ms-with ms-on
//                            bindingHandlers[type](el, el.vmodels)
//                        }
//                    })
//                })(data) // jshint ignore:line
//            }
//            delete midway[ret.$id]
//        }
//        return ret
//    }
}
//创建一个计算访问器
var makeComputedAccessor = function (name, options) {
    var dependencyTracking = {}
    var _dependenciesCount = 0
    var _needsEvaluation = true
    var isSetting = false
    function accessor(newValue) {//计算属性
        var value = accessor._value
        var vmodel = accessor.$vmodel || (accessor.$vmodel = this)
        if (arguments.length > 0) {
            if (typeof accessor.set === "function") {
                isSetting = true
                accessor.set.call(vmodel, newValue)
                isSetting = false
            }
            if (haveDependenciesChanged()) {
                accessor.updateValue(newValue)
                updateDependencyTracking()
                accessor.notify(newValue)
            }
            return this
        } else {
            if (_needsEvaluation || haveDependenciesChanged()) {
                value = compute(false)
                updateDependencyTracking()
            }
            dependencyDetection.registerDependency(accessor, this)
            return value
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
    //判定此计算属性的所依赖的访问器们有没有发生改动
   function haveDependenciesChanged(){
        var id, dependency;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._value)) {
                    return true;
                }
            }
        }
   }


    function addDependencyTracking(id, target, trackingObj) {
        if (target === accessor) {
            return
        }
        dependencyTracking[id] = trackingObj
        trackingObj._order = _dependenciesCount++
        trackingObj._value = target._value
    }
    //它应该放在所有updateValue方法之前
    function updateDependencyTracking() {
        for (var id in dependencyTracking) {
            var dependency = dependencyTracking[id]
            dependency._value = dependency._target._value
        }
    }
    function compute(isNotify) {
        var name = accessor._name
        var value = accessor._value
        var vmodel = accessor.$vmodel
        dependencyDetection.begin({
            callback: function (dependency) {
                var id = dependency._id
                if (!dependencyTracking[id]) {
                    // Brand new subscription - add it
                    addDependencyTracking(id, dependency, {_target: dependency})
                    dependency.collect(compute)
                }
            }
        })
        try {
            var newValue = accessor.get.call(vmodel)
        } finally {
            dependencyDetection.end()
            _needsEvaluation = false
        }
        if (newValue !== value) {
            value = newValue;
            accessor.updateValue(value)
            vmodel.$model[name] = value
            // 不能在这里使用 updateDependencyTracking， 这会让修改fullName，无法触发fullName的$watch回调
            if (isNotify && !isSetting)
                accessor.notify(value)
        }
        return value
    }

    return accessor;
}


function notifySubscribers(list) { //通知依赖于这个访问器的订阅者更新自身
    if (list && list.length) {

        var args = [].slice.call(arguments, 1)
        for (var i = list.length, fn; fn = list[--i]; ) {
            var el = fn.element
            if (el) {
                if (fn.$repeat) {
                    fn.handler.apply(fn, args) //处理监控数组的方法
                } else if (fn.type !== "on") { //事件绑定只能由用户触发,不能由程序触发
                    var fun = fn.evaluator || function(){}
                    fn.handler(fun.apply(0, fn.args || []), el, fn)
                }
            }
        }
    }
}


var vm = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
var $model = {} //vmodels.$model属性
var $events = {} //vmodel.$events属性

vm.$model = $model
vm.$events = $events
vm.$watch = function (name, fn) {
    var array = vm.$events[name]
    if (array) {
        array.push(fn)
    }
}
function setProperty($vmodel, name, value, accessor) {
    Object.defineProperty($vmodel, name, {
        get: accessor,
        set: accessor,
        enumerable: true,
        configurable: true
    })
    $vmodel.$events[name] = []
    $vmodel[name] = value
}
var fn = makeSimpleAccessor("firstName")
setProperty(vm, "firstName", "司徒", fn)

var fn2 = makeSimpleAccessor("lastName")
setProperty(vm, "lastName", "正美", fn2)

var fn3 = makeComputedAccessor("fullName", {
    get: function () {
        return this.firstName + " " + this.lastName
    },
    set: function (value) {
        var array = value.split(" ")
        this.firstName = array[0]
        this.lastName = array[1]
    }
})

setProperty(vm, "fullName", "司徒 正美", fn3)

var fn4 = makeComputedAccessor("fullNameMore", {
    get: function () {
        return this.fullName + " 先生"
    }
})

setProperty(vm, "fullNameMore", "xxxx", fn4)

vm.$watch("firstName", function (a, b, c) {
    console.log("fire ", c, a)
})
vm.$watch("lastName", function (a, b, c) {
    console.log("fire ", c, a)
})
vm.$watch("fullNameMore", function (a, b, c) {
    console.log("fire ", c, a)
})
vm.$watch("fullName", function (a, b, c) {
    console.log("fire ", c, a)
})


console.log(vm.fullName)

console.log(vm)
console.log(vm.fullNameMore)
console.log("----------")
vm.fullName = "111 222" //这里不应该触发firstName, lastName的$watch回调
console.log("===========")
vm.firstName = 777
vm.firstName = 888
vm.firstName = 999

