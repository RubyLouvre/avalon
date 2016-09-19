// 抽离出来公用
var update = require('./_update')

var cache = {}
avalon.mediatorFactoryCache = function (top, $id) {
    var vm = avalon.vmodels[$id]
    if (vm && top && vm !== top) {
        var a = top.$hashcode
        var b = vm.$hashcode
        var id = a + b
        if (cache[id]) {
            return cache[id]
        }
        var c = avalon.mediatorFactory(top, vm)
        return  cache[id] = c
    } else {
        return top
    }
}
avalon.directive('controller', {
    priority: 2,
    parse: function (copy, src, binding) {
        var quoted = avalon.quote(binding.expr)
        copy.local = '__local__'
        copy.vmodel = '__vmodel__'
        copy[binding.name] = 1

        src.$prepend = '(function(__top__){\n' +
                'var __vmodel__ = avalon.mediatorFactoryCache(__top__,' + quoted + ')\n'
        src.$append = '\n})(__vmodel__);'
    },
    diff: function (copy, src, name) {
        if (!src.dynamic[name]) {
            src.local = copy.local
            src.vmodel = copy.vmodel

            update(src, this.update)
        }
    },
    update: function (dom, vdom, parent, important) {
        var vmodel = vdom.vmodel
        var local = vdom.local
        var name = important ? 'ms-important' : 'ms-controller'
        vdom.dynamic[name] = 1
        var id = vdom.props[name]
        var scope = avalon.scopes[id]
        if (scope) {
            return
        }

        var top = avalon.vmodels[id]
        if (vmodel.$element && vmodel.$element.vtree[0] === vdom) {
            var render = vmodel.$render
        } else {
            render = avalon.render([vdom], local)
        }
        vmodel.$render = render
        vmodel.$element = dom
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
            avalon(dom).removeClass('ms-controller')
            dom.setAttribute('wid', id)
            avalon._disposeComponent(dom)
            var events = needFire.$events["onReady"]
            if (events) {
                needFire.$fire('onReady')
                delete needFire.$events.onReady
            }
            scope.isMount = true
        }, 'afterChange')

    }
})
