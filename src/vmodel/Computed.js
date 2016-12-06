import { avalon } from '../seed/core'

import {
    obid,
    Mutation
} from './Mutation'
import {
    collectDeps
} from './transaction'

function getBody(fn) {
    var entire = fn.toString()
    return entire.substring(entire.indexOf('{}') + 1, entire.lastIndexOf('}'))
}
//如果不存在三目,if,方法
let instability = /(\?|if\b|\(.+\))/

function __create(o) {
    var __ = function() {}
    __.prototype = o
    return new __
}

function __extends(child, parent) {
    if (typeof parent === 'function') {
        var proto = child.prototype = __create(parent.prototype);
        proto.constructor = child
    }
}
export var Computed = (function(_super) {
    __extends(Computed, _super);

    function Computed(name, options, vm) { //构造函数
        _super.call(this, name, undefined, vm)
        delete options.get
        delete options.set

        avalon.mix(this, options)
        this.deps = {}
        this.type = 'computed'
        this.depsVersion = {}
        this.isComputed = true
        this.trackAndCompute()
        if (!('isStable' in this)) {
            this.isStable = !instability.test(getBody(this.getter))
        }
    }
    var cp = Computed.prototype
    cp.trackAndCompute = function() {
        if (this.isStable && this.depsCount > 0) {
            this.getValue()
        } else {
            collectDeps(this, this.getValue.bind(this))
        }
    }

    cp.getValue = function() {
        return this.value = this.getter.call(this.vm)
    }

    cp.schedule = function() {
        var observers = this.observers;
        var i = observers.length;
        while (i--) {
            var d = observers[i];
            if (d.schedule) {
                d.schedule()
            }
        }
    }

    cp.shouldCompute = function() {
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
    }
    cp.set = function() {
        if (this.setter) {
            avalon.transaction(this.setter, this.vm, arguments)
        }
    }
    cp.get = function() {
       
        //当被设置了就不稳定,当它被访问了一次就是稳定
        this.collect()
      
        if (this.shouldCompute()) {
            this.trackAndCompute()
                // console.log('computed 2 分支')
            this.updateVersion()
                //  this.reportChanged()
        }

        //下面这一行好像没用
        return this.value
    }
    return Computed
}(Mutation));