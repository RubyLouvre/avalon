import {
    transactionStart,
    transactionEnd,
    reportObserved,
    propagateChanged
} from './transaction'
import {
    avalon,
    platform
} from '../seed/core'
/**
* 
 与Computed等共享UUID
*/
export let obid = 1
export function Mutation(expr, value, vm) { //构造函数
    this.expr = expr
    if (value) {
        var childVm = platform.createProxy(value, this)
        if (childVm) {
            value = childVm
        }
    }
    this.value = value
    this.vm = vm
    try {
        vm.$mutations[expr] = this
    } catch (ignoreIE) {}
    this.uuid = ++obid
    this.updateVersion()
    this.mapIDs = {}
    this.observers = []
}

Mutation.prototype = {
    get() {
        if (avalon.trackingAction) {
            this.collect() //被收集
            var childOb = this.value
            if (childOb && childOb.$events) {
                if (Array.isArray(childOb)) {
                    childOb.forEach(function(item) {
                        if (item && item.$events) {
                            item.$events.__dep__.collect()
                        }
                    })
                } else if (avalon.deepCollect) {
                    for (var key in childOb) {
                        if (childOb.hasOwnProperty(key)) {
                            var collectIt = childOb[key]
                        }
                    }
                }

            }
        }
        return this.value
    },

    collect() {
        avalon.track(name, '被收集')
        reportObserved(this)
    },

    updateVersion() {
        this.version = Math.random() + Math.random()
    },

    notify() {
        transactionStart()
        propagateChanged(this)
        transactionEnd()
    },

    set(newValue) {
        var oldValue = this.value
        if (newValue !== oldValue) {
            if (avalon.isObject(newValue)) {
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
}