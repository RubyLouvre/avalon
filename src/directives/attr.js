
var attrUpdate = require('../dom/attr/compact')
var update = require('./_update')

avalon.directive('attr', {
    diff: function (copy, src, name) {
        var a = copy[name]
        var p = src[name]
        if (a && typeof a === 'object') {
            a = a.$model || a //安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {//如果一开始为空
                src.changeAttr = src[name] = a
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
                    src[name] = a
                    src.changeAttr = patch
                }
            }
            if (src.changeAttr) {
                update(src, this.update )
            }
        }
        delete copy[name]//释放内存
    },
    //dom, vnode
    update: attrUpdate
})
