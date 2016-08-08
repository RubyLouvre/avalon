var update = require('./_update')
//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    diff: function (copy, src, name) {
        var cur = !!copy[name]
        var old = src[name]
        src[name] = cur
        if (src.execIf) {
            if (!cur) {
                copy.nodeType = 8
                copy.order = '' //不再执行子孙节点的操作
            }
            if (copy === src || cur !== old) {
                update(src, this.update)
            }
        } else {
            update(src, this.update, 'afterChange')
        }
    },
    update: function (dom, vdom, parent) {
        var show = vdom['ms-if']
        vdom.execIf = true
        if (show) {
            //要移除元素节点,在对应位置上插入注释节点
            vdom.nodeType = 1
            vdom.nodeValue = null
            var comment = vdom.comment
            if (!comment) {
                return
            }
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
                    parent = parent || dom.parentNode
                    vdom.nodeValue = 'ms-if'
                    parent.replaceChild(comment, dom)
                    vdom.nodeType = 8
                    vdom.comment = comment
                }
            })
        }
    }
})

