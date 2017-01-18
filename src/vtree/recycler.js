const nodes = {
    p: [],
    div: [],
    span: [],
    li: [],
    '#text': []
};
var textCache = nodes['#text']
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
    }else if(node.nodeType === 3){
        textCache.push(node)
    }
}

export function handleDispose(a, keep) {
    if (a.dirs) {
        for (let i = 0, el; el = a.dirs[i++];) {
            if (el.beforeDispose) {
                el.beforeDispose()
            }
        }
    }
    keep = keep || (a.props && a.props.cached)
    if (a.dom && !keep) {
        collectNode(a.dom)
        delete a.dom
    }
    var arr = a.children || (Array.isArray(a) && a)
    if (arr) {
        for (let i = 0, el; el = arr[i++];) {
            handleDispose(el, keep)
        }
    }
}
export function createText(text) {
    var node = textCache.pop()
    if(node){
        node.nodeValue = text
        return node
    }
    return document.createTextNode(text)
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