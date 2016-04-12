/**
 * ------------------------------------------------------------
 * patch 对某一个视图根据对应的虚拟DOM树进行全量更新
 * ------------------------------------------------------------
 */
var sp = /^\s*$/
function patch(nodes, vnodes, parent, steps) {
    var next = nodes[0]
    if ((!next && !parent) || !steps.count ){
        return
    }
    parent = parent || next.parentNode
    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var vnode = vnodes[i]
        //IE6-8不会生成空白的文本节点，造成虚拟DOM与真实DOM的个数不一致，需要跳过
        if(avalon.msie < 9 && vnode.type === '#text' && !sp.fixIESkip && sp.test(vnode.nodeValue) ){
            continue
        }
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
        if (false === execHooks(node, vnode, parent, steps, 'change')) {
            if(vnode.repeatCount){
                i += vnode.repeatCount + 1 //修正索引值
            }
            execHooks(node, vnode, parent, steps, 'afterChange')
            continue
        }
        if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
            //处理子节点
            patch(avalon.slice(node.childNodes), vnode.children, node, steps)
        }
        //ms-duplex
        execHooks(node, vnode, parent, steps, 'afterChange')
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

function execHooks(node, vnode, parent, steps, hookName) {
    var hooks = vnode[hookName]
    if (hooks) {
        for (var hook; hook = hooks.shift(); ) {
            steps.count -= 1
            if (false === hook(node, vnode, parent)) {
                return false
            }
        }
        delete vnode[hookName]
    }
}

module.exports = patch