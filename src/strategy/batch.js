
/**
 * ------------------------------------------------------------
 * batch 同时对N个视图进行全量更新
 * ------------------------------------------------------------
 */

var patch = require('./patch')


//如果正在更新一个子树,那么将它放到
var dirtyTrees = {}
var needRenderIds = []
avalon.suspendUpdate = 0
var isBatchingUpdates = false
function batchUpdate(id, immediate) {
    var vm = typeof id === 'string' ?  avalon.vmodels[id]||{} : id
    if (dirtyTrees[id]) {
        avalon.Array.ensure(needRenderIds, id)
    } else {
        dirtyTrees[id] = true
    }
    if (avalon.suspendUpdate > 0 || typeof vm.$render !== 'function' || !vm.$element || isBatchingUpdates) {
        return
    }

    if (!document.nodeName)//如果是在mocha等测试环境中立即返回
        return


    var dom = vm.$element

    flushUpdate(function () {
        isBatchingUpdates = true
        var vtree = vm.$render()
        var steps = {count:0}
        avalon.diff(vtree, dom.vtree || [], steps)
        patch([dom], vtree, null, steps )
        steps.count = 0
        dom.vtree = vtree
        isBatchingUpdates = false
        avalon.log('rerender', vm.$id, new Date - avalon.rerenderStart)
        delete dirtyTrees[id]
        for (var i in dirtyTrees) {//更新其他子树
            batchUpdate(i, true)
            break
        }

    }, immediate)


}

function flushUpdate(callback, immediate ) {
    if (immediate) {
        callback()
        var id = needRenderIds.shift()
        if (id) {
            batchUpdate(id, true)
        }
    } else {
        setTimeout(callback, 0)
    }
}

module.exports = avalon.batch = batchUpdate
