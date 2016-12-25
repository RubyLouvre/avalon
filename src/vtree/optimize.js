import { avalon, config } from '../seed/core'


export function optimize(node) {
    markStatic(node);
    isStaticRoot(node, false);
    return node
}

function markStatic(node) {
    node.static = isStatic(node);
    if (node.props && !node.vtype) {
       
        if (node.props['ms-skip'] || node.props[':skip']) {
            node.static = false
            return
        }

        for (var i = 0, l = node.children.length; i < l; i++) {
            var child = node.children[i];
            markStatic(child);
            if (!child.static) {
                node.static = false;
            }
        }
    }
}

function isStaticRoot(node) {
    var ret = true
    if (node.children) {
        node.children.forEach(function(el) {
            ret = ret & isStaticRoot(el)
        })
        if (ret && node.static) {
            node.staticRoot = true
        }
    }


    return ret
}

function isStatic(node) {
    return !node.dynamic && node.nodeName !== 'slot'
}