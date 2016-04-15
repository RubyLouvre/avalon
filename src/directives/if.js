var patch = require('../strategy/patch')
var uniqueID = 1
avalon.directive('if', {
    priority: 5,
    parse: function (binding, num) {
        return 'vnode' + num + '.props["ms-if"] = ' + avalon.quote(binding.expr) + ';\n'
    },
    diff: function (cur, pre, steps) {
        cur.dom = pre.dom
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
        var vtype = vnode.nodeType
        if (dtype !== vtype) {
            if (vtype === 1) {
                //要插入元素节点,将原位置上的注释节点移除并cache
                var element = vnode.dom//avalon.caches[e]
                if (!element) {
                    element = avalon.vdomAdaptor(vnode, 'toDOM')
                    vnode.dom = element
                }
                parent.replaceChild(element, node)
                if (vnode.steps.count) {
                    patch([element], [vnode], parent, vnode.steps)
                }
            } else if (vtype === 8) {
                //要移除元素节点,在对应位置上插入注释节点
                var comment = node._ms_if_ ||
                        (node._ms_if_ = document.createComment(vnode.signature))
                parent.replaceChild(comment, node)
            }
        }
    }
})

