
avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre) {//curNode, preNode
        cur.fixIESkip = true
        cur.dom = pre.dom
        if (cur.nodeValue !== pre.nodeValue) {
            if (pre.dom) {
                cur.dom = pre.dom
                cur.dom.nodeValue = cur.nodeValue
            } else {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
        pre.dom = null
    },
    update: function (node, vnode, parent) {
        if (node.nodeType !== 3) {
            var textNode = document.createTextNode(vnode.nodeValue)
            parent.replaceChild(textNode, node)
        } else {
            node.nodeValue = vnode.nodeValue
            textNode = node
        }
        if(avalon.contains(avalon.root, textNode)){
           vnode.dom = textNode
        }
    }
})