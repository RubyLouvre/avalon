var dependencyDetection = (function () {
    var outerFrames = [],
            currentFrame,
            lastId = 0;

    // Return a unique ID that can be assigned to an observable for dependency tracking.
    // Theoretically, you could eventually overflow the number storage size, resulting
    // in duplicate IDs. But in JavaScript, the largest exact integral value is 2^53
    // or 9,007,199,254,740,992. If you created 1,000,000 IDs per second, it would
    // take over 285 years to reach that number.
    // Reference http://blog.vjeux.com/2010/javascript/javascript-max_int-number-limits.html
    function getId() {
        return ++lastId;
    }

    function begin(options) {
        outerFrames.push(currentFrame);
        currentFrame = options;
    }

    function end() {
        currentFrame = outerFrames.pop();
    }

    return {
        begin: begin,
        end: end,
        registerDependency: function (otherAccessor) {
        
            if (currentFrame) {
                    console.log(otherAccessor._name + "进入依赖收集系统")
                currentFrame.callback(otherAccessor, otherAccessor._id || (otherAccessor._id = getId()));
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


//创建一个简单的访问器
var makeSimpleAccessor = function (name) {
    function accessor(value) {
        if (arguments.length > 0) {
            var name = accessor._name
            var $vmodel = this
            var $model = $vmodel.$model
            var oldValue = $model[name]
            var $events = $vmodel.$events
            if (oldValue !== value) {
                accessor.updateVersion()
                accessor.notify(this, value)
            }
            return this
        } else {
            dependencyDetection.registerDependency(accessor)
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
        return this.getVersion() !== versionToCheck
    }
    accessor.updateVersion = function () {
        ++this._versionNumber
    }
    accessor.notify = function (vmodel, value) {
        var name = this._name
        console.log("进入notify", name, value)
        vmodel.$model[name] = value
    }

}
var $vmodel = {} //要返回的对象, 它在IE6-8下可能被偷龙转凤
var $model = {} //vmodels.$model属性
var $events = {} //vmodel.$events属性
var fn = makeSimpleAccessor("firstName")
var vm = Object.defineProperty($vmodel, "firstName", {
    get: fn,
    set: fn,
    enumerable: true,
    configurable: true
})
vm.$model = $model
vm.$events = $events
function setProperty($vmodel, name, value) {
    $vmodel.$events[name] = []
    $vmodel[name] = value
}
setProperty(vm, "firstName", 1)
vm.firstName = 22
console.log( vm.firstName )

//创建一个简单的访问器
var makeComputedAccessor = function (name, options) {
    var dependencyTracking = {}
    var _dependenciesCount = 0
    var _needsEvaluation  = true
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

    function evaluateImmediate($vmodel, accessor, oldValue) {
        var disposalCandidates = dependencyTracking
        var disposalCount = _dependenciesCount
        dependencyDetection.begin({
            callback: function (otherAccessor, id) {
                if (disposalCount && disposalCandidates[id]) {
                    // Don't want to dispose this subscription, as it's still being used
                    addDependencyTracking(id, otherAccessor, disposalCandidates[id]);
                    delete disposalCandidates[id];
                    --disposalCount;
                } else if (!dependencyTracking[id]) {
                    // Brand new subscription - add it
                    addDependencyTracking(id, otherAccessor, {_target: otherAccessor})
                }
            }
        })
        
        dependencyTracking = {}
        _dependenciesCount = 0
        try {
            var newValue = accessor.get.call($vmodel)
        } finally {
            dependencyDetection.end()
            _needsEvaluation = false
        }
        if (newValue !== oldValue) {
            oldValue = newValue;
            accessor.updateVersion()
            console.log("evaluateImmediate "+ $vmodel)
            accessor.notify($vmodel, oldValue)
        }
        return oldValue
    }
    function accessor(value) {
        if (arguments.length > 0) {
            var name = accessor._name
            var $vmodel = this
            var $model = $vmodel.$model
            var oldValue = $model[name]
            var $events = $vmodel.$events
            if (typeof accessor.set === "function") {
                var lock = $events[name]
                $events[name] = [] //清空回调，防止内部冒泡而触发多次$fire
                accessor.set.call($vmodel, value)
                $events[name] = lock
            }
            if (haveDependenciesChanged()) {
                accessor.updateVersion()
                accessor.notify($vmodel, value)
            }
            return this
        } else {
            if (_needsEvaluation || haveDependenciesChanged()) {
                console.log("+1111111111"+ $vmodel)
                oldValue = evaluateImmediate($vmodel, accessor, oldValue)
            }
            dependencyDetection.registerDependency(accessor)
            return oldValue
        }
    }
    accessor.set = options.set
    accessor.get = options.get
    accessorFactory(accessor, name)
    return accessor;
}

var fn2 = makeComputedAccessor("fullName",{
    get: function(){
        return this.firstName+"!!"
    }
})
Object.defineProperty(vm, "fullName", {
    get: fn2,
    set: fn2,
    enumerable: true,
    configurable: true
})

setProperty(vm, "fullName", 33)

console.log(vm.fullName)

