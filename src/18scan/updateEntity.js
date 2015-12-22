//更新真实DOM树

function updateEntity(nodes, vnodes, parent) {
    var node = nodes[0], vnode
    parent = parent || node.parentNode
    label:
            for (var vi = 0, vn = vnodes.length; vi < vn; vi++) {
        vnode = vnodes[vi]

        if (!node) {
            node = vnode.toDOM() //  如果对应的真实DOM还不存在
            parent.appendChild(node)
        } else if (node.type !== getVType(vnode) && vnode.type !== "#component") {
            var tmp = vnode.toDOM()
            parent.replaceChild(tmp, node)
            node = tmp
        }
        var hooks = vnode.updateHooks
        if (hooks) {//这里存在优化级
            for (var k = 0, hook; hook = hooks[k++]; ) {
                var isContinue = hook(node, vnode, parent)
                if (isContinue === false) {
                    node = getNextNode(node, vnode)
                    delete vnode.updateHooks
                    continue label
                }
            }
            delete vnode.updateHooks
        }
        if (!vnode.skipContent && !vnode.skip && vnode.children && node.nodeType === 1) {
            updateEntity(node.childNodes, vnode.children, node)
        }
        node = getNextNode(node, vnode)
    }
    if (node && !vnode) {//如果虚拟节点很少,那么删除后面的
        while (node.nextSibling) {
            parent.removeChild(node.nextSibling)
        }
    }
}

function getNextNode(node, vnode) {
    if (vnode.type === "#component" && vnode.signature) {
        // 如果存在路标
        var end = vnode.signature + ":end", next
        while (next = node.nextSibling) {
            if (next.nodeValue === end) {
                return next.nextSibling
            }
        }
        return next
    } else {
        return node.nextSibling
    }
}

function flattenChildren(target, arr) {
    arr = arr || []
    if (target.type === "#component") {
        for (var i = 0, el; el = target.children[i++]; ) {
            if (el.type !== "#component") {
                pushArray(arr, [el])
            } else {
                flattenChildren(el, arr)
            }
        }
        return arr
    } else {
        return pushArray(arr, [target])
    }
}

function getVType(node) {
    switch (node.type) {
        case "#text":
            return 3
        case "#comment":
            return 8
        case "#component":
            return -1
        default:
            return 1
    }
}

