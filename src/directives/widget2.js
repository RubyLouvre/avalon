var update = require('./_update')
var reconcile = require('../strategy/reconcile')
var disposeDetectStrategy = require('../component/dispose.compact')
var createComponent = require('../component/create.compact')

avalon.component = function (name, definition) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    if (!avalon.components[name]) {
        avalon.components[name] = definition
    }//这里没有返回值
}
avalon.directive('widget', {
    parse: function (cur, pre, binding) {
        pre.wid = pre.wid || avalon.makeHashCode('w')
        //将渲染函数的某一部分存起来,渲在c方法中转换为函数
        cur[binding.name] = avalon.parseExpr(binding)
        cur.vmodel = '__vmodel__'
        cur.local = '__local__'
    },
    define: function () {
        return avalon.mediatorFactory.apply(this, arguments)
    },
    diff: function (cur, pre, name) {
        var a = cur[name]
        var p = pre[name]
        pre.vmodel = cur.vmodel
        pre.local = cur.local
        pre.cur = cur
        console.log("33333")
        if (Object(a) === a) {
            a = a.$model || a//安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            var is = a.is

            if (pre.is !== is || !pre[is + "-vm"]) {
                if (!createComponent(pre, cur, is)) {
                    //替换成注释节点
                    update(pre, this.mountComment)
                    return
                }
            }
            var renderComponent = pre[is + '-vm'].$render
            var newTree = renderComponent(pre[is + '-vm'], pre.local)[0]
            if (isComponentReady(newTree)) {
                cur.children = []
                delete cur.local
                delete cur.vmodel

                avalon.mix(cur, newTree)
                if (pre[is + '-mount']) {
                    console.log('updateComponent')
                    update(pre, this.updateComponent)
                } else {
                    update(pre, this.mountComponent)
                }
            } else {
                update(pre, this.mountComment)
            }

        }
    },
    mountComment: function (dom, vdom, parent) {
        var cur = vdom.cur
        cur.nodeType = vdom.nodeType = 8
        cur.nodeValue = vdom.nodeType = 'unresolved component placeholder'
        cur.children = []
        var comment = document.createComment(cur.nodeValue)
        vdom.dom = comment
        parent.replaceChild(comment, dom)
    },
    updateComponent: function (dom, vdom) {
        var is = vdom.is
        var vm = vdom[is + '-vm']
        var preHTML = vdom[is + '-html']
        var viewChangeObservers = vm.$events.onViewChange
        if (viewChangeObservers && viewChangeObservers.length) {
            update(vdom, function () {
                var curHTML = avalon.vdomAdaptor(vdom, 'toHTML')
                if (preHTML !== curHTML) {
                    vdom[is + '-html'] = curHTML
                    vm.$fire('onViewChange', {
                        type: 'viewchange',
                        target: dom,
                        vmodel: vm
                    })
                }
            }, 'afterChange')
        }
    },
    mountComponent: function (dom, vdom, parent) {
        var is = vdom.is
        var vtree = vdom[is + '-vtree']
        var componentRoot = vtree[0]
        delete vdom.skipContent
        delete vdom.cur
        var vm = vdom[is + '-vm']
        avalon.mix(vdom, componentRoot)

        vm.$fire('onInit', {
            type: 'init',
            vmodel: vm,
            componentName: is
        })

        var com = avalon.vdomAdaptor(vdom, 'toDOM')
        reconcile([com], [vdom])
        parent.replaceChild(com, dom)
        vdom.dom = com
        addDisposeMonitor(com)

        vdom[is + '-mount'] = true

        vdom[is + '-html'] = avalon.vdomAdaptor(vdom, 'toHTML')
        vm.$fire('onReady', {
            type: 'init',
            target: com,
            vmodel: vm,
            componentName: is
        })

    }
})

function addDisposeMonitor(dom) {
    if (window.chrome && window.MutationEvent) {
        disposeDetectStrategy.byMutationEvent(dom)
    } else if (avalon.modern && typeof window.Node === 'function') {
        disposeDetectStrategy.byRewritePrototype(dom)
    } else {
        disposeDetectStrategy.byPolling(dom)
    }
}

function isComponentReady(vnode) {
    var isReady = true
    try {
        hasUnresolvedComponent(vnode)
    } catch (e) {
        console.log(e)
        isReady = false
    }
    return isReady
}

function hasUnresolvedComponent(vnode) {
    vnode.children.forEach(function (el) {
        if (el.nodeType === 8) {
            if (el.nodeValue === 'unresolved component placeholder') {
                throw 'unresolved'
            }
        } else if (el.children) {
            hasUnresolvedComponent(el)
        }
    })
}