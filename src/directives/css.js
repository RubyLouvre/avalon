
var update = require('./_update')

avalon.directive('css', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-css"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre, steps, name) {
        var a = cur.props[name]
        var p = pre.props[name]
        if (Object(a) === a) {
            if (Array.isArray(a)) {
                a = cur.props[name] = avalon.mix.apply({}, a)
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
                update(cur, this.update, steps, 'css')
            }
        } else {
            cur.props[name] = p
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
