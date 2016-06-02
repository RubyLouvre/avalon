var parseView = require('../strategy/parser/parseView')
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (cur, pre, binding) {
        delete pre.props['ms-important']
        var noQuote = binding.expr
        var quoted = avalon.quote(noQuote)

        var str = ['\n/*----ms-important----*/',
            'vnodes = vnodes.concat((function(){',
            'var __vmodel__ = avalon.vmodels[' + quoted + '];',
            'if(__vmodel__){',
            parseView([pre]),
            '}else{',
            '\treturn {nodeType:8,type:"#comment",nodeValue:"vm ' + noQuote + ' inexistence"}',
            '}',
            '})())',
            '/*----ms-important----*/\n'
        ].join('\n ')

        pre.$append = str 

    },
    diff: function (cur, pre, steps, name) {
        if (pre.props[name] !== cur.props[name]) {
            update(cur, this.update, steps, 'important')
        }
    },
    update: function (node, vnode) {
        var vid = vnode.props['ms-important']
        var vm = avalon.vmodels[vid]
        vm.$render = vnode.render
        vm.$element = node
    }
})
