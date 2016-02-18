//销毁虚拟DOM树，方便avalon在$emit方法中回收它们
function disposeVirtual(nodes) {
    for (var i = 0, node; node = nodes[i++]; ) {
        switch (node.type) {
            case "#text":
            case "#comment":
                node.disposed = true
                if (node.tokens) {
                    node.tokens.forEach(function (token) {
                        token.element = null
                      //  token.__disposed__ = true
                    })
                }
                break
            default:
                node.disposed = true
                if (node.children) {
                    disposeVirtual(node.children)
                }
                if (node.vmodel) {
                    node.vmodel.$hashcode = false
                }
                break
        }
    }
    nodes.length = 0
}

module.exports = disposeVirtual