import {
    avalon
} from '../seed/core'

import {
    runActions,
    collectDeps
} from './transaction'

import {
    createGetter,
    createSetter
} from "../parser/index"

export var actionUUID = 1
    //需要重构
export function Action(vm, options, callback) {
    for (var i in options) {
        if (protectedMenbers[i] !== 1) {
            this[i] = options[i]
        }
    }

    this.vm = vm
    this.observers = []
    this.callback = callback
    this.uuid = ++actionUUID
    this.ids = ''
    this.mapIDs = {} //这个用于去重
    this.isAction = true
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
    this.value = NaN
        // 表达式初始值 & 提取依赖
    if (!(this.node)) {
        this.value = this.get()
    }
}

Action.prototype = {
    getValue() {
        var scope = this.vm
        try {
            return this.getter.call(scope, scope)
        } catch (e) {
            avalon.log(this.getter + ' exec error')
        }
    },

    setValue(value) {
        var scope = this.vm
        if (this.setter) {
            this.setter.call(scope, scope, value)
        }
    },

    // get --> getValue --> getter
    get(fn) {
        var name = 'action track ' + this.type

        if (this.deep) {
            avalon.deepCollect = true
        }

        var value = collectDeps(this, this.getValue)
        if (this.deep && avalon.deepCollect) {
            avalon.deepCollect = false
        }

        return value
    },

    /**
     * 在更新视图前保存原有的value
     */
    beforeUpdate() {
        return this.oldValue = getPlainObject(this.value)
    },


    update(args, uuid) {
        var oldVal = this.beforeUpdate()
        var newVal = this.value = this.get()
        var callback = this.callback
        if (callback && this.diff(newVal, oldVal, args)) {
            callback.call(this.vm, this.value, oldVal, this.expr)
        }
        this._isScheduled = false
    },
    schedule() {
        if (!this._isScheduled) {
            this._isScheduled = true
            if (!avalon.uniqActions[this.uuid]) {
                avalon.uniqActions[this.uuid] = 1
                avalon.pendingActions.push(this)
            }

            runActions() //这里会还原_isScheduled


        }
    },
    removeDepends() {
        var self = this
        this.observers.forEach(function(depend) {
            avalon.Array.remove(depend.observers, self)
        })
    },

    /**
     * 比较两个计算值是否,一致,在for, class等能复杂数据类型的指令中,它们会重写diff复法
     */
    diff(a, b) {
        return a !== b
    },

    /**
     * 销毁指令
     */
    dispose() {
        this.value = null
        this.removeDepends()
        if (this.beforeDispose) {
            this.beforeDispose()
        }
        for (var i in this) {
            delete this[i]
        }
    }

}

function getPlainObject(v) {
    if (v && typeof v === 'object') {
        if (v && v.$events) {
            return v.$model
        } else if (Array.isArray(v)) {
            let ret = []
            for (let i = 0, n = v.length; i < n; i++) {
                ret.push(getPlainObject(v[i]))
            }
            return ret
        } else {
            let ret = {}
            for (let i in v) {
                ret[i] = getPlainObject(v[i])
            }
            return ret
        }
    } else {
        return v
    }
}

export var protectedMenbers = {
    vm: 1,
    callback: 1,

    observers: 1,
    oldValue: 1,
    value: 1,
    getValue: 1,
    setValue: 1,
    get: 1,

    removeDepends: 1,
    beforeUpdate: 1,
    update: 1,
    //diff
    //getter
    //setter
    //expr
    //vdom
    //type: "for"
    //name: "ms-for"
    //attrName: ":for"
    //param: "click"
    //beforeDispose
    dispose: 1
}
