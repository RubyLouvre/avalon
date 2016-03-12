var Cache = require('../shim/cache')

var textCache = new Cache(512)
var rexpr = avalon.config.rexpr
avalon.directive('html', {
    parse: function (binding, num) {
        return 'vnode' + num + '.htmlVm = __vmodel__\n' +
                'vnode' + num + '.props.wid = 2;\n' +
                'vnode' + num + '.props["av-html"] =' + avalon.parseExpr(binding.expr) + ';\n'
    },
    diff: function (cur, pre) {
        var curValue = cur.props['av-html']
        var preValue = pre.props['av-html']
        if (curValue !== preValue) {
            var nodes = textCache.get(curValue)
            if (!Array.isArray(nodes)) {
                var child = avalon.createVirtual(curValue)
                var render = avalon.createRender(child)
                nodes = render(cur.htmlVm)
                cur.props['av-html'] = nodes.map(function (el) {
                    return 'template' in el ? el.template : el.nodeValue
                })
                textCache.put(curValue, nodes)
            }
            cur.children = nodes
            if (cur.props['av-html'] !== preValue) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        }
    },
    update: function (node, vnode) {
        var nodes = node.querySelectorAll('[avalon-events]')
        avalon.each(nodes, function (el) {
            avalon.unbind(el)
        })
        //添加节点
        node.innerHTML = vnode.children.map(function (c) {
            return avalon.vdomAdaptor(c).toHTML()
        }).join('')

    }
})