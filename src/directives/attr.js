
var attrUpdate = require('../dom/attr/compact')
var update = require('./_update')

avalon.directive('attr', {
    diff: function (cur, pre, steps, name) {
        var a = cur[name]
        var p = pre[name]
        if (a && typeof a === 'object') {
            a = a.$model || a //安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {//如果一开始为空
                pre.changeAttr = pre[name] = a
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
                    pre.changeAttr = patch
                }
            }
            if (pre.changeAttr) {
                update(pre, this.update, steps, 'attr' )
            }
        }
        delete cur[name]//释放内存
    },
    //dom, vnode
    update: attrUpdate
})
