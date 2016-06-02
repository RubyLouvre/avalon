// 抽离出来公用
var update = require('./_update')

avalon.skipController = function (fast, vm, iv) {
    if (fast) {
        var id = vm.$render ? vm.$render.$id : vm.$id
        if (fast.length > id.length) {
            return fast.indexOf(id + ';;') !== 0
        }
        return id.indexOf(fast) !== 0
    }
    return false
}

avalon.directive('controller', {
    priority: 2,
    parse: function (cur, pre, binding) {
        var $id = binding.expr
        var quoted = avalon.quote($id)
        var name = binding.name
        cur[name] = quoted
        // cur.props[name] = $id
        pre.$prepend = ['(function(topVm){',
            'var bottomVm = avalon.vmodels[' + quoted + ']',
            'if(bottomVm && topVm){',
            '__vmodel__ =  avalon.mediatorFactory(topVm, bottomVm)',
            'var mediator = __vmodel__',
            '}else{',
            '__vmodel__ = topVm || bottomVm',
            '}',
            'if(!avalon.skipController(__fast__, bottomVm)){ '
        ].join('\n') + '\n\n'
        cur.mediator = 'mediator'
        cur.vmodel = 'topVm'
        cur.bottom = 'bottomVm'
        pre.$append = '}\n\n})(__vmodel__)'
    },
    diff: function (cur, pre, steps, name) {
        if (pre[name] !== cur[name]) {
            update(cur, this.update, steps, 'controller')
        }
    },
    update: function (node, vnode) {
        var top = vnode.vmodel //位于上方的顶层vm或mediator vm
        var bottom = vnode.bottom //位于下方的顶层vm
        var mediator = vnode.mediator //新合成的mediator vm
        if (!(top && bottom)) {
            return
        }
        bottom.$element = (top && top.$element) || node
        vnode.mediator = vnode.bottom = 0
        if (!bottom.$render) {
            var topRender = top.$render
            if (!topRender.$id) {
                topRender.$id = top.$id
            }
            function bottomRender() {
                return topRender(0, bottomRender.$id)
            }
            bottom.$render = bottomRender
            bottomRender.dom = bottom.$element  //方便以后更换扫描起点
            bottomRender.$id = topRender.$id + ';;' + bottom.$id
            if (mediator) {
                mediator.$render = bottomRender
            }
        }
    }
})
