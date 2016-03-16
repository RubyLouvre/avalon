
var attrUpdate = require('../dom/attr/modern')

avalon.directive('attr', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["a-attr"] = ' + avalon.parseExpr(binding) + ';\n'
    },
    diff: function (cur, pre) {
        var a = cur.props['a-attr']
        var p = pre.props['a-attr']
        if (Object(a) === a) {
            if (Array.isArray(a)) {
                a = cur.props['a-attr'] = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {
                cur.changeAttr = a
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
                    cur.changeAttr = patch
                }
            }
            if (cur.changeAttr) {
                var list = cur.change || (cur.change = [])
                avalon.Array.ensure(list, this.update)
            }
        } else {
            cur.props['a-attr'] = p
        }
    },
    //dom, vnode
    update: attrUpdate
})

