var disposeDetectStrategy = require('../component/dispose.modern')
var patch = require('../strategy/patch')
var update = require('./_update')

//插入点机制,组件的模板中有一些slot元素,用于等待被外面的元素替代
var dir = avalon.directive('widget', {
    priority: 4,
    parse: function (cur, pre, binding) {

        var wid = pre.props.wid || avalon.makeHashCode('w')

        cur.wid = avalon.quote(wid)
        cur.directive = 'widget'
        cur.template = pre.template
        cur.children = '[]'
        cur[binding.name] = avalon.parseExpr(binding)

        var old = pre.$append || ''
        pre.$append = [
            'var il1492 = vnodes.length - 1',
            'var el1492 = vnodes[il1492]',
            'if(el1492.nodeType === 1){',
            'el1492.local = __local__',
            'el1492.vmodel = __vmodel__',
            'avalon.component(el1492, vnodes, il1492,' + cur.wid + ')',
            '}'
        ].join('\n ') + old
    },
    define: function () {
        return avalon.mediatorFactory.apply(this, arguments)
    },
    diff: function (cur, pre, steps) {
        var wid = cur.wid
        var scope = avalon.scopes[wid]
        if (cur.nodeType === 8) {
            steps.count += 1
            cur.change = [this.replaceByComment]
        } else if (scope && scope.renderCount === 1) {
            //https://github.com/RubyLouvre/avalon/issues/1390
            //当第一次渲染组件时,当组件的儿子为元素,而xmp容器里面只有文本时,就会出错
            scope.renderCount = 2
            pre.children = []
            cur.steps = steps
            fixRepeatAction(cur.children)
            update(cur, this.replaceByComponent, steps, 'widget')
            function fireReady(dom, vnode) {
                cur.vmodel.$fire('onReady', {
                    type: 'ready',
                    target: dom,
                    wid: wid,
                    vmodel: vnode.vmodel
                })

            }

            update(cur, fireReady, steps, 'widget', 'afterChange')
        } else {
            scope.renderCount++
            var needUpdate = !cur.diff || cur.diff(cur, pre, steps)
            cur.skipContent = !needUpdate
            if (pre.wid && cur.wid !== pre.wid) {

                delete avalon.scopes[pre.wid]
                delete avalon.vmodels[pre.wid]
            }

            var viewChangeObservers = cur.vmodel.$events.onViewChange
            if (viewChangeObservers && viewChangeObservers.length) {
                steps.count += 1
                cur.afterChange = [function (dom, vnode) {
                        var preHTML = pre.outerHTML
                        var curHTML = cur.outerHTML ||
                                (cur.outerHTML = avalon.vdomAdaptor(cur, 'toHTML'))
                        if (preHTML !== curHTML) {
                            cur.vmodel.$fire('onViewChange', {
                                type: 'viewchange',
                                target: dom,
                                wid: wid,
                                vmodel: vnode.vmodel
                            })
                        }
                    }]
            }

        }
    },
    addDisposeMonitor: function (dom) {

        disposeDetectStrategy.byRewritePrototype(dom)

    },
    replaceByComment: function (dom, node, parent) {
        var comment = document.createComment(node.nodeValue)
        if (dom) {
            parent.replaceChild(comment, dom)
        } else {
            parent.appendChild(comment)
        }
    },
    replaceByComponent: function (dom, vdom, parent) {

        var com = avalon.vdomAdaptor(vdom, 'toDOM')
        vdom.ouerHTML = avalon.vdomAdaptor(vdom, 'toHTML')

        if (dom) {
            parent.replaceChild(com, dom)
        } else {
            parent.appendChild(com)
        }

        patch([com], [vdom], parent, vdom.steps)

        var vm = vdom.vmodel
        var scope = avalon.scopes[vm.$id]

        scope.dom = com
        vm.$element = com
        com.vtree = [vdom]

        dir.addDisposeMonitor(com)

        return false
    }
})

function fixRepeatAction(nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        if (el.directive === 'for') {
            el.fixAction = true
        }
        if (el.children) {
            fixRepeatAction(el.children)
        }
    }
}
