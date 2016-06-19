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
// 3 3 1 8 3
// 1 8


function patch(nodes, vnodes, parent, steps) {

    var n = nodes.length;
    var vn = vnodes.length;
    var i = 0, v = 0
    while (i < n || v < vn) {
        var node = nodes[i]
        var vnode = vnodes[v]
        if (!node && vnode) {//ms-html会导政节点差异
            var el = parent.childNodes[i]
            node = toDom(vnode)
           
            parent.insertBefore(node, el && el.nextSibling || null)

            n++
        }
        if (vnode) {
            //如果类型不一样{nodeName不一样,nodeType肯定不一定}
            if (node.nodeName.toLowerCase() !== vnode.type) {
                //console.log(node.nodeName)
                if (Array.isArray(vnode)) {//如果遇到循环区域
                    var curRepeat = vnode
                    var oldCount = steps.count
                    var entity = vnode.entity
                    avalon.diff(curRepeat, curRepeat.prevItems , steps)
                    curRepeat.prevItems = 0
                    if (steps.count !== oldCount) {
                        console.log('开始处理循环区域')
                        
                        patch(entity, curRepeat, parent, steps)
                        console.log('结束处理循环区域')
                    }
                    var vlen = getLength(curRepeat)
                    console.log(vlen, entity.length)
                    if (entity.length !== vlen) {
                        var detail = Math.abs(entity.length - vlen)
                        if (entity.length > vlen) {
                            n -= detail
                        } else {
                            n += detail
                        }
                    }
                    // n += vlen //真实节点长度添加
                    i += vlen
                    v += 1//跳过数组
                    console.log("xxxxxx")
                    continue
                } else {//如果节点类型不一样
                    if (!vnode.notAdd) {
                        var newDom = toDom(vnode)
                        parent.replaceChild(newDom, node)
                        node = newDom

                    }

                }

            }


            if (node.nodeType === 1) {
                console.log(node,vnode)
                if (false === execHooks(node, vnode, parent, steps, 'change')) {
                    vnode.afterChange && execHooks(node, vnode, parent, {}, 'afterChange')
                }
                if (!vnode.skipContent && !vnode.isVoidTag) {
                    
                    patch(node.childNodes, vnode.children, node, steps)
                   
                }
                vnode.afterChange && execHooks(node, vnode, parent, steps, 'afterChange')
            } else if (node.nodeType === 3) {
                if (vnode.changeText) {
                    node.nodeValue = vnode.nodeValue
                }
            } else if (node.nodeType === 8) {
                var list1 = vnode.items
                if(list1){
                    var list2 = list1.prevItems
                    n += (list1.length - list2.length)
                }
                execHooks(node, vnode, parent, steps, 'change')
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