//更新真实DOM树
function getNextNode(node, vnode, a) {
    if (vnode.type === "#component" && vnode.signature) {
        // 如果存在路标
        var end = vnode.signature + ":end"
        var next = node.nextSibling
        while (next) {
            if (next.nodeValue === end) {
                return next.nextSibling
            }
            next = next.nextSibling
        }
        return next
    } else {
        return a
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

function updateEntity(nodes, vnodes, parent) {
    var node = nodes[0], vnode
    if (!node && !parent)
        return
    parent = parent || node.parentNode
    label:
            for (var vi = 0, vn = vnodes.length; vi < vn; vi++) {
        vnode = vnodes[vi]
        var nextNode = nodes[vi + 1]
        if (!node) {
            var a = vnode.toDOM()
            if (a.nodeType === 11) {
                var as = avalon.slice(a.childNodes)
                parent.appendChild(a)
                updateEntity(as, vnode.children, parent)
                node = null
                continue label
            } else {
                parent.appendChild(a)
                node = a
            }
        } else if (node.nodeType !== getVType(vnode)) {
            //如果它碰到的是组件,交由组件的updateHooks处理
            if (vnode.type !== "#component") {
                var b = vnode.toDOM()
                parent.replaceChild(b, node)
                node = b
            }
        }
        var hooks = vnode.updateHooks
        if (hooks) {//这里存在优化级
            for (var k = 0, hook; hook = hooks[k++]; ) {

                var isContinue = hook(node, vnode, parent)
                if (isContinue === false) {
                    node = getNextNode(node, vnode, nextNode)
                    delete vnode.updateHooks
                    continue label
                }
            }
            delete vnode.updateHooks
        }

        if (!vnode.skipContent && !vnode.skip && vnode.children && node.nodeType === 1) {
            updateEntity(node.childNodes, vnode.children, node)
        }
        if (vnode.setter) {
            avalon.fireDom(node, "datasetchanged", {
                bubble: "selectDuplex"
            })
            delete vnode.setter
        }
        node = getNextNode(node, vnode, nextNode)
    }
    if (node && !vnode) {//如果虚拟节点很少,那么删除后面的
        while (node.nextSibling) {
            parent.removeChild(node.nextSibling)
        }
    }
}