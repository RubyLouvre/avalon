var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,
    diff: function (copy, src) {
        var copyValue = copy.nodeValue + ''
        if (copyValue !== src.nodeValue) {
            src.nodeValue = copyValue
            update(src, this.update)
        }
    },
    update: function (dom, vdom) {
        if (dom) {
            dom.nodeValue = vdom.nodeValue
        } else {
            avalon.warn('[', vdom.nodeValue, ']找到对应的文本节点赋值')
        }
    }
})


