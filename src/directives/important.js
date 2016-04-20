var parseView = require('../strategy/parser/parseView2')

avalon.directive("important", {
    priority: 1,
    parse: function (binding, num, elem) {
        var $id = binding.expr
        var vm = 'vm' + num
        var a = 'var ' + vm + ' =  avalon.vmodels['
                + avalon.quote($id) + ']\n'
        var str = a + '__vmodel__ = ' + vm + ' || __vmodel__\n\n'
        delete elem.props['ms-important']
        num += 1
        var body = parseView([elem], num) + '\n\nreturn vnodes' + num
        var ctrl = avalon.vmodels[$id]
        elem.props['ms-important'] = $id
        ctrl.$render = Function('__vmodel__', str + body)
        return str
    },
    diff: function (cur, pre, steps, name) {
        if (pre.props[name] !== cur.props[name]) {
            cur.props[name] = pre.props[name]
            var list = cur.change || (cur.change = [])
            if (avalon.Array.ensure(list, this.update)) {
                steps.count += 1
            }
        }
    },
    update: function (node, vnode) {
        var id = node.getAttribute('ms-important')
        var vm = avalon.vmodels[id] || {}
        vm.$element = node
    }
})

