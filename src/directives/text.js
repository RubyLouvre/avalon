var rident = require('../seed/regexp').ident
var update = require('./_update')

avalon.directive('text', {
    parse: function (cur, pre, binding) {
        pre.children = [{nodeType:3,type:"#text",dynamic: true, nodeValue:"dynamic"}]
        cur.children = '[{nodeType:3,type:"#text",nodeValue:""}]'
        cur.skipContent = true
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        cur[binding.name] = val
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur[name]+''
        if (curValue !== pre[name] ) {
            pre[name] = curValue
            var child = pre.children[0]
            child.nodeValue = curValue
            update(child, this.update, steps, 'text')
        }
    },
    update: function (dom, vdom) {
        dom.nodeValue = vdom.nodeValue
    }
})