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
    var list = target.observers
    for(var i = 0,el;el = list[i++];){
        el.schedule(); //通知action, computed做它们该做的事
    }
}

//将自己抛到市场上卖
export function reportObserved(observer) {
    var action = avalon.trackingAction || null
    if (action !== null) {
        avalon.track( '收集到', observer.expr)
        action.mapIDs[observer.uuid] = observer;
        observer.isCollected = 1
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
   //多个observe持有同一个action
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
            try{
              resetDeps(action)
            }catch(e){
                avalon.warn(e)
            }
        }
        return result
    }

}


function resetDeps(action) {
    var prev = action.observers, curr = [], checked = {}
    for (let i in action.mapIDs) {
        let dep = action.mapIDs[i]
        if(!dep.isAction){
            curr.push(dep)
            dep.isCollected = false
            checked[dep.uuid] = 1
            avalon.Array.ensure(dep.observers, action)
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
        if (!checked[dep.uuid]) {
          avalon.Array.remove(dep.observers, action)
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
        runActions()
    }
    endBatch(name)
}


