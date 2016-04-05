
var attrUpdate = require('../dom/attr/compact')

avalon.directive('attr', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-attr"] = ' + avalon.parseExpr(binding) + ';\n'

    },
    diff: function (cur, pre, root) {
        var a = cur.props['ms-attr']
        var p = pre.props['ms-attr']
        if (a && typeof a === 'object') {
            if (Array.isArray(a)) {
                a = cur.props['ms-attr'] = avalon.mix.apply({}, a)
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
                root.count += 1
            }
        } else {
            cur.props['ms-attr'] = p
        }
        pre.changeAttr = null
    },
    //dom, vnode
    update: attrUpdate
})

