var rident = require('../seed/regexp').ident
avalon.directive('text', {
    parse: function (binding, num, vnode) {
        vnode.children = [{type: '#text', nodeType: 3, nodeValue: ''}]
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        return 'vnode' + num + '.props["ms-text"] =' + val + '\n'
    },
    diff: function (cur, pre) {
        var curValue = cur.props['ms-text']
        var preValue = pre.props['ms-text']
        cur.children = pre.children
        cur.skipContent = true
        var dom = cur.dom = pre.dom
        if (curValue !== preValue) {
            cur.children[0].nodeValue = curValue
            if (dom) {
                this.update(dom, cur)
            } else {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
        pre.dom = null
        return false
    },
    update: function (node, vnode) {
        var nodeValue = vnode.props['ms-text']
        if ('textContent' in node) {
            node.textContent = nodeValue + ''
        } else {
            node.innerText = nodeValue + ''
        }
        vnode.dom = node
    }
})