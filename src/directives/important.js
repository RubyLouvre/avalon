// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (copy, src, binding) {
        var quoted = avalon.quote(binding.expr)
        copy[binding.name] = quoted
        copy.local = '{}'
        copy.vmodel = '(function(){ return __vmodel__ = avalon.vmodels[' + quoted + ']})()'
        src.$prepend = ['(function(__vmodel__){',
            'var important = avalon.scopes[' + quoted + ']',
            'if(important){avalon.log("不进入"+' + quoted + ');return }',
        ].join('\n') + '\n'
        src.$append = '\n})();'
    },
    diff: function (copy, src, name) {
        if (src.vmodel !== copy.vmodel) {
            src['ms-controller'] = copy[name]
            src.local = copy.local
            src.vmodel = copy.vmodel
            update(src, this.update)
        }
    },
    update: function (dom, vdom, parent) {
        avalon.directives.controller.update(dom, vdom, parent, 'important')
    }
})
