
var update = require('./_update')

avalon.directive('css', {
    diff: function (cur, pre, steps, name) {
        var a = cur[name]
        var p = pre[name]
        if (Object(a) === a) {
            
            a = a.$model || a//安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {//如果一开始为空
                pre.changeStyle = pre[name] = a
            } else {
                var patch = {}
                var hasChange = false
                for (var i in a) {//diff差异点
                    if (a[i] !== p[i]) {
                        hasChange = true
                        patch[i] = a[i]
                    }
                }
                if (hasChange) {
                    pre[name] = a
                    pre.changeStyle = patch
                }
            }
            if (pre.changeStyle) {
                update(pre, this.update, steps, 'css')
            }
        }
        delete cur[name]//释放内存
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
