
/**
 * 更新真实DOM树
 * @param {DOM} nodes 一个节点集合
 * @param {VDOM} vnodes 一个虚拟节点数组
 * @param {DOM} parent
 * @returns {undefined}
 */

function updateEntity(nodes, vnodes, parent) {
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
            var repeatNodes = [node], cur = node
            innerLoop:
                    while (cur && (cur = cur.nextSibling)) {
                repeatNodes.push(cur)
                if ((cur.nodeValue || "").indexOf("av-for-end:") === 0) {
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
            updateEntity(avalon.slice(node.childNodes), vnode.children, node)
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


module.exports = updateEntity

// ms-if 没有路标, 组件
// ms-include 没有路标, 非组件
// ms-repeat 一开始添加路标,组件
// ms-each 一开始添加路标, 组件
// ms-html 没有路标,非组件
// ms-text 没有路标,非组件
