//销毁虚拟DOM树，方便avalon在$emit方法中回收它们
function disposeVirtual(nodes) {
    for (var i = 0, node; node = nodes[i++]; ) {
        switch (node.type) {
            case "#text":
            case "#comment":
                node.disposed = true
                if(node.tokens){
                    node.tokens.forEach(function(token){
                        delete token.element
                    })
                }
                break
            default:
                node.disposed = true
                if (node.children)
                    disposeVirtual(node.children)
                if (node._children)
                    disposeVirtual(node._children)
                break
        }
    }
}
