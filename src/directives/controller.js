// 抽离出来公用
var update = require('./_update')

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
        cur.present = '__present__'
        pre.$append = '/*controller:' + $id + '*/\n})(__vmodel__);'
    },
    diff: function (cur, pre, steps, name) {
        if (pre[name] !== cur[name]) {
            update(cur, this.update, steps, 'controller')
        }
    },
    update: function (node, vnode, parent, important) {
        var top = vnode.top //位于上方的顶层vm或mediator vm
        var present = vnode.present
        var synth = vnode.synth
        if (top === present) {
            if (top === void 0) {
                //如果变动是来自某个顶层vm的下方vm,那么在avalon.batch里
                //只会为render传入synth,top,present都为undefined
                return
            }
            var scope = avalon.scopes[top.$id]

            if (scope &&
                    (!important || important.fast)) {
                //如果vm在位于顶层,那么在domReady的第一次scan中已经注册到scopes
                return
            }
        }

        if (top && present) {
            var str = (top.$render + "")
            var splitText = '/*controller:' + present.$id + '*/'
            var start = str.indexOf(splitText) + splitText.length
            var end = str.lastIndexOf(splitText)
            var effective = str.slice(start, end)
            var local = vnode.local || {}
            var vars = []
            for (var i in local) {
                vars.push('var ' + i + ' = __local__[' + avalon.quote(i) + ']')
            }
            vars.push('var vnodes = []')
            var body = vars.join('\n') + effective + '\nreturn vnodes'
            var render = avalon.render(body)
            synth.$render = present.$render = render
            synth.$element = present.$element = node
            avalon.scopes[present.$id] = {
                vmodel: present,
                synth: synth,
                local: local,
                dom: node,
                render: render,
                fast: 'important'
            }
        }
    }
})
