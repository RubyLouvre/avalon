
avalon.directive('controller', {
    priority: 2,
    parse: function (binding, num) {
        var vm = 'vm' + num
        var $id = binding.expr
        var isObject = /\{.+\}/.test($id)
        var a = 'var ' + vm + ' =  avalon.vmodels[' + avalon.quote($id) + ']\n'
        var b = 'var ' + vm + ' = ' + $id + '\n'
        var str = (isObject ? b : a) +
                'if(' + vm + '){\n' +
                '\tif(__vmodel__){\n' +
                '\t\t__vmodel__ = avalon.mediatorFactory(__vmodel__, ' + vm + ')\n' +
                '\t}else{\n' +
                '\t\t__vmodel__ = ' + vm + '\n' +
                '\t}\n' +
                '}\n\n\n'
        return str
    },
    diff: avalon.noop,
    update:avalon.noop
})

