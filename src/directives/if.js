var update = require('./_update')
//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    diff: function (copy, src, name, copys, sources, index) {
        var cur = !!copy[name]
        src[name] = cur
        update(src, this.update)

    },
    update: function (dom, vdom, parent) {
        var show = vdom['ms-if']
        if (vdom.dynamic['ms-if']) {
            vdom.dynamic['ms-if'] = vdom.nodeName
        }
        if (show) {
            if (vdom.nodeName === '#comment') {
                vdom.nodeName = vdom.dynamic['ms-if']
                delete vdom.nodeValue
                var comment = vdom.comment
                if (!comment) {
                    return
                }
                parent = comment.parentNode
                if (parent)
                    parent.replaceChild(dom, comment)
                avalon.applyEffect(dom, vdom, {
                    hook: 'onEnterDone'
                })
            }
        } else {

            //要移除元素节点,在对应位置上插入注释节点
            if (!vdom.comment) {
                vdom.comment = document.createComment('if')
            }
            vdom.nodeName = '#comment'
            vdom.nodeValue = 'if'
            avalon.applyEffect(dom, vdom, {
                hook: 'onLeaveDone',
                cb: function () {
                    //去掉注释节点临时添加的ms-effect
                    //https://github.com/RubyLouvre/avalon/issues/1577
                    //这里必须设置nodeValue为ms-if,否则会在节点对齐算法中出现乱删节点的BUG
                    parent = parent || dom.parentNode
                    if (!parent) {
                        return
                    }
                    parent.replaceChild(vdom.comment, dom)
                }
            })
        }
    }
})

