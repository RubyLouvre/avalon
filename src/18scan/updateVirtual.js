//更新整个虚拟DOM树
function updateVirtual(nodes, vm) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        switch (node.type) {
            case "#comment":
                break
            case "#text":
                if (!node.skip) {
                    if (rexpr.test(String(node.nodeValue))) {
                        var arr = scanText(node, vm)
                        if (arr.length > 1) {
                            nodes.splice.apply(nodes, [i, 1].concat(arr))
                            i = i + arr.length
                        }
                    }
                }
                break
            case "#component":
                node.init(vm)
                break
            default:
                if (!node.skip) {
                    nodes[i] = scanTag(node, vm)
                }
                break
        }
    }
    return nodes
}
