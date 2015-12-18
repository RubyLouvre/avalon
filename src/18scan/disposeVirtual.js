//销毁虚拟DOM树，方便avalon在$emit方法中回收它们
function disposeVirtual(nodes) {
    for (var i = 0, node; node = nodes[i++]; ) {
        switch (node.type) {
            case "#text":
            case "#comment":
                node.disposed = true
                break
            default:
                node.disposed = true
                if (node.children)
                    disposeNodes(node.children)
                if (node._children)
                    disposeNodes(node._children)
                break
        }
    }
}
