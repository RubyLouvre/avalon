
var update = require('./_update')

avalon.directive('css', {
    diff: function (copy, src, name) {
        var a = copy[name]
        var p = src[name]
        if (Object(a) === a) {
            
            a = a.$model || a//安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            if (typeof p !== 'object') {//如果一开始为空
                src.changeStyle = src[name] = a
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
                    src.changeStyle = patch
                }
            }
            if (src.changeStyle) {
                update(src, this.update)
            }
        }
        delete copy[name]//释放内存
    },
    update: function (dom, vdom) {
        var change = vdom.changeStyle
        var wrap = avalon(dom)
        for (var name in change) {
            wrap.css(name, change[name])
        }
        delete vdom.changeStyle
    }
})
