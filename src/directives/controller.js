// 抽离出来公用
var update = require('./_update')
var reconcile = require('../strategy/reconcile')

var cache = {}
avalon.mediatorFactoryCache = function (__vmodel__, __present__) {
    var a = __vmodel__.$hashcode
    var b = __present__.$hashcode
    var id = a + b
    if (cache[id]) {
        return cache[id]
    }
    var c = avalon.mediatorFactory(__vmodel__, __present__)
    return  cache[id] = c
}
avalon.directive('controller', {
    priority: 2,
    parse: function (copy, src, binding) {
        var quoted = avalon.quote(binding.expr)
        copy[binding.name] = quoted
        copy.local = '__local__'
        copy.vmodel = [
            '(function(){',
            'var vm = avalon.vmodels[' + quoted + ']',
            'if(vm && __vmodel__&& vm !== __vmodel__){',
            'return __vmodel__ = avalon.mediatorFactoryCache(__vmodel__, vm)',
            '}else if(vm){',
            'return __vmodel__ = vm',
            '}',
            '})()'
        ].join('\n')

        src.$prepend = '(function(__vmodel__){'
        src.$append = '\n})(__vmodel__);'
    },
    diff: function (copy, src, name) {
        if (src[name] !== copy[name]) {
            src[name] = copy[name]
            src.local = copy.local
            src.vmodel = copy.vmodel
            update(src, this.update)

        }
    },
    update: function (dom, vdom, parent, important) {
        var vmodel = vdom.vmodel
        var local = vdom.local
        var id = vdom['ms-controller']
        var scope = avalon.scopes[id]
        if (scope) {
            return
        }
        delete vdom.vmodel
        delete vdom.local
        var top = avalon.vmodels[id]
        var render = avalon.render([vdom], local)
        vmodel.$render = render
        vmodel.$element = dom
        reconcile([dom], vdom, parent)
        dom.vtree = [vdom]
        if (top !== vmodel) {
            top.$render = top.$render || render
            top.$element = top.$element || dom
        }
        var needFire = important ? vmodel : top
        var scope = avalon.scopes[id] = {
            vmodel: vmodel,
            local: local
        }
        update(vdom, function () {
            var events = needFire.$events["onReady"]
            if (events) {
                needFire.$fire('onReady')
                delete needFire.$events.onReady
            }
            scope.isMount = true
        }, 'afterChange')

    }
})
