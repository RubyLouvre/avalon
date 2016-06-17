var rident = require('../seed/regexp').ident
var update = require('./_update')

avalon.directive('text', {
    parse: function (cur, pre, binding) {
        cur.children = '[{nodeType:3,type:"#text",nodeValue:""}]'
        cur.skipContent = true
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        cur[binding.name] = val
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur[name]
        var preValue = pre[name]
        if (curValue !== preValue ) {
            var text = cur.children[0]
            text.nodeValue = curValue
            text.changeText = true
            update(cur, this.update, steps, 'text')
        }
        return false
    },
    update: function () {}
})