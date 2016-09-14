/* 
 * 组件存在
 * 两个模板, self template与slot template
 * 两份数据, defaults data与top vmodel data
 * 首先,我们使用Object.keys得到defaults data的所有键名data1
 * 然后对slot template的render进行正则,获得top vmodel data中用到的变量data2
 * 然后将data1与data2构建成widget vm
 * 
 */


var update = require('../_update')
var initComponent = require('./init')
var disposeComponent = require('./dispose')

avalon._disposeComponent = disposeComponent

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
        copy.vmodel = '__vmodel__'
        copy.local = '__local__'
    },
    diff: function (copy, src, name, copyList, srcList, index) {
        var data = copy[name]
        //是否为对象
        if (Object(data) !== data) {
            return replaceComment.apply(this, arguments)
        }
        data = data.$model || data//安全的遍历VBscript
        if (Array.isArray(data)) {//转换成对象
            var temp = {}
            data.forEach(function (el) {
                el && avalon.shadowCopy(temp, el)
            })
            data = temp
        }
        //有三个地方可以设置is, 标签名, 属性, 配置对象
        var maybeIs = /^ms\-/.test(src.nodeName) ? src.nodeName : src.props.is
        var is = maybeIs || data.is

        copy.props.is = data.is = is
        //src.vmodel = copy.vmodel

        var vmName = 'component-vm:' + is
        var comVm = src[vmName]
        if (comVm) { //是否初始化
            var isNeedUpdateData = !!avalon.scopes[comVm.$id]
            if (isNeedUpdateData) {
                var topData = copy.vmodel.$model
                var oldSlot = src['component-diff:' + is]
                var newSlot = {}
                for (var i in oldSlot) {
                    newSlot[i] = topData[i]
                }
                var isSameData = avalon._deepEqual(src.local, copy.local)
                if (isSameData) {
                    var oldData = {}
                    for (var i in data) {
                        oldData[i] = comVm.$model[i]
                    }
                    isSameData = avalon._deepEqual(oldData, data)
                    if (isSameData) {
                        isSameData = avalon._deepEqual(oldSlot, newSlot)
                    }
                }
                if (!isSameData) {
                    var hash = comVm.$hashcode
                    comVm.$hashcode = false //防止视图刷新
                    //更新数据
                    for (var i in data) {
                        comVm[i] = data[i]
                    }
                    for (var i in newSlot) {
                        comVm[i] = newSlot[i]
                    }
                    comVm.$hashcode = hash
                } else {
                    return (copyList[index] = {})
                }
            }
        } else {
            comVm = initComponent(copy, data)
            if (comVm) {
                src[vmName] = comVm

            } else {
                return replaceComment.apply(this, arguments)
            }
        }
        var vtree = comVm.$render(comVm, copy.local)
        var component = vtree[0]
        if (component && isComponentReady(component)) {
            Array(
                    'component-ready:' + is,
                    'dom', 'dynamic'
                    ).forEach(function (name) {
                component[name] = src[name]
            })
           
            component['component-diff:' + is] = copy.diffData || newSlot
            
            component[vmName] = comVm
            component.local = copy.local
            component.vmodel = copy.vmodel
            copyList[index] = component
            // 如果与ms-if配合使用, 会跑这分支
            if (src.comment && src.nodeValue) {
                component.dom = src.comment
            }
            if (src.nodeName !== component.nodeName) {
                srcList[index] = component
                update(component, this.mountComponent)
            } else {
                update(component, this.updateComponent)
            }
        } else {
            replaceComment.apply(this, arguments)
        }
    },
    replaceCachedComponent: function (dom, vdom, parent) {
        var com = vdom.com
        parent.replaceChild(com, dom)
        vdom.dom = com
        delete vdom.com
    },
    mountComment: function (dom, vdom, parent) {
        var comment = document.createComment(vdom.nodeValue)
        vdom.dom = comment
        parent.replaceChild(comment, dom)
    },
    updateComponent: function (dom, vdom) {
        var vm = vdom["component-vm:" + vdom.props.is]
        var viewChangeObservers = vm.$events.onViewChange
        if (viewChangeObservers && viewChangeObservers.length) {
            update(vdom, viewChangeHandle, 'afterChange')
        }
    },
    mountComponent: function (dom, vdom, parent) {
        delete vdom.dom
        var com = avalon.vdom(vdom, 'toDOM')

        var is = vdom.props.is
        var vm = vdom['component-vm:' + is]
        vm.$fire('onInit', {
            type: 'init',
            vmodel: vm,
            is: is
        })

        parent.replaceChild(com, dom)

        vdom.dom = vm.$element = com
        com.vtree = [vdom]
        disposeComponent(com)
        vdom['component-ready:' + is] = true
        //--------------
        avalon.scopes[vm.$id] = {
            vmodel: vm,
            top: vdom.vmodel,
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
            vdom[ 'component-html:' + is] = avalon.vdom(vdom, 'toHTML')
        }, 'afterChange')
    }
})

function replaceComment(copy, src, name, copyList, srcList, index) {
    if (src.nodeName === '#comment')
        return
    src.nodeName = '#comment'
    src.nodeValue = 'unresolved component placeholder'
    copyList[index] = src
    update(src, this.mountComment)
}

function viewChangeHandle(dom, vdom) {
    var is = vdom.props.is
    var vm = vdom['component-vm:' + is]
    var html = 'component-html:' + is
    var preHTML = vdom[html]
    var curHTML = avalon.vdom(vdom, 'toHTML')
    if (preHTML !== curHTML) {
        vdom[html] = curHTML
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
        if (el.nodeName === '#comment') {
            if (el.nodeValue === 'unresolved component placeholder') {
                throw 'unresolved'
            }
        } else if (el.children) {
            hasUnresolvedComponent(el)
        }
    })
}
