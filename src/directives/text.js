var Cache = require('../seed/cache')
var textCache = new Cache(256)
var rexpr = avalon.config.rexpr

avalon.directive('text', {
    parse: function (binding, num, vnode) {
        vnode.children = [{type: '#text', nodeValue: ''}]
        return 'vnode' + num + '.props["a-text"] =' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var curValue = cur.props['a-text']
        var preValue = pre.props['a-text']
        cur.children = pre.children
        cur.skipContent = true
        if (curValue !== preValue) {
            cur.children[0].nodeValue = curValue
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
        return false
    },
    update: function (node, vnode) {
        var nodeValue = vnode.props['a-text']
        if ('textContent' in node) {
            node.textContent = nodeValue + ''
        } else {
            node.innerText = nodeValue + ''
        }
    }
})