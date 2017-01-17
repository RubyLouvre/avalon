import { avalon, config } from '../seed/core'


export function optimize(node) {
    markStatic(node)
    markStaticID(node)
    return node
}
/**
 * 为这个节点及它下面所有节点添加static属性
 */
function markStatic(node) {
    node.static = isStatic(node);
    if (node.props && !node.vtype) {

        if (node.props['ms-skip'] || node.props[':skip']) {
            delete node.static
            return
        }
        var ret = true
        for (var i = 0, l = node.children.length; i < l; i++) {
            var child = node.children[i]
            
            ret = ret & markStatic(child)
        }
        if (!ret) {
            delete node.static
        }
    }
}
avalon.staticNodes = {}
/**
 * 为局部元素添加staticID,我们可以通过它，在avalon.staticNodes中找到它们，并进行重复利用
 */
function markStaticID(node) {
    var ret = true
    var children = node.children
    if (children) {
        for (let i = 0, l = children.length; i < l; i++) {
            let child = children[i];
            ret = ret & markStaticID(child);
        }
        if (ret && node.static) {
            var id = node.staticID = Math.random()
            var old = avalon.staticNodes[id]
            if (old === node) {
                id = node.staticID = Math.random()
                old = avalon.staticNodes[id]
                if (old === node) {
                    id = node.staticID = Math.random()
                }
                avalon.staticNodes[id] = node
            }
        }
    }
    return ret
}

function isStatic(node) {
    return !node.dynamic && node.nodeName !== 'slot'
}