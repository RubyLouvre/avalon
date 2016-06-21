// 抽离出来公用
var update = require('./_update')
var cache = {}
avalon.mediatorFactory2 = function (__vmodel__, __present__) {
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
    parse: function (cur, pre, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)
        var name = binding.name
        cur[name] = quoted

        // 'if(!avalon.skipController(__fast__, bottomVm)){ '
        // cur.props[name] = $id
        pre.$prepend = ['(function(__vmodel__){',
            'var __top__ = __vmodel__',
            'var __present__ = avalon.vmodels[' + quoted + ']',
            'if(__present__ && __top__ && __present__ !== __top__){',
            'var __synth__ =  avalon.mediatorFactory(__vmodel__, __present__)',
            'var __vmodel__ = __synth__',
            '}else{',
            '__vmodel__ = __top__ || __present__',
            '}',
            '/*controller:' + $id + '*/',
        ].join('\n') + '\n\n'
        cur.synth = '__synth__'
        cur.local = '__local__'
        cur.top = '__top__'
        pre.$id = $id
        cur.vmodel = '__present__'
        pre.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (cur, pre, steps, name) {
        if (pre[name] !== cur[name]) {
            pre[name] = cur[name]
            pre.synth = cur.synth
            pre.local = cur.local
            pre.top = cur.top
            pre.vmodel = cur.vmodel
            update(pre, this.update, steps, 'controller')
        }
    },
    update: function (dom, vdom, parent, important) {


        var scope = avalon.scopes[vdom.$id]

        if (scope &&
                (!important || important.fast)) {
            //如果vm在位于顶层,那么在domReady的第一次scan中已经注册到scopes
            return
        }
        var top = vdom.top //位于上方的顶层vm或mediator vm
        var vmodel = vdom.vmodel

        if (top && vmodel) {
            var str = (top.$render + "")
            var splitText = '/*controller:' + vmodel.$id + '*/'
            var start = str.indexOf(splitText) + splitText.length
            var end = str.lastIndexOf(splitText)
            var effective = str.slice(start, end)
            var local = vdom.local || {}
            var vars = []
            for (var i in local) {
                vars.push('var ' + i + ' = __local__[' + avalon.quote(i) + ']')
            }
            vars.push('var vnodes = []\n')
            var body = vars.join('\n') + effective + '\nreturn vnodes'
            var render = avalon.render(body)
            
            var synth = vdom.synth
            synth.$render = vmodel.$render = render
            synth.$element = vmodel.$element = dom
            dom.vtree = [vdom]
            
            delete vdom.top 
            delete vdom.synth

            avalon.scopes[vmodel.$id] = {
                vmodel: synth || vmodel,
                local: local,
                dom: dom,
                render: render,
                isMount: 2,
                fast: 'important'
            }
        }
    }
})
