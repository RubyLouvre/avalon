var rident = require('../seed/regexp').ident
var update = require('./_update')

avalon.directive('text', {
    parse: function (cur, pre, binding) {
        cur.children = '[]'
        cur.skipContent = true
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        cur[binding.name] = val
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur[name]
        var preValue = pre[name]
        cur.children = pre.children
        var dom = cur.dom = pre.dom

        if (curValue !== preValue || cur.children.length === 0) {
            if (!cur.children[0])
                cur.children[0] = {type: "#text", nodeType: 3}
            cur.children[0].nodeValue = curValue
            if (dom) {
                this.update(dom, cur)
            } else {
                update(cur, this.update, steps, 'text')
            }
        }
        pre.dom = null
        return false
    },
    update: function (node, vnode) {
        var nodeValue = vnode['ms-text']
        if ('textContent' in node) {
            node.textContent = nodeValue + ''
        } else {
            node.innerText = nodeValue + ''
        }
        vnode.dom = node
    }
})