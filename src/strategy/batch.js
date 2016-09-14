
/**
 * ------------------------------------------------------------
 * batch 同时对N个视图进行全量更新
 * ------------------------------------------------------------
 */

//var reconcile = require('./reconcile')

//如果正在更新一个子树,那么将它放到
var needRenderIds = []
var renderingID = false
avalon.suspendUpdate = 0

function batchUpdate(id, spath) {
          // console.log(spath,'!!!')
    if (renderingID) {
      
        return avalon.Array.ensure(needRenderIds, id)
    } else {
        renderingID = id
    }
    var scope = avalon.scopes[id]
    if (!scope || !document.nodeName || avalon.suspendUpdate) {
        return renderingID = null
    }
    var vm = scope.vmodel
    var dom = vm.$element
    var source = dom.vtree || []
    var renderFn = vm.$render
    if(spath){
        spath = new RegExp( avalon.escapeRegExp(spath) )
    }
    avalon.spath = spath
    var copy = renderFn(scope.vmodel, scope.local)
    if (scope.isTemp) {
        //在最开始时,替换作用域的所有节点,确保虚拟DOM与真实DOM是对齐的
        delete avalon.scopes[id]
    }
    avalon.diff(copy, source)
    delete avalon.spath

    var index = needRenderIds.indexOf(renderingID)
    renderingID = 0
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
