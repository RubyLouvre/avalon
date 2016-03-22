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

        if (vnode.directive === 'for' && vnode.change) {

            if (node.nodeType === 1) {
                var startRepeat = document.createComment(vnode.nodeValue)
                parent.insertBefore(startRepeat, node)
                vnode.endRepeat = document.createComment('ms-for-end:')
                parent.insertBefore(vnode.endRepeat, node.nextSibling)
                node = startRepeat
            } else {//如果是注释节点
                if (!vnode.endRepeat) {
                    vnode.endRepeat = getEndRepeat(node)
                }
            }
            next = vnode.endRepeat.nextSibling
        }

        //ms-repeat,ms-if, ms-widget会返回false
        if (false === execHooks(node, vnode, parent, 'change')) {
            execHooks(node, vnode, parent, 'afterChange')
            continue
        }

        if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
            //处理子节点
            patch(avalon.slice(node.childNodes), vnode.children, node)
        }
        //ms-duplex
        execHooks(node, vnode, parent, 'afterChange')
    }
}
function getEndRepeat(node) {
    var isBreak = 0, ret = [], node
    while (node) {
        if (node.type === '#comment') {
            if (node.nodeValue.indexOf('ms-for:') === 0) {
                isBreak++
            } else if (node.nodeValue.indexOf('ms-for-end:') === 0) {
                isBreak--
            }
        }
        ret.push(node)
        node = node.nextSibling
        if (isBreak === 0) {
            break
        }
    }
    return ret.pop()
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