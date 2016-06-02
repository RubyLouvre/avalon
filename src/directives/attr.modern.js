
var attrUpdate = require('../dom/attr/modern')
var update = require('./_update')

avalon.directive('attr', {
    diff: function (cur, pre, steps, name) {
        var a = cur[name]
        var p = pre[name]
        if (Object(a) === a) {
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
                    steps.count += 1
                }
            }
            if (cur.changeAttr) {
                update(cur, attrUpdate, steps, 'attr' )
            }
        } else {
            cur[name] = p
        }
    },
    //dom, vnode
    update: attrUpdate
})

