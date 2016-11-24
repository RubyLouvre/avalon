//这里只用到avalon.mix,可以用for in 循环赋值代替
var uuid = 1
var __extends = function(d, b) { //子类,父类
    for (var p in b)
        if (b.hasOwnProperty(p))
            d[p] = b[p];

    function __() { this.constructor = d; }
    d.prototype = (__.prototype = b.prototype, new __());
};

function Mutation(key, value, vm) {
    this.key = key
    this.value = value
    this.vm = vm
    this.uuid = ++uuid
    this.isJustCollect = 0;
    this.updateVersion()
    this.mapIDs = {}
    this.observers = []
}
Mutation.prototype.get = function() {
    this.reportObserved();
    return this.value;
}
Mutation.prototype.reportObserved = function() {
    startBatch();
    reportObserved(this)
    endBatch()
}
Mutation.prototype.updateVersion = function() {
    this.version = Math.random() + Math.random()
}
Mutation.prototype.reportChanged = function() {

    transactionStart("propagatingAtomChange")
    propagateChanged(this);
    transactionEnd();
}

Mutation.prototype.set = function(newValue) {
    var oldValue = this.value;
    if (newValue !== oldValue) {
        this.value = newValue
        this.updateVersion()
        this.reportChanged()
    }
}

function getBody(fn) {
    var entire = fn.toString(); // this part may fail!
    return entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"));
}
var Computed = (function(_super) {
    __extends(Computed, _super);
    //如果不存在三目,if,方法
    var instability = /(\?|if\b|\(.+\))/

    function Computed(name, getter, vm, opts) {
        _super.call(this, name, getter, vm);
        delete this.value
        this.getter = getter
        this.deps = {}
        this.depsVersion = {}
        this.isComputed = true
        this.trackAndCompute()
        this.isStable = opts ? opts.isStable : !instability.test(getBody(getter))
        this.setter = opts.setter
    }

    Computed.prototype.trackAndCompute = function() {
        if (this.isStable && this.depsCount > 0) {
            this.getValue()
        } else {
            collectDeps(this, this.getValue.bind(this))
        }
    }
    Computed.prototype.getValue = function() {
        return this.value = this.getter.call(this.vm)
    }
    Computed.prototype.onBecomeStale = function() {
        // this.get()
        var observers = this.observers;
        var i = observers.length;
        while (i--) {
            var d = observers[i];
           
            d.onBecomeStale()

        }
        console.log("===========")
    };
    Computed.prototype.shouldCompute = function() {
            if (this.isStable) { //如果变动因子确定,那么只比较变动因子的版本
                var toComputed = false
                for (var i in this.deps) {
                    if (this.deps[i].version !== this.depsVersion[i]) {
                        toComputed = true
                        this.deps[i].version = this.depsVersion[i]
                    }
                }
                return toComputed
            }
            return true
        },
        Computed.prototype.set = function() {
            if (this.setter) {
                avalon.transaction(this.setter, this.vm, arguments)
            }
        },
        Computed.prototype.get = function() {
            startBatch()
            if (avalon.inBatch === 1) {
                if (this.shouldCompute()) {
                    this.getValue()
                    this.updateVersion()
                    console.log('computed 1 分支')
                   // this.reportChanged()
                }
            } else {

                this.reportObserved()
                if (this.shouldCompute()) {
                    this.trackAndCompute()
                    console.log('computed 2 分支')
                    this.updateVersion()
                  //  this.reportChanged()
                }
            }

            endBatch()
            return this.value
        }

    return Computed;
}(Mutation));

var actionUUID = 1

function Action(type, opts, callback) {
    this.type = type
    avalon.mix(this, opts)
    this.observers = []
    this.uuid = ++actionUUID
    this.mapIDs = {} //这个用于去重
    var oldValue = this.value
    this.onInvalidate = function() {
        var newValue = this.value = this.track(this.getter)
    }
    var newValue = this.onInvalidate()
    if (callback) {
        callback(newValue, oldValue)
    }
}


Action.prototype.track = function(fn) {
    startBatch();
    this._isRunning = true;
    var value = collectDeps(this, fn);
    this._isRunning = false;
    if (this.isDisposed) {
        // clearObserving(this);
    }
    endBatch()
    return value
}
Action.prototype.runReaction = function() {

    this.onInvalidate(); //执行视图刷新
    //它必须放在函数内的最后一行
    this._isScheduled = false

};
Action.prototype.onBecomeStale = function() {
    this.schedule()
};
Action.prototype.schedule = function() {
    if (!this._isScheduled) {
        this._isScheduled = true;
        avalon.pendingReactions.push(this);
        startBatch()
        runReactions() //这里会还原_isScheduled
        endBatch()
    }
}



