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
    parse: function (copy, src, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)
        var name = binding.name
        copy[name] = quoted


        src.$prepend = ['(function(__vmodel__){',
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
        copy.synth = '__synth__'
        copy.local = '__local__'
        copy.top = '__top__'
        src.$id = $id
        copy.vmodel = '__present__'
        src.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (copy, src, name) {
        if (src[name] !== copy[name]) {
            src[name] = copy[name]
            src.synth = copy.synth
            src.local = copy.local
            src.top = copy.top
            src.vmodel = copy.vmodel
            update(src, this.update)
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
            var str = (top.$render + '')
            var synth = vdom.synth
            var vm = synth || vmodel
            //开始构建模板函数,从顶层vm的模板函数的toString中
            //通过splitText截取其作用的区域,
            //前面加上本地变量与vnodes数组,后面返回vnodes数组
            //放进avalon.render方法中生成
            var splitText = '/*controller:' + vdom.$id + '*/'
            var arr = str.split(splitText)   
            var effective = arr[1]
            var local = vdom.local || {}
            var vars = []
            for (var i in local) {
                vars.push('var ' + i + ' = __local__[' + avalon.quote(i) + ']')
            }
            vars.push('var vnodes = []\n')
            var body = vars.join('\n') + effective + '\nreturn vnodes'
            var render = avalon.render(body)
            //为相关的vm添加对应属性,$render,$element,vtree
            
            synth.$render = vmodel.$render = render
            synth.$element = vmodel.$element = dom
            dom.vtree = [vdom]
            vdom.top = vdom.synth = vdom.vmodel = 0
           
            avalon.scopes[vdom.$id] = {
                vmodel: vm,
                local: local,
                fast: 'important'
            }
        }
    }
})
