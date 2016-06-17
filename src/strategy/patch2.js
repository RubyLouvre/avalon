/**
 * ------------------------------------------------------------
 * patch 对某一个视图根据对应的虚拟DOM树进行全量更新
 * ------------------------------------------------------------
 */
function toDom(a) {
    switch (a.nodeType) {
        case 3:
            return document.createTextNode(a.nodeValue)
        case 8:
            return document.createComment(a.nodeValue)
        default:
            return avalon.vdomAdaptor(a, 'toDOM')
    }
}
function getLength(arr) {
    var len = 0
    for (var i = 0, n = arr.length; i < n; i++) {
        var el = arr[i]
        if (Array.isArray(el)) {
            len += el.length
        } else {
            len += 1
        }
    }
    return len
}
function getEndRepeat(node) {
    var isBreak = 1, ret = [], node
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
    ret.pop()
    return ret
}
function patch(nodes, vnodes, parent, steps) {
    var n = nodes.length;
    var vn = vnodes.length;
    var i = 0, v = 0
    while (i < n || v < vn) {
        var node = nodes[i]
        var vnode = vnodes[v]
        if (!node && vnode) {//如果真实节点不足
            var el = parent.childNodes[i]
            node = toDom(vnode)
            parent.insertBefore(node, el && el.nextSibling || null)
            n++
        }
        if (vnode) {
            //如果类型不一样
            if (node.nodeType !== vnode.nodeType) {
                if (Array.isArray(vnode)) {//如果遇到循环区域
                    var arr = getEndRepeat(node)
                    patch(arr, vnode, parent)
                    var vlen = getLength(vnode)
                    if (arr.length !== vlen) {
                        var detail = Math.abs(arr.length - vlen)
                        if (arr.length > vlen) {
                            n -= detail
                        } else {
                            n += detail
                        }
                    }
                    i += vlen
                    v += 1//跳过数组
                } else {//如果节点类型不一样
                    var newDom = toDom(vnode)
                    parent.replaceChild(newDom, node)
                    if (vnode.diretive === 'for') {
                        parent.insertBefore(
                                document.createComment('ms-for-end:'),
                                newDom.nextSibling)
                        n++
                    }

                }

            } 
            if (node.nodeType === 1) {
                if(node.nodeName.toLowerCase !== vnode.type){
                    var newDom = toDom(vnode)
                    parent.replaceChild(newDom, node)
                    node = newDom
                }
                if (false === execHooks(node, vnode, parent, {}, 'change')) {
                   vnode.afterChange && execHooks(node, vnode, parent, {}, 'afterChange')
                }

                patch(node.childNodes, vnode.children, node, steps)
            } else if (node.nodeType === 3) {
                node.nodeValue = vnode.nodeValue
            } else if (node.nodeType === 8) {
               
                node.nodeValue = vnode.nodeValue
            }
            i++
            v++
        } else if (node && !vnode) {
            parent.removeChild(node)
            n--
        } 
    }
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