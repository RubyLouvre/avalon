var parseView = require('../strategy/parser/parseView')
var update = require('./_update')
var caches = {}
avalon.directive('important', {
    priority: 1,
    parse: function (cur, pre, binding) {

        var $id = binding.expr
        var quoted = avalon.quote($id)
        var name = binding.name
        delete pre.props[name]
        //cur[name] = quoted
        var inner = parseView([pre])
        inner = inner.replace(/return\s+vnodes\s*$/, function (a) {
            return  '\nvar fix = vnodes[vnodes.length-1];\n' +
                    'fix["ms-important"] = ' + quoted + ';\n' +
                    'fix.order = "ms-important;;"+(fix.order||"")\n\n' + a
        })
        var str = ['\n/*----ms-important----*/',
            'vnodes = vnodes.concat((function(){',
            'var __vmodel__ = avalon.vmodels[' + quoted + '];',
            'if(__vmodel__){',
            inner,
            '}else{',
            '\treturn {nodeType:8,type:"#comment",nodeValue:"vm ' + $id + ' inexistence"}',
            '}',
            '})())',
            '/*----ms-important----*/\n'
        ].join('\n ')
        pre.$prepend = str
        caches[$id] = str
    },
    diff: function (cur, pre, steps, name) {
        if (pre[name] !== cur[name]) {
            update(cur, this.update, steps, 'important')
        }
    },
    update: function (node, vnode) {
        var $id = vnode['ms-important']
        var body = caches[$id]
        var vm = avalon.vmodels[$id]
        if (vm) {
            var render = Function('__vmodel__', '__fast__',
                    'var nodes = [];\n' + body + '\nreturn nodes;')
            vm.$render = render
            vm.$element = node
        }
    }
})
