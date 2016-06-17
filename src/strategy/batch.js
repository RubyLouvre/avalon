
/**
 * ------------------------------------------------------------
 * batch 同时对N个视图进行全量更新
 * ------------------------------------------------------------
 */

var patch = require('./patch2')


//如果正在更新一个子树,那么将它放到
var needRenderIds = []
var renderingID = false
avalon.suspendUpdate = 0

function batchUpdate(id) {
    if (renderingID) {
        return avalon.Array.ensure(needRenderIds, id)
    } else {
        renderingID = id
    }
    
    var scope = avalon.scopes[id]
    if (!scope || !document.nodeName || avalon.suspendUpdate) {
        return renderingID = null
    }
    var dom = scope.dom
    var steps = {count: 0}
    var vtree = scope.render(scope.synth || scope.vmodel, scope.local)

    avalon.diff(vtree, dom.vtree || [], steps)
    patch([dom], vtree, null, steps)
    steps.count = 0
    dom.vtree = vtree
    
  
    var index = needRenderIds.indexOf(renderingID)
    renderingID = null
    if (index > -1) {
        var removed = needRenderIds.splice(index, 1)
        return batchUpdate(removed[0])
    }
    
    var more = needRenderIds.shift()
    if (more) {
        batchUpdate(more)
    }
}



module.exports = avalon.batch = batchUpdate
