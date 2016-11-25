import { avalon, config } from '../seed/core'

avalon.pendingReactions = []
avalon.inTransaction = 0
avalon.inBatch = 0
avalon.observerQueue = []
config.trackDeps = true
avalon.track = function() {
    if (config.trackDeps) {
        avalon.log.apply(avalon, arguments)
    }
}
/**
 * Batch is a pseudotransaction, just for purposes of memoizing ComputedValues when nothing else does.
 * During a batch `onBecomeUnobserved` will be called at most once per observable.
 * Avoids unnecessary recalculations.
 */
export function startBatch(name) {
    avalon.inBatch++;
}
export function endBatch(name) {
    if (avalon.inBatch === 1) {
        avalon.observerQueue.forEach(function(el) {
            el.isAddToQueue = false
        })
        avalon.observerQueue = [];
    }
    avalon.inBatch--
}

export function runReactions() {
    if (avalon.isRunningReactions === true || avalon.inTransaction > 0)
        return
    avalon.isRunningReactions = true
    var tasks = avalon.pendingReactions.splice(0);
    for (var i = 0, task; task = tasks[i++];) {
        task.update()
    }
    avalon.isRunningReactions = false
}


export function propagateChanged(observable) {
    var observers = observable.observers;
    var i = observers.length;
    while (i--) {
        var d = observers[i]
        d.schedule(); //通知action, computed做它们该做的事
    }
}

//将自己抛到市场上卖
export function reportObserved(observer) {
    var action = avalon.trackingAction || null
    if (action !== null) {
        avalon.track('收集到', (observer.key || observer.expr))
        action.mapIDs[observer.uuid] = observer;
        return
    }
    avalon.track(observer.key, observer, observer.isComputed ? 'computed 也想收集依赖' : 'mutation也想收集依赖', observer.observers)
    if (observer.observers.length === 0) {
        addToQueue(observer);
    }
}

function addToQueue(observer) {
    if (!observer.isAddToQueue) {
        observer.isAddToQueue = true;
        avalon.observerQueue.push(observer);
    }
}


export function collectDeps(action, getter) {

    var preAction = avalon.trackingAction
    avalon.trackingAction = action
    avalon.track('【action】 ', action.expr || action.key, '开始收集依赖项')
    action.mapIDs = {} //重新收集依赖
    var hasError = true,
        result
    try {
       
        result = getter.call(action)
        hasError = false
    } finally {
        if (hasError) {
            avalon.warn('collectDeps fail',getter+"", action)
            action.mapIDs = {}
            avalon.trackingAction = preAction 
        } else {
            // 确保它总是为null
            avalon.trackingAction = preAction 
            resetDeps(action)
        }
        return result
    }

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
    var l = prevObserving.length
    while (l--) {
        var dep = prevObserving[l]
        if (dep.isJustCollect === 0) {
            removeObserver(dep, action)
        }
        dep.isJustCollect = 0
    }

    for (var i = 0, dep; dep = list[i++];) {
        if (dep.isJustCollect === 1) {
            dep.isJustCollect = 0
            addObserver(dep, action);
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

export function transactionStart(name) {
    startBatch(name)
    avalon.inTransaction += 1;
}

export function transactionEnd(name) {
    if (--avalon.inTransaction === 0) {
        runReactions()
    }
    endBatch(name)
}

function addObserver(observer, action) {
    if (observer.isAction) {
        return true
    }
    avalon.Array.ensure(observer.observers, action)
}

function removeObserver(observer, action) {
   if (observer.isAction) {
        return true
    }
    delete action.mapIDs[observer.uuid]
    avalon.Array.remove(observer.observers, action)
}
