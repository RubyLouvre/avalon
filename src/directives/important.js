// 抽离出来公用
var update = require('./_update')

avalon.directive('important', {
    priority: 1,
    parse: function (copy, src, binding) {
        var quoted = avalon.quote(binding.expr)
        copy.local = '{}'
        copy.vmodel = '(function(){ return __vmodel__ = avalon.vmodels[' + quoted + ']})()'
        src.$prepend = ['(function(__vmodel__){',
            'var important = avalon.scopes[' + quoted + ']',
            'if(important && important.fast){avalon.log("不进入"+' + quoted + ');return }',
        ].join('\n') + '\n'
        src.$append = '\n})();'
    },
    diff: function (copy, src) {
        if (src.vmodel !== copy.vmodel) {
            src.props['ms-controller'] = src.props['ms-important']
            delete src.props['ms-important']
            src.local = copy.local
            src.vmodel = copy.vmodel
            update(src, this.update)
        }
    },
    update: function (dom, vdom, parent) {
        avalon.directives.controller.update(dom, vdom, parent, 'important')
    }
})
