avalon.directive('rules', {
    parse: function (binding, num) {
        var rules = binding.expr
        if (/{.+}/.test(rules)) {
            return 'vnode' + num + '.props["ms-rules"] = ' + avalon.parseExpr(binding) + ';\n'
        }
    }
})
avalon.shadowCopy(avalon.validators,{
    pattern: {
        message: '必须匹配/{{pattern}}/这样的格式',
        get: function (value, field, next) {
            var elem = field.element
            var data = field.data
            if (avalon.type(data.pattern) !== 'regexp') {
                var h5pattern = elem.getAttribute("pattern")
                var mspattern = elem.getAttribute("data-pattern")
                var pattern = h5pattern || mspattern
                var re = new RegExp('^(?:' + pattern + ')$')
                data.pattern = re
            }
            next(data.pattern.test(value))
            return value
        }
})