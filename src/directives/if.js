var patch = require('../strategy/patch')
var uniqueID = 1
avalon.directive('if', {
    priority: 5,
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-if"] = ' + avalon.quote(binding.expr) + ';\n'
    },
    diff: function (cur, pre, steps) {
        if (cur.type !== pre.type) {
            var list = cur.change || (cur.change = [])
            if (avalon.Array.ensure(list, this.update)) {
                steps.count += 1
                cur.steps = steps
            }
        }
    },
    update: function (node, vnode, parent) {
        var dtype = node.nodeType
        var vtype = vnode.type
        if (dtype !== vtype) {
            var steps = vnode.steps
            if (vnode.nodeType === 1) {
                //要插入元素节点,将原位置上的注释节点移除并cache
                var e = node.uniqueID
                var element = avalon.caches[e]
                if (!element) {
                    element = avalon.vdomAdaptor(vnode, 'toDOM')
                } else {
                    delete avalon.caches[e]
                }
                parent.replaceChild(element, node)
             //   if( steps.count -1 > 0) {
                    patch([element], [vnode], null, {count: 20000})
             //   }
            } else if (vnode.nodeType === 8) {
                //要移除元素节点,在对应位置上插入注释节点
                var comment = node._av_if_ ||  document.createComment(vnode.signature)
                node._av_if_ = comment
                //IE6-8,不能为注释节点添加任何自定义属性,幸好其有一个uniqueID标识的唯一性
                var uid = comment.uniqueID || (comment.uniqueID || ++uniqueID)
                parent.replaceChild(comment, node)
                avalon.caches[uid] = node
            }
        }
    }
})

