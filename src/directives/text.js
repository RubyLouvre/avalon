var rident = require('../seed/regexp').ident
var update = require('./_update')

avalon.directive('text', {
    parse: function (copy, src, binding) {
        src.children = [{nodeType:3,type:"#text",dynamic: true, nodeValue:"dynamic"}]
        copy.children = '[{nodeType:3,type:"#text", nodeValue:"dynamic"}]'
        var val = rident.test(binding.expr) ? binding.expr : avalon.parseExpr(binding)
        copy[binding.name] = val
    },
    diff: function (copy, src, name) {
        var copyValue = copy[name]+''
        if (copyValue !== src[name] ) {
            src[name] = copy.children[0].nodeValue = copyValue
            update(src, this.update)
        }
    },
    update: function (dom, vdom) {
        dom.innerText = dom.textContent = vdom['ms-text']
    }
})