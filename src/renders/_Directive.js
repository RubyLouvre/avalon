import { avalon } from '../seed/core'
import { pushTarget, popTarget } from '../vmodel/depend'
import { createGetter, createSetter } from "../parser/index"

/**
 * 用户watch回调及页面上的指令都会转换它的实例
 * @param {type} vm
 * @param {type} options
 * @param {type} callback
 * @returns {Watcher}
 */

export function Directive(vm, options, callback) {
    for (var i in options) {
        if (protectedMenbers[i] !== 1) {
            this[i] = options[i]
        }
    }
    this.vm = vm
    this.callback = callback
    // 依赖实例缓存
    this.depends = []
    this.newDepends = []
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

var dp = Directive.prototype

dp.getValue = function () {
    var scope = this.vm
    try {
        return this.getter.call(scope, scope)
    } catch (e) {
        // avalon.log(this.getter + ' exec error')
    }
}

dp.setValue = function (value) {
    var scope = this.vm
    if (this.setter) {
        this.setter.call(scope, scope, value)
    }
}
dp.get = function () {
    if (!this.type)
        return void 0
    var value
    if(this.deep){
        avalon.deepCollect = true
    }
    pushTarget(this)
    //当我们执行指令的getValue方法时，会调用vm.xxx的某个Getter，然后将指令放进它的depend.subs数组中
    //并且将收集到的depend放进newDepends中
    value = this.getValue()
    popTarget()
    if(this.deep && avalon.deepCollect){
       delete avalon.deepCollect
    }
    // 然后比较newDepends与depends数组，并不在新数组的depend去掉
    var uniq = {}
    for (var i in this.newDepends) {
        var el = this.newDepends[i]
        uniq[el.uuid] = el
    }
    for (var i in this.depends) {
        var el = this.depends[i]
        if (!uniq[el.uuid]) {
            el.removeSub(this)
        }
    }

    // 重设依赖缓存
    this.depends = this.newDepends.slice(0)
    this.newDepends.length = 0

    return value
}


dp.addDepend = function (depend) {
    if (avalon.Array.ensure(this.newDepends, depend)) {
        depend.addSub(this)
    }
}

dp.removeDepends = function (filter) {
    var self = this
    this.depends.forEach(function (depend) {
        depend.removeSub(self)
    })
}


dp.beforeUpdate = function () {
    var v = this.value
    this.oldValue = v && v.$events ? v.$model : v
}

dp.update = function (args, uuid) {
    var oldVal = this.oldValue
    var newVal = this.value = this.get()
    var callback = this.callback
    if (callback && this.diff(newVal, oldVal, args)) {
        callback.call(this.vm, this.value, oldVal, this.expr)
    }
}
/**
 * 比较两个计算值是否,一致,在for, class等能复杂数据类型的指令中,它们会重写diff复法
 */
dp.diff = function (a, b) {
    return a !== b
}
/**
 * 销毁指令
 */
dp.destroy = function () {
    this.value = null
    this.removeDepends()
    if (this.beforeDestroy) {
        this.beforeDestroy()
    }
    for (var i in this) {
        delete this[i]
    }
}
// https://swenyang.gitbooks.io/translation/content/react/fiber.html



export var protectedMenbers = {
    vm: 1,
    callback: 1,
   
    depends: 1,
    newDepends: 1,
    oldValue: 1,
    value: 1,
    getValue: 1,
    setValue: 1,
    get: 1,

    addDepend: 1,
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
    //beforeDestroy
    destroy: 1
}