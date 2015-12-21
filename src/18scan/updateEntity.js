//更新真实DOM树
function updateEntity(nodes, vnodes) {
    for (var i = 0, n = nodes.length; i < n; i++) {
        var vnode = vnodes[i]
        if (!vnode)
            break
        var node = nodes[i]
        switch (vnode.type) {
            case "#text":
                if (!vnode.skip) {
                    if (vnode.change) {
                        node.nodeValue = vnode.nodeValue
                        delete vnode.change
                    }
                }
                break
            case "#component":
                var hooks = vnode.changeHooks
                //一个LI元素 遇上repeat组件
                if (hooks) {
                    try {
                        for (var hook in hooks) {
                            hooks[hook](node, vnode)
                        }
                    } catch (e) {
                        avalon.log(e, node, vnode)
                    }
                    delete vnode.changeHooks
                }
                updateEntity(node.childNodes, vnode.children)
                break
            case "#comment":
                break
            default:
                if (!vnode.skip) {
                    hooks = vnode.changeHooks
                    try {
                        for (hook in hooks) {
                            hooks[hook](node, vnode)
                        }
                    } catch (e) {
                    }
                    delete vnode.changeHooks
                    if (!vnode.skipContent) {
                        updateEntity(node.childNodes, vnode.children)
                    }
                }
                break
        }
    }
}
