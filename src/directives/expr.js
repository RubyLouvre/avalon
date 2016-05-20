var update = require('./_update')

avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre, steps) {
        cur.fixIESkip = !avalon.modern
        var dom = cur.dom = pre.dom
        if (cur.nodeValue !== pre.nodeValue) {
            if (dom && avalon.contains(avalon.root,dom)) {
                this.update(dom, cur)
            } else {
                update(cur, this.update, steps, 'expr' )
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
        vnode.dom = textNode
    }
})