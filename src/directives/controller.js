avalon.directive('controller', {
    priority: 2,
    parse: function (binding, num, vnode) {
        var vm = 'vm' + num,
            $id = binding.expr,
            isObject = /\{.+\}/.test($id),
            a = 'var ' + vm + ' =  avalon.vmodels[' + avalon.quote($id) + ']\n',
            b = 'var ' + vm + ' = ' + $id + '\n'
        if (!(vnode.scan === false) || isObject) {
            return (isObject ? b : a) +
                'if(' + vm + '){\n' +
                '\tif(__vmodel__){\n' +
                '\t\t__vmodel__ = avalon.mediatorFactory(__vmodel__, ' + vm + ')\n' +
                '\t}else{\n' +
                '\t\t__vmodel__ = ' + vm + '\n' +
                '\t}\n' +
                '}\n\n\n'
        }
        var vmodel = avalon.vmodels[$id],
            children = vnode.children,
            propsCopy = avalon.mix({}, vnode.props),
            __inheritVmodel__

        delete vnode.props['ms-controller']
        vnode.children = []

        var template = avalon.vdomAdaptor(vnode, 'toHTML')

        vnode.props['ms-controller'] = $id
        vnode.children = children
        vmodel.$$render = function(inheritVmodel) {
            inheritVmodel = __inheritVmodel__ = inheritVmodel || __inheritVmodel__
            var __vmodel__ = vmodel
            if(inheritVmodel) __vmodel__ = avalon.mediatorFactory(inheritVmodel, vmodel)
            var render = avalon.lexer(template)
            render = avalon.render(render, num) 
            var _vnode = render(__vmodel__)[0]
            vmodel.$render = function() {
                return [vmodel.$$render()[1]]
            }   
            _vnode.props['ms-controller'] = $id
            return [__vmodel__, _vnode]
        }
        return a +
            'if (' + vm + ') {\n' +
            '\tif (' + vm + '.$element) {\n' + 
            '\t\tavalon.$$unbind(' + vm + '.$element)\n' + 
            '\t}\n' + 
            '\tvar tmp = ' + vm + '.$$render(__vmodel__)\n' + 
            '\t__vmodel__ = tmp[0]\n' +
            '\tvnode' + num + ' = tmp[1]\n' +
            '}\n'
    },
    diff: avalon.noop,
    update:avalon.noop
})
