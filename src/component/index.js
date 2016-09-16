

var update = require('../directives/_update')
require('./create')
avalon._deepEqual = require('./deepEqual')
avalon._disposeComponent = require('./dispose')

avalon.component = function (name, definition) {
    //这是定义组件的分支,并将列队中的同类型对象移除
    /* istanbul ignore if */
    if (!avalon.components[name]) {
        avalon.components[name] = definition
    }//这里没有返回值
}
avalon.directive('widget', {
    priority: 4,
    parse: function (copy, src, binding) {
        src.props.wid = src.props.wid || avalon.makeHashCode('w')
        //将渲染函数的某一部分存起来,渲在c方法中转换为函数
        copy[binding.name] = avalon.parseExpr(binding)
        copy.template = src.template

    },
    diff: function (copy, src, name, copyList, srcList, index) {
        var component = copy
        // 如果与ms-if配合使用, 会跑这分支
        if (src.comment && src.nodeValue) {
            component.dom = src.comment
        } else {
            component.dom = src.dom
        }
        var vmodel = component[name]
        
        if (src.nodeName !== component.nodeName) {
            var is = component.props.is
            srcList[index] = component
            var scope = avalon.scopes[vmodel.$id]
            if (scope && !scope.init) {
                vmodel.$fire('onInit', {
                    type: 'init',
                    vmodel: vmodel,
                    is: is
                })
                scope.init = 1
                update(component, function (dom, vdom, parent) {
                    if (isComponentReady(vdom)) {
                        vmodel.$fire('onReady', {
                            type: 'ready',
                            target: dom,
                            vmodel: vmodel,
                            is: is
                        })
                    } else {
                        replaceComment({}, vdom)
                    }
                }, 'afterChange')
            }
            update(component, this.mountComponent)

        } else {
            //为原元素绑定afterChange钩子
            var list = vmodel.$events.onViewChange
            if (list && list.length) {
                update(src, onViewChange, 'afterChange')
            }
        }
    },
    replaceCachedComponent: function (dom, vdom, parent) {
        var com = vdom.com
        parent.replaceChild(com, dom)
        vdom.dom = com
        delete vdom.com
    },
    mountComponent: function (dom, vdom, parent) {
        delete vdom.dom
        var vm = vdom.vmodel
        var com = avalon.vdom(vdom, 'toDOM')
        parent.replaceChild(com, dom)
        vdom.dom = vm.$element = com
        com.vtree = [vdom]
        avalon._disposeComponent(com)
    },
    mountComment: function (dom, vdom, parent) {
        vdom.nodeName = '#comment'
        vdom.nodeValue = 'unresolved component placeholder'
        var comment = document.createComment(vdom.nodeValue)
        vdom.dom = comment
        parent.replaceChild(comment, dom)
    }
})

function onViewChange(dom, vdom) {
    var is = vdom.props.is
    var vm = vdom.vmodel
    //数据变动,界面肯定变动,因此不再需要比较innerHTML
    var event = {
        type: 'viewchange',
        target: dom,
        vmodel: vm,
        is: is
    }
    vm.$fire('onViewChange', event)
}


