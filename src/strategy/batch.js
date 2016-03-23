
/**
 * ------------------------------------------------------------
 * batch 同时对N个视图进行全量更新
 * ------------------------------------------------------------
 */

var patch = require('./patch')

//如果正在更新一个子树,那么将它放到
var dirtyTrees = {}
var isBatchingUpdates = false
var needRenderIds = []
function batchUpdate(id, immediate) {
    var vm = avalon.vmodels[id]
    if (!document.nodeName || !vm || vm.$render === avalon.noop)//如果是在mocha等测试环境中立即返回
        return

    if (dirtyTrees[id]) {
        avalon.Array.ensure(needRenderIds, id)
    } else {
        dirtyTrees[id] = true
    }

    if (isBatchingUpdates) {
        return
    }

    var dom = vm.$element
    if (dom) {
        flushUpdate(function () {
            isBatchingUpdates = true
            var vtree = vm.$render()
            avalon.diff(vtree, dom.vtree || [])
            patch([dom], vtree)
            dom.vtree = vtree

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
        var id = needRenderIds.shift()
        if (id) {
            batchUpdate(id, true)
        }
    } else {
        avalon.nextTick(callback)
    }
}

module.exports = avalon.batch = batchUpdate
