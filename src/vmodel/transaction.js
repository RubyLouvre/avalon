import { avalon, config } from '../seed/core'

avalon.pendingActions = []
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

export function runActions() {
    console.log(avalon.isRunningActions ,avalon.pendingActions , avalon.inTransaction)
    if (avalon.isRunningActions === true || avalon.inTransaction > 0)
        return
    avalon.isRunningActions = true
    var tasks = avalon.pendingActions.splice(0);
    for (var i = 0, task; task = tasks[i++];) {
        task.update()
    }
    avalon.isRunningActions = false
}


export function propagateChanged(target) {
    var list = target.observers,
        el
    while (el = list.pop()) {
        el.schedule(); //通知action, computed做它们该做的事
    }
}

//将自己抛到市场上卖
export function reportObserved(observer) {
    var action = avalon.trackingAction || null
    if (action !== null) {
        avalon.track( '收集到', observer.expr)
        action.mapIDs[observer.uuid] = observer;
    } else if (observer.observers.length === 0) {
        addToQueue(observer);
    }
}

function addToQueue(observer) {
    if (!observer.isAddToQueue) {
        observer.isAddToQueue = true;
        avalon.observerQueue.push(observer);
    }
}

var targetStack = []

export function collectDeps(action, getter) {
   
    var preAction = avalon.trackingAction
    if(preAction){
        targetStack.push(preAction)
    }
    avalon.trackingAction = action
    avalon.track('【action】', action.type, action.expr, '开始收集依赖项')
    action.mapIDs = {} //重新收集依赖
    var hasError = true,
        result
    try {

        result = getter.call(action)
        hasError = false
    } finally {
        if (hasError) {
            avalon.warn('collectDeps fail', getter + "", action)
            action.mapIDs = {}
            avalon.trackingAction = preAction
        } else {
            // 确保它总是为null
            avalon.trackingAction = targetStack.pop()
            resetDeps(action)
           
//            if(avalon.trackingAction){
//                resetDeps(avalon.trackingAction)
//            }
        }
        return result
    }

}


function resetDeps(action) {
    var prev = action.observers, curr = []
    for (let i in action.mapIDs) {
        let dep = action.mapIDs[i]
        if (dep.isJustCollect === 0) {
            dep.isJustCollect = 1
            curr.push(dep)
        }
    }
    if (!action.isComputed) {
        action.observers = curr
    } else {
        action.depsCount = curr.length
        action.deps = avalon.mix({}, action.mapIDs)
        action.depsVersion = {};
        for (let i in action.mapIDs) {
            let dep = action.mapIDs[ii]
            action.depsVersion[dep.uuid] = dep.version
        }
    }
    
    for (let i = 0, dep; dep = prev[i++];) {
        if (dep.isJustCollect === 0) {
            removeObserver(dep, action)
        }
    }
   

    for (let i = 0, dep; dep = curr[i++];) {
        if (dep.isJustCollect === 1) {
            dep.isJustCollect = 0
            addObserver(dep, action)
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
        avalon.isRunningActions = false
        console.log('00000000')
        runActions()
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