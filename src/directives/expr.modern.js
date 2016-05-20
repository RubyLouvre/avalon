var update = require('./_update')

avalon.directive('expr', {
    parse: function () {
    },
    diff: function (cur, pre, steps) {
        if (cur.nodeValue !== pre.nodeValue) {
            update(cur, this.update, steps, 'expr' )
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