//更新整个虚拟DOM树
function updateVirtual(nodes, vm) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        switch (node.type) {
            case "#comment":
            case "#component":
                break
            case "#text":
                if (!node.skip) {
                    if (rexpr.test(String(node.nodeValue))) {
                        scanText(node, vm)
                    }
                }
                break
            default:
                if (!node.skip) {
                    scanTag(node, vm, nodes)
                }
                break
        }
    }
    return nodes
}
