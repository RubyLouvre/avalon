function scanNodeList(parent, vmodels) {
    var node = parent.firstChild
    while (node) {
        var nextNode = node.nextSibling
        scanNode(node, node.nodeType, vmodels)
        node = nextNode
    }
}

function scanNodeArray(nodes, vmodels) {
    for (var i = 0, node; node = nodes[i++]; ) {
        scanNode(node, node.nodeType, vmodels)
    }
}
function scanNode(node, nodeType, vmodels) {
    if (nodeType === 1) {
        scanTag(node, vmodels) //扫描元素节点
        if(node.tagName === "SELECT" && node.duplexCallback){
            node.duplexCallback()
        }
    } else if (nodeType === 3 && rexpr.test(node.data)){
        scanText(node, vmodels) //扫描文本节点
    } else if (kernel.commentInterpolate && nodeType === 8 && !rexpr.test(node.nodeValue)) {
        scanText(node, vmodels) //扫描注释节点
    }
}