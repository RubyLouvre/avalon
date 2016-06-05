// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (cur, pre, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)
        var name = binding.name
        cur[name] = quoted

        pre.$prepend = ['(function(__vmodel__){',
            'var important = avalon.scopes[' + quoted + ']',
            'if(important && important.fast){avalon.log("不进入"+'+quoted+');return }',
            'var __top__ = __vmodel__',
            'var __synth__ =  avalon.vmodels[' + quoted + ']',
            'var __present__ = __synth__',
            'var __vmodel__ = __synth__',
            '/*controller:' + $id + '*/', 
        ].join('\n') + '\n\n'
        cur.synth = '__synth__'
        cur.local = '{}'
        cur.top = '__top__'
        cur.present = '__present__'
                
        pre.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (cur, pre, steps, name) {
        if (pre[name] !== cur[name]) {
            update(cur, this.update, steps, 'controller')
        }
    },
    update: function (node, vnode,parent) {
       avalon.directives.controller.update(node, vnode, parent, 'important')
    }
})
