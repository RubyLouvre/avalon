var patch = require('../strategy/patch')
var update = require('./_update')
var stringify = require('../strategy/parser/stringify')


//ms-imporant ms-controller ms-for ms-widget ms-effect ms-if   ...
avalon.directive('if', {
    priority: 6,
    parse: function (cur, pre, binding) {
        var hasEffect = pre.props['ms-effect']
        var replaceHolder = {
            nodeType: 8, 
            order:'ms-if',
            directive: 'if', 
            type: '#comment', 
            nodeValue: 'ms-if'
        }
        if (hasEffect) {
            replaceHolder['ms-effect'] = avalon.parseExpr(hasEffect)
        }
        pre.$prepend = (pre.$prepend || '') + 'var varIf = ' + avalon.parseExpr(binding) +
                "\nif(varIf){\n"
        var old = pre.$append || ''
        pre.$append = '}else{\n\n' +
                'vnodes.push(' + stringify(replaceHolder) + ')\n}' + old
    },
    diff: function (cur, pre, steps) {
        cur.wid = cur.wid || true
        cur.dom = pre.dom
        if (pre.pre) {
            cur.pre = pre.pre
        }
        if (cur.nodeType !== pre.nodeType) {
            cur.steps = steps
            if (cur.nodeType === 8) {
                cur['ms-effect'] = pre['ms-effect']
                cur.pre = pre
            } else if (cur.pre) {
                cur.skipContent = true
                pre.children = cur.pre.children
                delete cur.pre
            }
            update(cur, this.update, steps, 'if')
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
                    for (var prop in vnode) {//如果一开始是隐藏,那么事件会没有绑上
                        if (prop.indexOf('ms-on') === 0) {
                            var fn = vnode[prop]
                            if (typeof fn === 'function') {
                                element._ms_context_ = vnode.vmodel
                                avalon.bind(element, prop.split('-')[2], fn)
                            }
                        }
                    }

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
                        delete vnode['ms-effect']
                        //去掉注释节点临时添加的ms-effect
                        parent.replaceChild(comment, node)
                    }
                })
            }
        }
    }
})

