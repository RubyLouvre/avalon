
var update = require('./_update')

avalon.directive('css', {
    diff: function (cur, pre, steps, name) {
        var a = cur[name]
        var p = pre[name]
        if (Object(a) === a) {
            if (Array.isArray(a)) {
                a = cur[name] = avalon.mix.apply({}, a)
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
            cur[name] = p
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
