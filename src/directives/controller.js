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
    parse: function (binding, num, elem) {
        var id = avalon.quote(binding.expr)
        delete elem.props['ms-controller']
        var vm = 'vm' + num
        var ret = [
            'if(!vnodes' + num + '.vm){ vnodes' + num + '.vm = __vmodel__}',
            '__vmodel__ = vnodes' + num + '.vm || __vmodel__',
            'vnode' + num + '.props["ms-controller"] = ' + id + ';',
            'var ' + vm + ' = avalon.vmodels[' + id + ']',
            'if(!' + vm + '){return }',
            'vnode' + num + '.bottom = ' + vm,
            'if(__vmodel__){',
            'vnode' + num + '.top = __vmodel__',
            'var __id__ = __vmodel__.$id+ "_" + ' + id,
            "__vmodel__ = avalon.caches[__id__] || (avalon.caches[__id__] = avalon.mediatorFactory(__vmodel__," + vm + '))',
            'vnode' + num + '.mediator = __vmodel__',
            '}else{',
            '__vmodel__ = ' + vm,
            '}',
            'if(!avalon.skipController(__fast__, vnode' + num + '.bottom)){ '
        ]
        return ret.join('\n') + '\n'
    },
    diff: function (cur, pre, steps, name) {
        if (pre.props[name] !== cur.props[name]) {
            update(cur, this.update, steps, 'controller' )
        }
    },
    update: function (node, vnode) {
        var top = vnode.top //位于上方的顶层vm或mediator vm
        var bottom = vnode.bottom //位于下方的顶层vm
        var mediator = vnode.mediator //新合成的mediator vm
        if(!(top && bottom)){
            return
        }
        bottom.$element =  (top && top.$element) || node
        vnode.top = vnode.mediator = vnode.bottom = 0
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
            if(mediator){
               mediator.$render = bottomRender
            }
        }
    }
})