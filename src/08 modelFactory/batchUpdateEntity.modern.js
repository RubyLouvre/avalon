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
            var node = DOC.querySelector("[data-controller='" + id + "']") ||
                    DOC.querySelector("[data-important='" + id + "']")
            if (node) {
                dom = dtree[id] = node
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
