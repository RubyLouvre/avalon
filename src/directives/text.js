var rident = require('../seed/regexp').ident
avalon.directive('text', {
    parse: function (binding, num, vnode) {
        vnode.children = [{type: '#text', nodeType: 3, nodeValue: ''}]
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        return 'vnode' + num + '.props["ms-text"] =' + val + '\n'
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur.props[name]
        var preValue = pre.props[name]
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
                steps.count += 1
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