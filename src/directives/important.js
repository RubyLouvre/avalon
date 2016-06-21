// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (cur, pre, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)

        pre.$id = $id
        pre.$prepend = ['(function(__vmodel__){',
            'var important = avalon.scopes[' + quoted + ']',
            'if(important && important.fast){avalon.log("不进入"+' + quoted + ');return }',
            'var __top__ = __vmodel__',
            'var __vmodel__ =  avalon.vmodels[' + quoted + ']',

            '/*controller:' + $id + '*/',
        ].join('\n') + '\n\n'
        cur.local = '{}'
        cur.top = '__top__'
        cur.vmodel = '__vmodel__'
        pre.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (cur, pre) {
        if (pre.vmodel !== cur.vmodel) {
            //console.log('ms-important')
            pre.local = cur.local
            pre.top = cur.top
            pre.synth =  pre.vmodel = cur.vmodel
            update(pre, this.update)
        }
    },
    update: function (node, vnode, parent) {
        avalon.directives.controller.update(node, vnode, parent, 'important')
    }
})
