var update = require('./_update')
//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    diff: function (copy, src, name) {
        var c = !!copy[name]
        if (!c) {
            copy.nodeType = 8
            copy.order = ''
            //不再执行子孙节点的操作
        }
        if (c !== src[name]) {
            src[name] = c
            if (c && src.nodeType === 1) {
                return
            }
            update(src, this.update)
        }
    },
    update: function (dom, vdom, parent) {
        var show = vdom['ms-if']
        if (show) {
            //要移除元素节点,在对应位置上插入注释节点
            vdom.nodeType = 1
            vdom.nodeValue = null
            var comment = vdom.comment
            parent = comment.parentNode
            parent.replaceChild(dom, comment)
            avalon.applyEffect(dom, vdom, {
                hook: 'onEnterDone'
            })
        } else {

            avalon.applyEffect(dom, vdom, {
                hook: 'onLeaveDone',
                cb: function () {
                    var comment = document.createComment('ms-if')
                    //去掉注释节点临时添加的ms-effect
                    //https://github.com/RubyLouvre/avalon/issues/1577
                    //这里必须设置nodeValue为ms-if,否则会在节点对齐算法中出现乱删节点的BUG
                    vdom.nodeValue = 'ms-if'
                    parent.replaceChild(comment, dom)
                    vdom.nodeType = 8
                    vdom.comment = comment
                }
            })
        }
    }
})

