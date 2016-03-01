var builtin = require("../base/builtin")
var updateEntity = require("./updateEntity")

var root = builtin.root
var document = builtin.document
var diff = require("../parser/diff")

var vtree = builtin.vtree
var dtree = builtin.dtree
//如果正在更新一个子树,那么将它放到
var dirtyTrees = {}
var isBatchingUpdates = false
function batchUpdateEntity(id, immediate) {
    var vm = avalon.vmodels[id]
    if (!document.nodeName || !vm || !vm.$render)//如果是在mocha等测试环境中立即返回
        return

    dirtyTrees[id] = true
    if (isBatchingUpdates || avalon.repeatCount) {
        return
    }
    
    var dom = document.getElementById(id)

    //document.all http://www.w3help.org/zh-cn/causes/BX9002

    if (dom) {
        flushUpdate(function () {
            isBatchingUpdates = true
            var old = dom.vnode
            var neo = vm.$render(vm)
            diff(old,neo)

          //  updateEntity([dom], [vnode])
            isBatchingUpdates = false
            delete dirtyTrees[id]
            for (var i in dirtyTrees) {//更新其他子树
                batchUpdateEntity(i, true)
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

module.exports = batchUpdateEntity
