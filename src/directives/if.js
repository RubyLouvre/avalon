var update = require('./_update')
//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    diff: function (cur, pre, steps, name) {
        var c = !!cur[name]
        if (c !== pre[name]) {
            pre[name] = c
            if (c && pre.nodeType === 1) {
                return
            }
            update(pre, this.update, steps, 'if')
        }

    },
    update: function (dom, vdom, parent) {
        var show = vdom['ms-if']
        if (show) {
            //要移除元素节点,在对应位置上插入注释节点
            avalon.applyEffect(dom, vdom, {
                hook: 'onEnterDone',
                cb: function () {
                    vdom.nodeType = 1
                    var comment = vdom.comment
                    comment.parentNode.replaceChild(dom, comment)
                }
            })
        } else {
            avalon.applyEffect(dom, vdom, {
                hook: 'onLeaveDone',
                cb: function () {
                    var comment = document.createComment('ms-if')
                    //去掉注释节点临时添加的ms-effect
                    parent.replaceChild(comment, dom)
                    vdom.nodeType = 8
                    vdom.comment = comment
                }
            })
        }
    }
})

