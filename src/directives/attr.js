
var attrUpdate = require('../dom/attr/compact')
var update = require('./_update')

avalon.directive('attr', {
    diff: function (cur, pre, steps, name) {
        var a = cur[name]
        var p = pre[name]
        if (a && typeof a === 'object') {
            if (Array.isArray(a)) {
                a = cur[name] = avalon.mix.apply({}, a)
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
                update(cur, this.update, steps, 'attr' )
            }
        } else {
            cur[name] = p
        }
        pre.changeAttr = null
    },
    //dom, vnode
    update: attrUpdate
})
