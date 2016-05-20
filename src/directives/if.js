var patch = require('../strategy/patch')
var update = require('./_update')

//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    parse: function (binding, num) {
        var vnode = 'vnode' + num
        var ret = [
            'var ifVar = ' + avalon.parseExpr(binding, 'if'),
            vnode + '.props["ms-if"] = ifVar;',
            'if(!ifVar){',
            vnode + '.nodeType = 8;',
            vnode + '.directive="if";',
            vnode + '.nodeValue="ms-if"', '}'
        ]
        return ret.join('\n') + '\n'
    },
    diff: function (cur, pre, steps) {
        cur.dom = pre.dom
        if (cur.nodeType !== pre.nodeType) {
            cur.steps = steps
            update(cur, this.update, steps, 'if' )
        }
    },
    update: function (node, vnode, parent) {
        var dtype = node.nodeType
        var vtype = vnode.nodeType
        if (dtype !== vtype) {
            if (vtype === 1) {
                //要插入元素节点,将原位置上的注释节点移除并cache
                var element = vnode.dom
                if (!element) {
                    element = avalon.vdomAdaptor(vnode, 'toDOM')
                    vnode.dom = element
                    var props = vnode.props
                    for (var prop in props) {//如果一开始是隐藏,那么事件会没有绑上
                        if (prop.match(/ms\-on/g)) {
                            var fun = props[prop]
                            if (typeof fun === 'function') {
                                element._ms_context_ = vnode.onVm
                                avalon.bind(element, prop.split('-')[2], fun)
                            }
                        }
                    }
                    if (vnode.onVm) delete vnode.onVm
                }
                parent.replaceChild(element, node)
                if (vnode.steps.count) {
                    patch([element], [vnode], parent, vnode.steps)
                }
                avalon.applyEffect(node, vnode, {
                    hook: 'onEnterDone'
                })
                return (vnode.steps = false)
            } else if (vtype === 8) {
                //要移除元素节点,在对应位置上插入注释节点
                avalon.applyEffect(node, vnode, {
                    hook: 'onLeaveDone',
                    cb: function () {
                        var comment = node._ms_if_ ||
                                (node._ms_if_ = document.createComment(vnode.nodeValue))

                        parent.replaceChild(comment, node)
                    }
                })
            }
        }
    }
})

