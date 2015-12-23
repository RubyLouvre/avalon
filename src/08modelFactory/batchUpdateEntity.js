var canUpdateEntity = true
function batchUpdateEntity(vm) {
    if (vm && canUpdateEntity) {
        var id = vm.$id
        var vnode = vtree[id]//虚拟DOM
        if (!vnode)
            return
        var dom = dtree[id]//虚拟DOM
        if (dom) {
            if (!root.contains(dom))
                return
        } else {
            for (var i = 0, node, all = document.getElementsByTagName("*");
                    node = all[i++]; ) {
                if (node.getAttribute("data-controller") === id ||
                        node.getAttribute("data-important") === id) {
                    dom = dtree[id] = node
                    break
                }
            }
        }
        if (dom) {
            canUpdateEntity = false
            setTimeout(function () {
                updateEntity([dom], [vnode])
                canUpdateEntity = true
            })
        }
    }
}
