
avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre, steps) {
        if (cur.nodeValue !== pre.nodeValue) {
            var list = cur.change || (cur.change = [])
            if (avalon.Array.ensure(list, this.update)) {
                steps.count += 1
            }
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