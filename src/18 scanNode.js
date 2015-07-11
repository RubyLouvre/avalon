//function scanNodeList(parent, vmodels) {
//    var node = parent.firstChild
//    while (node) {
//        var nextNode = node.nextSibling
//        scanNode(node, node.nodeType, vmodels)
//        node = nextNode
//    }
//}
function scanNodeList(parent, vmodels) {
    var nodes = avalon.slice(parent.childNodes)
    scanNodeArray(nodes, vmodels)
}

function scanNodeArray(nodes, vmodels) {
    for (var i = 0, node; node = nodes[i++]; ) {
        scanNode(node, node.nodeType, vmodels)
    }
}
function scanNode(node, nodeType, vmodels) {
    if (nodeType === 1) {
        scanTag(node, vmodels) //扫描元素节点
        if( node.msCallback){
            node.msCallback()
            node.msCallback = void 0
       }
    } else if (nodeType === 3 && rexpr.test(node.data)){
        scanText(node, vmodels) //扫描文本节点
    }
//    } else if (kernel.commentInterpolate && nodeType === 8 && !rexpr.test(node.nodeValue)) {
//        scanText(node, vmodels) //扫描注释节点
//    }
}