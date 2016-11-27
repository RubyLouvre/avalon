//这里只用到avalon.mix,可以用for in 循环赋值代替
var uuid = 1
var config = avalon.config
config.trackDeps = true
avalon.track = function() {
    if (config.trackDeps) {
        avalon.log.apply(avalon, arguments)
    }
}
var STEASDY = 0 //稳定的
var FISHY = 1 //不确定稳定不稳定
var STALE = 2
    //不稳定,比如说computed c依赖于mutationa, b,
    //当a变化了,c就变成不稳定,需要进行求值

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
    this.isJustChange = false
    this.updateVersion()
    this.mapIDs = {}
    this.observers = []
}
Mutation.prototype.get = function() {

    this.reportObserved()
    this.isJustChange = false
    return this.value
}
Mutation.prototype.reportObserved = function() {
    startBatch('observer ' + this.key);
    reportObserved(this)
    endBatch('observer ' + this.key)
}
Mutation.prototype.updateVersion = function() {
    this.version = Math.random() + Math.random()
}
Mutation.prototype.reportChanged = function() {
    transactionStart("propagatingAtomChange")
    propagateChanged(this);
    transactionEnd()

}

Mutation.prototype.set = function(newValue) {
    var oldValue = this.value;
    if (newValue !== oldValue) {
        this.value = newValue
        this.updateVersion()
        this.isJustChange = true
        this.reportChanged()
    }
}

function getBody(fn) {
    var entire = fn.toString() // this part may fail!
    return entire.substring(entire.indexOf("{") + 1, entire.lastIndexOf("}"))
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
            //下面这一行好像没用
            //  startBatch('computed '+ this.key)
            //当被设置了就不稳定,当它被访问了一次就是稳定
            this.isJustChange = false
            this.reportObserved()
            if (avalon.inBatch === 1) {

                if (this.shouldCompute()) {
                    this.getValue()
                    this.updateVersion()
                    this.isJustChange = true
                        //console.log('computed 1 分支')
                        // this.reportChanged()
                }
            } else {
                if (this.shouldCompute()) {
                    this.trackAndCompute()
                        // console.log('computed 2 分支')
                    this.updateVersion()
                    this.isJustChange = true
                        //  this.reportChanged()
                }
            }
            //下面这一行好像没用
            //  endBatch('computed '+ this.key)
            return this.value
        }

    return Computed;
}(Mutation));

var actionUUID = 1

function Action(vm, opts, callback) {
    this.vm = vm
    avalon.mix(this, opts)
    this.observers = []
    this.callback =  callback
    this.uuid = ++actionUUID
    this.mapIDs = {} //这个用于去重
    var oldValue = this.value
    
    var expr = this.expr
    // 缓存取值函数
    if (typeof this.getter !== 'function') {
        this.getter = createGetter(expr, this.type)
    }
    // 缓存设值函数（双向数据绑定）
    if (this.type === 'duplex') {
        this.setter = createSetter(expr, this.type)
    }
    // 缓存表达式旧值
    this.oldValue = null
    // 表达式初始值 & 提取依赖
    if(!(this.node)){
       this.value = this.get()
   }
}
var ap = Action.prototype
ap.doAction = function(args) {
    var v = this.value
    var oldVal =  this.oldValue = v && v.$events ? v.$model : v
    var newVal = this.value = this.track(this.getter)
    var callback = this.callback
    if (callback && this.diff(newVal, oldVal, args)) {
      callback.call(this.vm, this.value, oldVal, this.expr)
    }
}

ap.track = function(fn) {
    var name = 'action track ' + this.type
    startBatch(name);
    this._isRunning = true;
    var value = collectDeps(this, fn);
    this._isRunning = false
    if (this.isDisposed) {
        this.observers = []
    }
    endBatch(name)
    return value
}

ap.runReaction = function() {
    this.update() //执行视图刷新
    //它必须放在函数内的最后一行
    this._isScheduled = false
};
Action.prototype.onBecomeStale = function() {
    this.schedule()
}

Action.prototype.schedule = function() {
    if (!this._isScheduled) {
        this._isScheduled = true;
        avalon.pendingReactions.push(this);
        startBatch('schedule ' + this.type)
        runReactions() //这里会还原_isScheduled
        endBatch('schedule ' + this.type)
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
        avalon.track('收集到', (observer.key || observer.type))
        action.mapIDs[observer.uuid] = observer;
        return
    }
    avalon.track(observer.key, observer.isComputed ? 'computed 也想收集依赖' : 'mutation也想收集依赖', observer.observers)
    if (observer.observers.length === 0) {
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
    if (avalon.isRunningReactions === true || avalon.inTransaction > 0)
        return
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
    avalon.track('【action】 ', action.type || action.key, '开始收集依赖项')
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

function startBatch(name) {
    // console.log('startBatch '+ name)
    avalon.inBatch++;
}

function endBatch(name) {
    if (avalon.inBatch === 1) {

        avalon.observerQueue.forEach(function(el) {
            el.isAddToQueue = false
        })
        avalon.observerQueue = [];
    }

    avalon.inBatch--;
    //  console.log('endBatch '+name)
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
    var name = 'transaction ' + (action.name || action.displayName || 'noop')
    transactionStart(name)
    var res = action.apply(thisArg, args)
    transactionEnd(name)
    return res
}
avalon.transaction = transaction

function transactionStart(name) {
    startBatch(name)
    avalon.inTransaction += 1;
}

function transactionEnd(name) {
    if (--avalon.inTransaction === 0) {
        runReactions()
    }
    endBatch(name)
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

function autorun(arg1, arg2, arg3) {
    var name, view, scope;
    if (typeof arg1 === "string") {
        name = arg1;
        view = arg2;
        scope = arg3;
    } else if (typeof arg1 === "function") {
        name = arg1.name || ("Autorun@" + getNextId());
        view = arg1;
        scope = arg2;
    }
    if (scope)
        view = view.bind(scope);
    var reaction = new Reaction(name, function() {
        this.track(reactionRunner);
    });

    function reactionRunner() {
        view(reaction);
    }
    reaction.schedule();
    return reaction.getDisposer();
}

function autorunAsync(arg1, arg2, arg3, arg4) {
    var name, func, delay, scope;
    if (typeof arg1 === "string") {
        name = arg1;
        func = arg2;
        delay = arg3;
        scope = arg4;
    } else if (typeof arg1 === "function") {
        name = arg1.name || ("AutorunAsync@" + getNextId());
        func = arg1;
        delay = arg2;
        scope = arg3;
    }
    if (delay === void 0)
        delay = 1;
    if (scope)
        func = func.bind(scope);
    var isScheduled = false;
    var r = new Reaction(name, function() {
        if (!isScheduled) {
            isScheduled = true;
            setTimeout(function() {
                isScheduled = false;
                if (!r.isDisposed)
                    r.track(reactionRunner);
            }, delay);
        }
    });

    function reactionRunner() { func(r); }
    r.schedule();
    return r.getDisposer();
}