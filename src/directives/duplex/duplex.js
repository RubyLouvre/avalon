avalon.directive('duplex', {
    priority: 2000,
    parse: function (binding, num, elem) {
        var expr = binding.expr
        var etype = elem.props.type
        var itype
        if (rcheckedFilter.test(expr)) {
            if (rcheckedType.test(etype)) {
                itype = 'checked'
            } else {
                avalon.warn('只有radio与checkbox才能用checked过滤器')
                expr = expr.replace(rcheckedFilter, '')
            }
        }

        if (rchangeFilter.test(expr)) {
            if (rnoduplexInput.test(etype)) {
                avalon.warn(etype + '不支持change过滤器')
                expr = expr.replace(rchangeFilter, '')
            } else {
                itype = 'change'
            }
        }

        if (!itype) {
            itype = etype === 'select' ? 'select' :
                    etype === 'checkbox' ? 'checkbox' :
                    etype === 'radio' ? 'radio' :
                    'input'
        }
        binding.expr = expr
        avalon.parseExpr(binding, 'duplex')
        return 'vnode' + num + '.duplexVm = __vmodel__;\n' +
                'vnode' + num + '.props.itype = ' + quote(itype) + ';\n' +
                'vnode' + num + '.props["a-duplex"] = ' + quote(binding.expr) + ';\n'
    },