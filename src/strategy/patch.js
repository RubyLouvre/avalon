/**
 * ------------------------------------------------------------
 * patch 对某一个视图根据对应的虚拟DOM树进行全量更新
 * ------------------------------------------------------------
 */
var sp = /^\s*$/
function patch(nodes, vnodes, parent, steps) {
    var next = nodes[0]
    if ((!next && !parent) || !steps.count) {
        return
    }
    parent = parent || next.parentNode
    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var vnode = vnodes[i]
        var node = next
        //IE6-8不会生成空白的文本节点，造成虚拟DOM与真实DOM的个数不一致，需要跳过,#1333
        if (avalon.msie < 9 && !vnode.fixIESkip && vnode.nodeType === 3 && sp.test(vnode.nodeValue) ) {
            continue
        }

        if (node) {
            next = node.nextSibling
        }
        if (vnode.directive === 'for') {
            
            if (vnode.forDiff) {
                if (!node) {
                    return
                }
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
                if(node.nodeType !== 8){//fix IE6-8
                    node = node.nextSibling
                }
                next = vnode.endRepeat.nextSibling
            }
        }
        //ms-for, ms-if, ms-widget会返回false
        if (false === execHooks(node, vnode, parent, steps, 'change')) {
            if (vnode.repeatCount) {
                i += vnode.repeatCount + 1 //修正索引值
            }
            execHooks(node, vnode, parent, steps, 'afterChange')
            continue
        }
        if (!vnode.skipContent && vnode.children && node && node.nodeType === 1) {
            //处理子节点
            patch(avalon.slice(node.childNodes), vnode.children, node, steps)
        }
        // ms-if=false内的ms-controller无法正确的关联dom
        var vmID = vnode.props && vnode.props['ms-controller']
        if (vmID && node) {
            var vm = avalon.vmodels[vmID]
            if (vm.$render) vm.$render.dom = node
        }
        //ms-duplex
        execHooks(node, vnode, parent, steps, 'afterChange')
        if (!steps.count)
            break
    }
}

function getEndRepeat(node) {
    var isBreak = 0, ret = [], node
    while (node) {
        if (node.nodeType === 8) {
            if (node.nodeValue.indexOf('ms-for:') === 0) {
                ++isBreak
            } else if (node.nodeValue.indexOf('ms-for-end:') === 0) {
                --isBreak
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