var canUpdateEntity = true
function batchUpdateEntity(id) {
    var vm = avalon.vmodels[id]
    if (vm && canUpdateEntity) {
        var vnode = vtree[id]
        var dom = dtree[id]//真实DOM
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
