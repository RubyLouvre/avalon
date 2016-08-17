var update = require('./_update')

avalon.directive('expr', {
    parse: avalon.noop,

    update: function (dom, vdom) {
        if (dom) {
            dom.nodeValue = vdom.nodeValue
        } else {
            avalon.warn('[', vdom.nodeValue, ']找不到对应的文本节点赋值')
        }
    }
})


