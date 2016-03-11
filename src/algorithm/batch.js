
/**
 * ------------------------------------------------------------
 * batch 同时对N个视图进行全量更新
 * ------------------------------------------------------------
 */

var diff = require('./diff')
var patch = require('./patch')

//如果正在更新一个子树,那么将它放到
var dirtyTrees = {}
var isBatchingUpdates = false
function batchUpdate(id, immediate) {
    var vm = avalon.vmodels[id]
    if (!document.nodeName || !vm || !vm.$render)//如果是在mocha等测试环境中立即返回
        return

    dirtyTrees[id] = true
    if (isBatchingUpdates) {
        return
    }

    var dom = vm.$element || document.getElementById(id)
    //document.all http://www.w3help.org/zh-cn/causes/BX9002

    if (dom) {
        flushUpdate(function () {
            isBatchingUpdates = true
            var neo = vm.$render(vm)
            diff(neo, dom.vnode || [])
            patch([dom], neo)
            dom.vnode = neo
            avalon.log('rerender', new Date - avalon.rerenderStart)

            isBatchingUpdates = false
            delete dirtyTrees[id]
            for (var i in dirtyTrees) {//更新其他子树
                batchUpdate(i, true)
                break
            }
        }, immediate)
    }

}

function flushUpdate(callback, immediate ) {
    if (immediate) {
        callback()
    } else {
        avalon.nextTick(callback)
    }
}

module.exports = avalon.batch = batchUpdate
