function batchUpdate(vm) {
    if (vm && canUpdateDom) {
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
            canUpdateDom = false
            setTimeout(function () {
                updateTree([dom], [vnode])
                canUpdateDom = true
            })
        }
    }
}
var canUpdateDom = true