import {
    startBatch,
    endBatch,
    transactionStart,
    transactionEnd,
    reportObserved,
    propagateChanged
} from './transaction'
import {
    platform
} from '../seed/core'
/**
* 
 与Computed等共享UUID
*/
export var obid = 1

export function Mutation(key, value, vm) {
    this.key = key
    if (value) {
        var childVm = platform.createProxy(value, this)
        if (childVm) {
            value = childVm
        }
    }
    this.value = value
    this.vm = vm
    this.uuid = ++obid
    this.isJustCollect = 0;
    this.updateVersion()
    this.mapIDs = {}
    this.observers = []
}

Mutation.prototype.get = function() {
    this.collect()
    var childOb = this.value
    if (avalon.deepCollect && childOb && childOb.$events) {
        for (var key in childOb) {
            if (childOb.hasOwnProperty(key)) {
                var collectIt = childOb[key]
            }
        }

    }
    return this.value
}

Mutation.prototype.collect = function() {
    var name = 'mutation ' + this.key
    startBatch(name)
    reportObserved(this)
    endBatch(name)
}

Mutation.prototype.updateVersion = function() {
    this.version = Math.random() + Math.random()
}

Mutation.prototype.notify = function() {
    transactionStart()
    propagateChanged(this)
    transactionEnd()
}

Mutation.prototype.set = function(newValue) {
    var oldValue = this.value
    if (newValue !== oldValue) {
        if (newValue) {
            var hash = oldValue && oldValue.$hashcode
            var childVM = platform.createProxy(newValue, this)
            if (childVM) {
                if (hash) {
                    childVM.$hashcode = hash
                }
                newValue = childVM
            }
        }
        this.value = newValue
        this.updateVersion()
        this.notify()
    }
}