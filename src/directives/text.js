var Cache = require('../seed/cache')
var textCache = new Cache(256)
var rexpr = avalon.config.rexpr

avalon.directive('text', {
    parse: function (binding, num) {
        return 'vnode' + num + '.textVm = __vmodel__\n' +
                'vnode' + num + '.props.wid = 2;\n' +
                'vnode' + num + '.props["a-text"] =' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var curValue = cur.props['a-text']
        var preValue = pre.props['a-text']
        if (curValue !== preValue) {
            var nodes = textCache.get(curValue)
            if (!Array.isArray(nodes)) {
                var hasExpr = rexpr.test(curValue)
                if (hasExpr) {
                    var child = [{type: '#text', nodeValue: curValue}]
                    var render = avalon.render(child)
                    nodes = render(cur.textVm)
                    cur.props['a-text'] = nodes[0].nodeValue
                    textCache.put(curValue, nodes)
                } else {
                    nodes = [{type: '#text', nodeValue: curValue}]
                }
            }
            cur.children = nodes
            if (cur.props['a-text'] !== preValue) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
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