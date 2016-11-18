import { scheduling } from '../renders/scheduling'
var depId = 0
/**
 * 依赖收集类 用于联结 VM 与 Watcher
 */
export function Depend(key) {
    this.subs = []
    this.key = key
    this.uuid = depId++
}

/**
 * 当前收集依赖的订阅模块 watcher
 * @type  {Object}
 */
var dp = Depend.prototype
/**
 * 添加依赖订阅
 * @param  {Object}  sub
 */
dp.addSub = function (sub) {
    var index = this.subs.indexOf(sub)
    if (index === -1) {
        this.subs.push(sub)
    }
}

/**
 * 移除依赖订阅
 * @param  {Object}  sub
 */
dp.removeSub = function (sub) {
    var index = this.subs.indexOf(sub)
    if (index > -1) {
        this.subs.splice(index, 1)
    }
}

/**
 * 为 watcher 收集当前的依赖
 */
dp.collect = function () {
    if (Depend.target) {
        Depend.target.addDepend(this) 
    }
}

/**
 * 依赖变更前调用方法，用于旧数据的缓存处理
 */
dp.beforeNotify = function () {
    this.subs.forEach(function (sub) {
        sub.beforeUpdate()
    })
}

/**
 * 依赖变更，通知每一个订阅了该依赖的 sub
 * @param  {Object}  args  [数组操作参数信息]
 */
dp.notify = function (args) {
    var uuid = this.uuid
    this.subs.forEach(function (sub) {
        sub.update()
       // scheduling(sub)
    })
}


Depend.target = null
var targetStack = []

export function pushTarget(_target) {
    if (Depend.target)
        targetStack.push(Depend.target)
    Depend.target = _target
}

export function popTarget(el) {
    Depend.target = targetStack.pop()
}