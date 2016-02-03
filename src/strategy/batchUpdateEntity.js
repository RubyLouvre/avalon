var builtin = require("../base/builtin")
var updateEntity = require("./updateEntity")

var root = builtin.root
var document = builtin.document

var vtree = builtin.vtree
var dtree = builtin.dtree
//如果正在更新一个子树,那么将它放到
var dirtyTrees = {}
var isBatchingUpdates = false
function batchUpdateEntity(id, immediate) {
    if (!document.nodeName)//如果是在mocha等测试环境中立即返回
        return
    var vm = avalon.vmodels[id]
    if (vm) { //确保是有效ID
        if (isBatchingUpdates) {
            dirtyTrees[id] = true
            return
        }
        dirtyTrees[id] = true
        var vnode = vtree[id]
        var tagName = vnode.type
        var dom = dtree[id]   //真实DOM
        if (dom) {
            if (!root.contains(dom)) {
                delete vtree[id]
                delete dtree[id]
                return
            }
        } else {
            //document.all http://www.w3help.org/zh-cn/causes/BX9002
            for (var i = 0, node, all = document.getElementsByTagName(tagName);
                    node = all[i++]; ) {
                if (
                        node.getAttribute("ms-controller") === id ||
                        node.getAttribute("ms-important") === id ||
                        node.getAttribute("av-controller") === id ||
                        node.getAttribute("av-important") === id ||
                        String(node.getAttribute("data-controller")).slice(0, -2) === id
                        ) {
                    dom = dtree[id] = node

                    break
                }
            }
        }
        if (dom) {
            flushUpdate(function () {
                isBatchingUpdates = true
                updateEntity([dom], [vnode])
                isBatchingUpdates = false
                delete dirtyTrees[id]
                for (var i in dirtyTrees) {//更新其他子树
                    batchUpdateEntity(i, true)
                    break
                }
            }, immediate)
        }
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
