
avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre) {
        if (cur.nodeValue !== pre.nodeValue) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node, vnode, parent) {
        if (node.nodeType !== 3) {
            var textNode = document.createTextNode(vnode.nodeValue)
            parent.replaceChild(textNode, node)
        } else {
            node.nodeValue = vnode.nodeValue
        }
    }
})