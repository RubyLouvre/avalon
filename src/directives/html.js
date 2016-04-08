var Cache = require('../seed/cache')
var textCache = new Cache(128)
avalon.textCache = textCache
avalon.directive('html', {
    parse: function (binding, num) {
        return 'vnode' + num + '.htmlVm = __vmodel__\n' +
                'vnode' + num + '.skipContent = true\n' +
                'vnode' + num + '.props["ms-html"] =' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur.props[name]
        var preValue = pre.props[name]
        cur.skipContent = false
        if (curValue !== preValue) {
            var nodes = textCache.get(curValue)
            if (!Array.isArray(nodes)) {
                var child = avalon.lexer(curValue)
                var render = avalon.render(child)
                nodes = render(cur.htmlVm)
                curValue = cur.props[name] = nodes.map(function (el) {
                    return 'template' in el ? el.template : el.nodeValue
                }).join('-')
                textCache.put(curValue, nodes)
            }
            cur.children = nodes
            if (cur.props[name] !== preValue) {
                var list = cur.change || (cur.change = [])
                if(avalon.Array.ensure(list, this.update)){
                   steps.count += 1
                }
            }
        }
    },
    update: function (node, vnode) {
        if(node.nodeType !== 1){
            return
        }
        if (node.querySelectorAll) {
            var nodes = node.querySelectorAll('[avalon-events]')
            avalon.each(nodes, function (el) {
                avalon.unbind(el)
            })
        } else {
            var nodes = node.getElementsByTagName('*')
            //IE6-7这样取所有子孙节点会混入注释节点
            avalon.each(nodes, function (el) {
                if (el.nodeType === 1 && el.getAttribute('avalon-events')) {
                    avalon.unbind(el)
                }
            })
        }
        //添加节点
        avalon.clearHTML(node)
        var fragment = document.createDocumentFragment()
        vnode.children.forEach(function (c) {
            fragment.appendChild(avalon.vdomAdaptor(c, 'toDOM'))
        })
        node.appendChild(fragment)
    }
})