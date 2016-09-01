
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
  /*  if (spath) {
        var newBody = renderFn.body.replace(/dynamic\:{[^}]+}/g, function (str) {
            if (str.indexOf(spath) === -1) {
                return "dynamic:0"
            } else {
                return str
            }
        })
        var copy = Function('__vmodel__', '__local__', newBody)(scope.vmodel, scope.local)
    } else {
        var copy = renderFn(scope.vmodel, scope.local)
    }*/
    var copy = renderFn(scope.vmodel, scope.local)

    if (scope.isTemp) {
        //在最开始时,替换作用域的所有节点,确保虚拟DOM与真实DOM是对齐的
        delete avalon.scopes[id]
    }


    avalon.diff(copy, source)


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
