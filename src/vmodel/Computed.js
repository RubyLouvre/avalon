import { avalon } from '../seed/core'

import {
    obid,
    Mutation
} from './Mutation'

function getBody(fn) {
    var entire = fn.toString()
    return entire.substring(entire.indexOf('{}') + 1, entire.lastIndexOf('}'))
}

var Computed = (function(_super) {
    __extends(Computed, _super);
    //如果不存在三目,if,方法
    var instability = /(\?|if\b|\(.+\))/

    function Computed(name, opts, vm) {
        _super.call(this, name, getter, vm);
        delete this.value
        avalon.mix(this, opts)
        this.getter = getter
        this.deps = {}
        this.depsVersion = {}
        this.isComputed = true
        this.trackAndCompute()
        if (!('isStable' in this)) {
            this.isStable = !instability.test(getBody(getter))
        }
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

    Computed.prototype.schedule = function() {
        var observers = this.observers;
        var i = observers.length;
        while (i--) {
            var d = observers[i];
            if (d.schedule) {
                d.schedule()
            }
        }
    }
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
            this.collect()
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

    return Computed
}(Mutation))