function propagateChanged(observable) {
    var observers = observable.observers;
    var i = observers.length;
    while (i--) {
        var d = observers[i]
        d.onBecomeStale(); //通知action, computed做它们该做的事
    }
}
//将自己抛到市场上卖
function reportObserved(observer) {
    var action = avalon.trackingAction || null
    if (action !== null) {
        action.mapIDs[observer.uuid] = observer;
    } else if (observer.observers.length === 0) {
        addToQueue(observer);
    }
}

avalon.observerQueue = []

function addToQueue(observer) {
    if (!observer.isAddToQueue) {
        observer.isAddToQueue = true;
        avalon.observerQueue.push(observer);
    }
}

avalon.pendingReactions = []
avalon.inTransaction = 0
avalon.inBatch = 0

function runReactions() {
    console.log(avalon.isRunningReactions, avalon.inTransaction)
    if (avalon.isRunningReactions === true || avalon.inTransaction > 0)
        return;
    avalon.isRunningReactions = true
    var remainingReactions = avalon.pendingReactions.splice(0);
    for (var i = 0, l = remainingReactions.length; i < l; i++) {
        remainingReactions[i].runReaction();
    }
    avalon.isRunningReactions = false
}

function collectDeps(action, getter) {

    var preAction = avalon.trackingAction
    avalon.trackingAction = action
    action.mapIDs = {} //重新收集依赖
    var hasError = true,
        result
    try {
        result = getter.call(action.vm)
        hasError = false
    } finally {
        if (hasError) {
            avalon.error('collectDeps fail')
        } else {
            // 确保它总是为null
            avalon.trackingAction = preAction || null
            resetDeps(action)
        }
        return result
    }

}

function startBatch() {
    avalon.inBatch++;
}

function endBatch() {
    if (avalon.inBatch === 1) {
        avalon.observerQueue.forEach(function(el) {
            el.isAddToQueue = false
        })
        avalon.observerQueue = [];
    }

    avalon.inBatch--;
}

function resetDeps(action) {
    var prevObserving = action.observers
    var list = []
    for (var i in action.mapIDs) {
        var dep = action.mapIDs[i]
        if (dep.isJustCollect === 0) {
            dep.isJustCollect = 1
            list.push(dep)
        }
    }
    if (!action.isComputed) {
        action.observers = list
    } else {
        action.depsCount = list.length
        action.deps = avalon.mix({}, action.mapIDs)
        action.depsVersion = {};

        for (var ii in action.mapIDs) {
            var dep = action.mapIDs[ii]
            action.depsVersion[dep.uuid] = dep.version
        }


    }
    var l = prevObserving.length;
    while (l--) {
        var dep = prevObserving[l];
        if (dep.isJustCollect === 0) {
            removeMutation(dep, action)
        }
        dep.isJustCollect = 0
    }

    for (var i = 0, dep; dep = list[i++];) {
        if (dep.isJustCollect === 1) {
            dep.isJustCollect = 0
            addMutation(dep, action);
        }
    }
}



function transaction(action, thisArg, args) {
    args = args || []
    transactionStart(action.name || action.displayName || 'anonymous transaction')
    var res = action.apply(thisArg, args)
    transactionEnd()
    return res
}
avalon.transaction = transaction

function transactionStart() {
    startBatch()
    avalon.inTransaction += 1;
}

function transactionEnd(report) {
    if (--avalon.inTransaction === 0) {
        runReactions()
    }
    endBatch()
}

function addMutation(observer, action) {
    if (observer instanceof Action) {
        return true
    }
    avalon.Array.ensure(observer.observers, action)
}

function removeMutation(observer, action) {
    if (observer instanceof Action) {
        return true
    }
    avalon.Array.remove(observer.observers, action)
}

function addOb(vm, key, value) {
    vm.observes = vm.observes || {}
    vm.observes[key] = new Mutation(key, value, vm)
    Object.defineProperty(vm, key, {
        get: function() {
            return vm.observes[key].get()
        },
        set: function(newValue) {
            vm.observes[key].set(newValue)
        }
    })
}

function addCu(vm, key, getter, opts) {
    vm.observes = vm.observes || {}
    vm.observes[key] = new Computed(key, getter, vm, opts)
    Object.defineProperty(vm, key, {
        get: function() {
            return vm.observes[key].get()
        },
        set: function(newValue) {
            vm.observes[key].set(newValue)
        }
    })
}