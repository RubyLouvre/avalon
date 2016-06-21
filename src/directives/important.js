// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (copy, src, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)

        src.$id = $id
        src.$prepend = ['(function(__vmodel__){',
            'var important = avalon.scopes[' + quoted + ']',
            'if(important && important.fast){avalon.log("不进入"+' + quoted + ');return }',
            'var __top__ = __vmodel__',
            'var __vmodel__ =  avalon.vmodels[' + quoted + ']',

            '/*controller:' + $id + '*/',
        ].join('\n') + '\n\n'
        copy.local = '{}'
        copy.top = '__top__'
        copy.vmodel = '__vmodel__'
        src.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (copy, src) {
        if (src.vmodel !== copy.vmodel) {
            //console.log('ms-important')
            src.local = copy.local
            src.top = copy.top
            src.synth =  src.vmodel = copy.vmodel
            update(src, this.update)
        }
    },
    update: function (node, vnode, parent) {
        avalon.directives.controller.update(node, vnode, parent, 'important')
    }
})
