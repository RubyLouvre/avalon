
var update = require('./_update')

avalon.directive('css', {
    diff: function (copy, src, name, hookName) {
        var a = copy[name]
        var p = src[name]
        if (Object(a) === a) {
            a = a.$model || a//安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                var b = {}
                a.forEach(function (el) {
                    el && avalon.shadowCopy(b, el)
                })
                a = b
            }
            var hasChange = false
            if (!src.dynamic[name] || !p) {//如果一开始为空
                src[name] = a
                hasChange = true
            } else {
                var patch = {}
                for (var i in a) {//diff差异点
                    if (a[i] !== p[i]) {
                        hasChange = true
                    }
                    patch[i] = a[i]
                }
                for (var i in p) {
                    if (!(i in patch)) {
                        hasChange = true
                        patch[i] = ''
                    }
                }
                src[name] = patch
            }
            if (hasChange) {
                if(name ==='ms-effect'){
                    src[name] = a
                }
                update(src, this.update, hookName)
            }
        }
        if(src !== copy)
           delete copy[name]//释放内存
    },
    update: function (dom, vdom) {
        if (dom && dom.nodeType === 1) {
            var wrap = avalon(dom)
            vdom.dynamic['ms-css'] = 1
            var change = vdom['ms-css']
            for (var name in change) {
                wrap.css(name, change[name])
            }
        }
    }
})
module.exports = avalon.directives.css
