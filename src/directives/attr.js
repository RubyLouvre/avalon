
var attrUpdate = require('../dom/attr/compact')

avalon.directive('attr', {
    parse: function (binding, num) {
        return 'vnode' + num + '.props["av-attr"] = ' + avalon.parseExpr(binding) + ';\n'

    },
    diff: function (cur, pre) {
        var a = cur.props['av-attr']
        var p = pre.props['av-attr']
        if (a && typeof a === 'object') {
            if (Array.isArray(a)) {
                a = cur.props['av-attr'] = avalon.mix.apply({}, a)
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
            cur.props['av-attr'] = pre.props['av-attr']
        }
    },
    //dom, vnode
    update: attrUpdate
})

