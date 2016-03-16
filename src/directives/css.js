

avalon.directive('css', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["a-css"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var a = cur.props['a-css']
        var p = pre.props['a-css']
        if ( Object(a) === a) {
            if (Array.isArray(a)) {
                a = cur.props['a-css'] = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {
                cur.changeStyle = a
                
            } else {
                var patch = {}
                var hasChange = false
                for (var i in a) {
                    if (a[i] !== p[i]) {
                        hasChange = true
                        patch[i] = a[i]
                    }
                }
                if (hasChange) {
                    cur.changeStyle = patch
                }
            }
            if (cur.changeStyle) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        } else {
            cur.props['a-css'] = p
        }
    },
    update: function (node, vnode) {
        var change = vnode.changeStyle
        var wrap = avalon(node)
        for (var name in change) {
            wrap.css(name, change[name])
        }
        delete vnode.changeStyle
    }
})
