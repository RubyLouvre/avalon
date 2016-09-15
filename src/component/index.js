

var update = require('../directives/_update')
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
            return replaceComment(copy, src)
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
        copy.props.is = is
        var vmodel = copy.vmodel
        var local = copy.local
        var vmName = 'component-vm:' + is
        var slotName = 'component-slot:' + is
        var comVm = src[vmName]
        var spath = avalon.spath
        if (comVm) { //如果虚拟DOM上存在对应的component-vm属性,说明已经初始化
            var topData = vmodel.$model
            var oldSlot = src[slotName]
            var newSlot = {}
            for (var i in oldSlot) {
                newSlot[i] = topData[i]
            }
            var isSameData = avalon._deepEqual(src.local, local)
            if (isSameData) {
                delete data.is
                delete data.id
                var oldData = {}
                for (var i in data) {
                    oldData[i] = comVm.$model[i]
                }
                isSameData = avalon._deepEqual(oldData, data)
                if (isSameData) {
                    isSameData = avalon._deepEqual(oldSlot, newSlot)
                    if (!isSameData) {
                        avalon.log('slot数据不一致,更新', is, '组件')
                    }
                } else {
                    avalon.log('ms-widget数据不一致,更新', is, '组件')
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
                //强制更新组件的所有指令
                avalon.spath = void 0
                comVm.$hashcode = hash
            } else {
                if (!!avalon.scopes[comVm.$id]) {
                    return (copyList[index] = {})
                }
            }

        } else {
            comVm = initComponent(copy, data)
            if (!comVm) {
                return replaceComment(copy, src)
            }
        }
        //生成组件的虚拟DOM
        var vtree = comVm.$render(comVm, local)
        var component = vtree[0]
        copyList[index] = component
        avalon.spath = spath
        // 如果与ms-if配合使用, 会跑这分支
        if (src.comment && src.nodeValue) {
            component.dom = src.comment
        } else {
            component.dom = src.dom
        }
        component[slotName] = src[slotName] = copy.slotData || newSlot
        if (src.nodeName !== component.nodeName) {
            component[vmName] = comVm
            component.local = local
            component.vmodel = vmodel
            srcList[index] = component

            if (!avalon.scopes[comVm.$id]) {
                comVm.$fire('onInit', {
                    type: 'init',
                    vmodel: comVm,
                    is: is
                })
                update(component, function (dom, vdom, parent) {
                    if (isComponentReady(vdom)) {
                        comVm.$fire('onReady', {
                            type: 'ready',
                            target: dom,
                            vmodel: comVm,
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
            var list = comVm.$events.onViewChange
            if (list && list.length) {
                update(src, viewChangeHandle, 'afterChange')
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
        var is = vdom.props.is
        var vm = vdom['component-vm:' + is]
        var com = avalon.vdom(vdom, 'toDOM')
        parent.replaceChild(com, dom)

        vdom.dom = vm.$element = com
        com.vtree = [vdom]
        avalon.scopes[vm.$id] = {
            vmodel: vm,
            local: vdom.local
        }
        disposeComponent(com)

    }
})

function viewChangeHandle(dom, vdom) {
    var is = vdom.props.is
    var vm = vdom['component-vm:' + is]
    //数据变动,界面肯定变动,因此不再需要比较innerHTML
    var event = {
        type: 'viewchange',
        target: dom,
        vmodel: vm,
        is: is
    }
    vm.$fire('onViewChange', event)
    var parent = vdom.vmodel
    if (parent && parent !== vm) {
        parent.$fire('onViewChange', event)
    }
}
function replaceComment(copy, src) {
    for (var i in copy) {
        delete copy[i]
    }
    src.nodeName = copy.nodeName = '#comment'
    src.nodeValue = copy.nodeValue = unresolvedText
    return update(src, mountComment)
}
function mountComment(dom, vdom, parent) {
    var comment = document.createComment(vdom.nodeValue)
    vdom.dom = comment
    parent.replaceChild(comment, dom)
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
var unresolvedText = 'unresolved component placeholder'
function hasUnresolvedComponent(vnode) {
    vnode.children.forEach(function (el) {
        if (el.nodeName === '#comment') {
            if (el.nodeValue === unresolvedText) {
                throw 'unresolved'
            }
        } else if (el.children) {
            hasUnresolvedComponent(el)
        }
    })
}
//================

avalon._deepEqual = deepEqual

var deepDetectType = {
    object: 1,
    array: 1,
}
var toStringType = {
    date: 1,
    regexp: 1,
    'function': 1
}
var type = avalon.type
function deepEqual(a, b, m) {
    if (sameValue(a, b)) {//防止出现NaN的情况
        return true
    }
    var atype = type(a)
    var btype = type(b)

    if (atype !== btype) {//如果类型不相同
        return false
    } else if (toStringType[atype]) {
        return a + '' === b + ''
    } else if (deepDetectType[atype]) {
        return objectEqual(a, b, m)
    } else {
        return false
    }
}

var sameValue = Object.is || function (a, b) {
    if (a === b)
        return a !== 0 || 1 / a === 1 / b
    return a !== a && b !== b
}


function enumerable(a) {
    var res = []
    for (var key in a)
        res.push(key)
    return res
}

function iterableEqual(a, b) {
    if (a.length !== b.length)
        return false

    var i = 0
    var match = true

    for (; i < a.length; i++) {
        if (a[i] !== b[i]) {
            match = false
            break
        }
    }

    return match
}

function isValue(a) {
    return a !== null && a !== undefined
}

function objectEqual(a, b, m) {
    if (!isValue(a) || !isValue(b)) {
        return false
    }

    if (a.prototype !== b.prototype) {
        return false
    }

    var i
    if (m) {
        for (i = 0; i < m.length; i++) {
            if ((m[i][0] === a && m[i][1] === b)
                    || (m[i][0] === b && m[i][1] === a)) {
                return true
            }
        }
    } else {
        m = []
    }

    try {
        var ka = enumerable(a)
        var kb = enumerable(b)
    } catch (ex) {
        return false
    }

    ka.sort()
    kb.sort()

    if (!iterableEqual(ka, kb)) {
        return false
    }

    m.push([a, b])

    var key
    for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i]
        if (!deepEqual(a[key], b[key], m)) {
            return false
        }
    }

    return true
}
