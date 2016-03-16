/**
 * ------------------------------------------------------------
 * patch 对某一个视图根据对应的虚拟DOM树进行全量更新
 * ------------------------------------------------------------
 */

function patch(nodes, vnodes, parent) {
    var next = nodes[0]
    if (!next && !parent)
        return
    parent = parent || next.parentNode
    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var vnode = vnodes[i]
        var node = next
        if (node)
            next = node.nextSibling

        if (vnode.directive === "for" && vnode.change) {
            if (node.nodeType === 1) {
                var startRepeat = document.createComment(vnode.nodeValue)
                parent.insertBefore(startRepeat, node)
                parent.insertBefore(document.createComment("a-for-end:"), node.nextSibling)
                node = startRepeat
            }
            var repeatNodes = [node], cur = node
            innerLoop:
                    while (cur && (cur = cur.nextSibling)) {
                repeatNodes.push(cur)
                if ((cur.nodeValue || "").indexOf("a-for-end:") === 0) {
                    next = cur.nextSibling
                    break innerLoop
                }
            }
            vnode.repeatNodes = repeatNodes
        }

        //ms-repeat,ms-if, ms-widget会返回false
        if (false === execHooks(node, vnode, parent, "change")) {
            execHooks(node, vnode, parent, "afterChange")
            continue
        }

        if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
            //处理子节点
            patch(avalon.slice(node.childNodes), vnode.children, node)
        }
        //ms-duplex
        execHooks(node, vnode, parent, "afterChange")
    }
}

function execHooks(node, vnode, parent, hookName) {
    var hooks = vnode[hookName]
    if (hooks) {
        for (var hook; hook = hooks.shift(); ) {
            if (false === hook(node, vnode, parent)) {
                return false
            }
        }
        delete vnode[hookName]
    }
}

module.exports = patch