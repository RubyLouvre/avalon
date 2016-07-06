var update = require('./_update')
var reconcile = require('../strategy/reconcile')
var createComponent = require('../component/create')

avalon.component = function (name, definition) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    if (!avalon.components[name]) {
        avalon.components[name] = definition
    }//这里没有返回值
}
avalon.directive('widget', {
    parse: function (copy, src, binding) {
        src.wid = src.wid || avalon.makeHashCode('w')
        //将渲染函数的某一部分存起来,渲在c方法中转换为函数
        copy[binding.name] = avalon.parseExpr(binding)
        copy.vmodel = '__vmodel__'
        copy.local = '__local__'
    },
    define: function () {
        return avalon.mediatorFactory.apply(this, arguments)
    },
    diff: function (copy, src, name) {
        var a = copy[name]
        var p = src[name]
        src.vmodel = copy.vmodel
        src.local = copy.local
        src.copy = copy
        if (Object(a) === a) {
            a = a.$model || a//安全的遍历VBscript
            if (Array.isArray(a)) {//转换成对象
                a = avalon.mix.apply({}, a)
            }
            var is = a.is || src.props.is
            if (!src[is + "-vm"]) {
                if (!createComponent(src, copy, is)) {
                    //替换成注释节点
                    update(src, this.mountComment)
                    return
                }
            }
            var renderComponent = src[is + '-vm'].$render
            var newTree = renderComponent(src[is + '-vm'], src.local)

            var componentRoot = newTree[0]
            if (componentRoot && isComponentReady(componentRoot)) {
                if (src[is + '-mount']) {//update
                    updateCopy(copy, componentRoot)
                    update(src, this.updateComponent)
                } else {//mount
                    src.copy = copy
                    src.newCopy = componentRoot
                    update(src, this.mountComponent)
                }
            } else {
                update(src, this.mountComment)
            }

        }
    },
    mountComment: function (dom, vdom, parent) {
        var copy = vdom.copy
        copy.nodeType = vdom.nodeType = 8
        copy.nodeValue = vdom.nodeType = 'unresolved component placeholder'
        copy.children = []
        var comment = document.createComment(copy.nodeValue)
        vdom.dom = comment
        parent.replaceChild(comment, dom)
    },
    updateComponent: function (dom, vdom) {
        var is = vdom.is
        var vm = vdom[is + '-vm']
        var viewChangeObservers = vm.$events.onViewChange
        if (viewChangeObservers && viewChangeObservers.length) {
            update(vdom, viewChangeHandle, 'afterChange')
        }
    },
    
    mountComponent: function (dom, vdom, parent) {
        var is = vdom.is
        var vm = vdom[is + '-vm']
        var copy = vdom.copy
        var newCopy = vdom.newCopy
        delete vdom.newCopy
       
        var scope = avalon.scopes[vm.$id]  
        if (scope && scope.vmodel) {  
            var com = scope.vmodel.$element
            newCopy = com.vtree[0]
            updateCopy(vdom, newCopy)
            parent.replaceChild(com, dom)
            com.vtree = [vdom]
            vdom[is + '-vm'] = scope.vmodel
            vdom[is + '-mount'] = true
            return
        }
        
        //更新原始虚拟DOM树
        updateCopy(copy, newCopy )  
        var vtree = vdom[is + '-vtree']
        //更新另一个刷数据用的虚拟DOM树
        updateCopy(vdom, vtree[0] )
        var com = avalon.vdomAdaptor(vdom, 'toDOM')
        vm.$fire('onInit', {
            type: 'init',
            vmodel: vm,
            is: is
        })
        reconcile([com], [vdom])
        parent.replaceChild(com, dom)
        vdom.dom = com
        avalon.onComponentDispose(com)
       
        vdom[is + '-mount'] = true
        //--------------
        vm.$element = com
        com.vtree = [vdom]
        avalon.scopes[vm.$id] = {
            vmodel: vm,
            isMount: 2,
            local: vdom.local
        }
        //--------------
        update(vdom, function () {
            vm.$fire('onReady', {
                type: 'ready',
                target: com,
                vmodel: vm,
                is: is
            })
        }, 'afterChange')

        update(vdom, function () {
            vdom[is + '-html'] = avalon.vdomAdaptor(vdom, 'toHTML')
        }, 'afterChange')

    }
})

function updateCopy(copy, newCopy) {
    copy.children = []
    avalon.mix(copy, newCopy)
    copy.local = copy.isVoidTag = copy.skipContent = 0
}

function viewChangeHandle(dom, vdom) {
    var is = vdom.is
    var vm = vdom[is + '-vm']
    var preHTML = vdom[is + '-html']
    var curHTML = avalon.vdomAdaptor(vdom, 'toHTML')
    if (preHTML !== curHTML) {
        vdom[is + '-html'] = curHTML
        vm.$fire('onViewChange', {
            type: 'viewchange',
            target: dom,
            vmodel: vm,
            is: is
        })
    }
}



function isComponentReady(vnode) {
    var isReady = true
    try {
        hasUnresolvedComponent(vnode)
    } catch (e) {
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