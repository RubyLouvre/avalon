
avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre) {//curNode, preNode
        cur.fixIESkip = true
        if (cur.nodeValue !== pre.nodeValue) {
            if (pre.dom) {
                cur.dom = pre.dom
                cur.dom.nodeValue = cur.nodeValue
            } else {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
    },
    update: function (node, vnode, parent) {

        if (node.nodeType !== 3) {
            var textNode = document.createTextNode(vnode.nodeValue)
            parent.replaceChild(textNode, node)
        } else {
            node.nodeValue = vnode.nodeValue
            textNode = node
        }
        vnode.dom = textNode
    }
})