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


//创建一个简单访问器
var makeSimpleAccessor = function (name) {
    function accessor(value) {
        var name = accessor._name
        var $vmodel = this
        var $model = $vmodel.$model
        var oldValue = $model[name]
        var $events = $vmodel.$events
        if (arguments.length > 0) {
            if (oldValue !== value) {
                accessor.updateVersion()
                accessor.notify(this, value)
            }
            return this
        } else {
            dependencyDetection.registerDependency(accessor, this)
            return oldValue
        }
    }
    accessorFactory(accessor, name)
    return accessor;
}


function accessorFactory(accessor, name) {
    accessor._name = name
    accessor._versionNumber = 0
    accessor.getVersion = function () {
        return this._versionNumber
    }
    accessor.hasChanged = function (versionToCheck) {
        //console.log(this.getVersion(), versionToCheck, this._name)
        return this.getVersion() !== versionToCheck
    }
    accessor.updateVersion = function () {
        ++this._versionNumber
    }
    accessor.collect = function (collector, computed, computedVM) {
        var name = this._name
        var array = collector.$events[name]
        if (array) {
            array.push(function () {
                return computed(computedVM, true)
            })
        }
    }
    accessor.notify = function (vmodel, value) {
        var name = this._name
        //console.log("进入notify", name, value, vmodel)
        var oldValue = vmodel.$model[name]
        vmodel.$model[name] = value
        var array = vmodel.$events[name]
        if (array) {
            for (var i = 0, fn; fn = array[i++]; ) {
                fn.call(vmodel, value, oldValue, name)
            }
        }
    }

}


//创建一个计算访问器
var makeComputedAccessor = function (name, options) {
    var dependencyTracking = {}
    var _dependenciesCount = 0
    var _needsEvaluation = true
    var isSetting = false
    //判定此计算属性的所依赖的访问器们有没有发生改动
    function haveDependenciesChanged() {
        var id, dependency;
        for (id in dependencyTracking) {
            if (dependencyTracking.hasOwnProperty(id)) {
                dependency = dependencyTracking[id];
                if (dependency._target.hasChanged(dependency._version)) {
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
        trackingObj._version = target.getVersion()
    }

    function evaluateImmediate(computedVM, notify) {
        var computed = accessor
        var name = computed._name
        var value = computedVM.$model[name]
        dependencyDetection.begin({
            callback: function (accessor, accessorVM) {
                var id = accessor._id
                if (!dependencyTracking[id]) {
                    // Brand new subscription - add it
                    addDependencyTracking(id, accessor, {_target: accessor})
                    accessor.collect(accessorVM, evaluateImmediate, computedVM)
                    //console.log(dependencyTracking)
                   // console.log(computed._name)
                }
            }
        })
        try {
         
            var newValue = computed.get.call(computedVM)
             console.log("xxxxxxxxxxxx"+newValue+"  "+name)
        } finally {
            dependencyDetection.end()
            _needsEvaluation = false
        }

        if (newValue !== value) {
            value = newValue;
            computed.updateVersion()
            if (notify && !isSetting)
                computed.notify(computedVM, value)
        }
        return value
    }
    function updateDependencyTracking() {
        for (var id in dependencyTracking) {
            var dependency = dependencyTracking[id]
            dependency._version = dependency._target.getVersion()
        }
    }

    function accessor(value) {//计算属性
        var name = accessor._name
        var $vmodel = this
        var $model = $vmodel.$model
        var oldValue = $model[name]
        var $events = $vmodel.$events
        if (arguments.length > 0) {
            if (typeof accessor.set === "function") {
                isSetting = true
                accessor.set.call($vmodel, value)
                isSetting = false
            }
            if (haveDependenciesChanged()) {
                accessor.updateVersion()
                accessor.notify($vmodel, value)
            }
            return this
        } else {
            var changed = haveDependenciesChanged()
            if (_needsEvaluation || changed) {
               
                //  console.log("对" + name + "进行求值" + $vmodel)
                oldValue = evaluateImmediate($vmodel)
                 console.log("["+name+"] oldValue: "+ oldValue)
                updateDependencyTracking()
            }
            dependencyDetection.registerDependency(accessor, this)
            return oldValue
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
    return accessor;
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
        console.log("-------")
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
vm.$watch("fullName", function (a, b, c) {
    console.log("fire ", c, a)
})


console.log(vm.fullName)

console.log(vm)
console.log(vm.fullNameMore)
//vm.fullName = "111 222"
//vm.firstName = 777
//vm.firstName = 888
//vm.firstName = 999

