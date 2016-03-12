
avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre) {//curNode, preNode
        if (cur.nodeValue !== pre.nodeValue) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node, vnode, parent) {
        if (node.nodeType !== 3) {
            parent.replaceChild(vnode.toDOM(), node)
        } else {
            node.nodeValue = vnode.nodeValue
        }
    }
})