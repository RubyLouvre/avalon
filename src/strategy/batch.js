
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

    if (dirtyTrees[id]) {
        avalon.Array.ensure(needRenderIds, id)
    } else {
        dirtyTrees[id] = true
    }
    var scope = avalon.scopes[id]
    if (!scope || isBatchingUpdates || !document.nodeName) {
        return
    }
    var dom = scope.dom
    var steps = {count: 0}
    var vtree = scope.render(scope.synth || scope.vmodel, scope.local)

    isBatchingUpdates = true
    avalon.diff(vtree, dom.vtree || [], steps)
    patch([dom], vtree, null, steps)
    steps.count = 0
    dom.vtree = vtree
    delete dirtyTrees[id]
    isBatchingUpdates = false
    var id = needRenderIds.shift()
    if (id) {
      return  batchUpdate(id, true)
    }
    for (var i in dirtyTrees) {
        batchUpdate(i, true)
        break
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
        setTimeout(callback, 0)
    }
}

module.exports = avalon.batch = batchUpdate
