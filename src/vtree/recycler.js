const nodes = {};
//回收元素节点
function removeNode(node) {
    var p = node.parentNode
    if (p) {
        p.removeChild(node)
    }
}
export function collectNode(node) {
    removeNode(node)
    if (node.nodeType === 1) {
        var name = node.lowerName || node.nodeName.toLowerCase()
        var list = nodes[name] || (nodes[name] = [])
        list.push(node);
    }
}

//只重复利用元素节点
export function createNode(nodeName, isSvg) {
    var name = nodeName.toLowerCase()
    var node = nodes[name] && nodes[name].pop()
    if (!node) {
        node = isSvg ? document.createElementNS('http://www.w3.org/2000/svg', nodeName) :
            document.createElement(nodeName)
    }
    node.lowerName = name
    node.className = node.style.cssText = ''
    node._ms_duplex_ = node._ms_local_ = node._ms_context_ = void 0
    return node;
}