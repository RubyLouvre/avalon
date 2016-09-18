// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (copy, src, binding) {
        var quoted = avalon.quote(binding.expr)
        copy.local = '{}'
        copy.vmodel = '__vmodel__'
        copy[binding.name] = 1
        //如果important没有定义可以进入
        //如果important定义了,并且__vmodel__== important也可以进入
        var vmodel = '(function(){ return __vmodel__ = avalon.vmodels[' + quoted + ']})()'
        src.$prepend = ['(function(__vmodel__){',
            'var __i = avalon.scopes[' + quoted + ']',
            'var ok = !__i || __i.vmodel === __vmodel__',
            'if( !ok ){avalon.log("不进入"+' + quoted + ');return }',
        ].join('\n') + '\n' + vmodel
        src.$append = '\n})(__vmodel__);'
    },
    diff: function (copy, src, name) {
        if (!src.dynamic[name]) {
            src.local = copy.local
            src.vmodel = copy.vmodel
            update(src, this.update)
        }
    },
    update: function (dom, vdom, parent) {
        avalon.directives.controller.update(dom, vdom, parent, 'important')
    }
})
