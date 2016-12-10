function toTemplate(nodes) {

}

function genChildren(el) {
    if (el.children.length) {
        return '[' + el.children.map(genNode).join(',') + ']'
    }
}

function genNode(node) {
    if (node.type === 1) {
        return genElement(node)
    } else {
        return genText(node)
    }
}