import { avalon, config } from '../seed/core'


export function optimize(node) {
    markStatic(node);
    // second pass: mark static roots.
    isStaticRoot(node, false);
    return node
}

function markStatic(node) {
    node.static = isStatic(node);
    if (node.vtype === 1 && !node.isVoidTag) {
        // do not make component slot content static. this avoids
        // 1. components not able to mutate slot nodes
        // 2. static slot content fails for hot-reloading
        if (node.nodeName === 'slot') {
            node.static = false
            return
        }
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
    return !node.dynamic
}