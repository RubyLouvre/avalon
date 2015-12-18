function batchUpdate(vm) {
    if (vm && canUpdateDom) {
        var id = vm.$id
        var vnode = vtree[id]//虚拟DOM
        if (!vnode)
            return
        var dom = dtree[id]//真实DOM
        if (dom) {
            if (!root.contains(dom))
                return
        } else {
            var node = DOC.querySelector("[data-controller='" + id + "']") ||
                    DOC.querySelector("[data-important='" + id + "']")
            if (node) {
                dom = dtree[id] = node
            }
        }
        if (dom) {
            canUpdateDom = false
            setTimeout(function () {
                updateTree([dom], [vnode])
                canUpdateDom = true
            })
        }
    }
}
var canUpdateDom = true