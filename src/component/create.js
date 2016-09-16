
var skipArray = require('../vmodel/parts/skipArray')
var rprops = /__vmodel__\.([\$\w\_]+)/g
var rguide = /(^|[^\w\u00c0-\uFFFF_])(@|##)(?=[$\w])/g
var unresolvedText = 'unresolved component placeholder'
var componentEvents = {onInit: 1, onReady: 1, onViewChange: 1, onDispose: 1}

avalon.createComponent = function (fn, copy, vmodel, local) {
    var data = fn()
    var comment = [{
            nodeName: '#comment',
            nodeValue: unresolvedText,
            afterChange: [avalon.directives.widget.mountComment]
        }]
    if (Object(data) !== data) {
        return comment
    }
    data = data.$model || data//安全的遍历VBscript
    if (Array.isArray(data)) {//转换成对象
        var temp = {}
        data.forEach(function (el) {
            el && avalon.shadowCopy(temp, el)
        })
        data = temp
    }

    var maybeIs = /^ms\-/.test(copy.nodeName) ? copy.nodeName : copy.props.is
    var is = maybeIs || data.is
    copy.props.is = is
    var id = data.id || data.$id
    if (local.$key) {
        avalon.warn('组件在ms-for循环内部必须在ms-widget配置对象中指定不重复的id\n' +
                '如 ms-widget="{id:\'btn\'+$index}')
        return comment
    }
    
    if (!id) {//逼不得已就使用内置的随机UUID
        id = copy.props.wid
    }
    var scope = avalon.scopes[id]
    if (scope) {
        if (!scope.isComponent) {
            avalon.error('已经有vm.$id为' + id + '了')
        }
        var vm = scope.vmodel
        if (!updateData(data, scope, vmodel, local)) {
            return [{nodeName: 'x'}]
        } else {
            return vm.$render(vm, scope.local)
        }
    } else {
        var template = copy.template
        var definition = avalon.components[is]
        //如果连组件的定义都没有加载回来,应该立即返回 
        /* istanbul ignore if */
        if (!definition) {
            avalon.warn(is + '组件还没有加载')
            return comment
        }
        var templateID = 'temp:' + template
        if (!avalon.caches[templateID]) {
            var shell = avalon.lexer(template)
            avalon.variant(shell)
            shell[0].props.is = is
            avalon.caches[templateID] = avalon.render(shell, copy.local)
        }
        //生成内部的渲染函数
        if (!definition.render) {
            var vtree = avalon.lexer(definition.template.trim())
            if (vtree.length > 1) {
                avalon.error('组件必须用一个元素包起来')
            }
            var soleSlot = definition.soleSlot
            replaceSlot(vtree, soleSlot)
            avalon.variant(vtree)
            definition.render = avalon.render(vtree)
        }
        var hooks = {}//收集生命周期钩子
        for (var i in componentEvents) {
            hooks[i] = []
            var fn = data[i]
            if (typeof fn === 'function') {
                hooks[i].push(fn)
            }
            delete data[i]
        }
        var defaults = avalon.mix(true, {}, definition.defaults)
        for (var i in componentEvents) {
            var fn = defaults[i]
            if (typeof fn === 'function') {
                hooks[i].push(fn)
            }
            delete defaults[i]
        }
        var topVm = vmodel.$model
        for (var i in defaults) {
            if (!(i in data)) {
                if (!skipArray[i]) {
                    data[i] = defaults[i]
                }
            }
        }
        delete data.is
        delete data.id
        var slotData = {}
        template.replace(rguide, '$1__vmodel__.')
                .replace(rprops, function (_, prop) {
                    if (!(prop in data)) {
                        data[prop] = topVm[prop]
                        slotData[prop] = topVm[prop]
                    }
                    return _
                })
        data.$id = id
        var vm = avalon.define(data)
        avalon.scopes[id] = {
            vm: vm,
            copy: copy,
            slotData: slotData
        }
        //绑定组件的生命周期钩子
        for (var e in componentEvents) {
            hooks[e].forEach(function (fn) {
                vm.$watch(e, fn)
            })
        }

        //生成最终的组件渲染函数
        vm.$render = getRender(
                avalon.caches[templateID],
                definition.render,
                definition.soleSlot
                )
        return vm.$render(vm, copy)
    }
}


function updateData(data, scope, vmodel, local) {
    var vm = scope.vmodel
    var topData = vmodel.$model
    var oldSlot = scope.slotData
    var newSlot = {}
    for (var i in oldSlot) {
        newSlot[i] = topData[i]
    }
    var isSameData = avalon._deepEqual(scope.local, local)
    var is = data.is
    if (isSameData) {
        delete data.is
        delete data.id
        var oldData = {}
        for (var i in data) {
            oldData[i] = vm.$model[i]
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
        var hash = vm.$hashcode
        vm.$hashcode = false //防止视图刷新
        //更新数据
        for (var i in data) {
            vm[i] = data[i]
        }
        for (var i in newSlot) {
            vm[i] = newSlot[i]
        }
        scope.local = local
        scope.slotData = newSlot
        //强制更新组件的所有指令
        avalon.spath = void 0
        vm.$hashcode = hash
    } else {
        return false
    }
}

function getRender(slotRender, defineRender, soleSlot) {
    return  function (vmodel, local) {
        var shell = slotRender(vmodel, local)
        var shellRoot = shell[0]
        var vtree = defineRender(vmodel, local);
        var component = vtree[0]
        //处理diff
        for (var i in shellRoot) {
            if (i !== 'children' && i !== 'nodeName') {
                if (i === 'props') {
                    avalon.mix(component.props, shellRoot.props)
                } else {
                    component[i] = shellRoot[i]
                }
            }
        }

        var slots = collectSlots(shellRoot, soleSlot)
        if (soleSlot && (!slots[soleSlot] || !slots[soleSlot].length)) {
            slots[soleSlot] = [{
                    nodeName: '#text',
                    nodeValue: vmodel[soleSlot],
                    dynamic: true
                }]
        }
        insertSlots(vtree, slots)
        if (isComponentReady(component)) {
            component.props.wid = vmodel.$id
            component.vmodel = vmodel
            component.copy = local
            component.dynamic = {}
            component['ms-widget'] = vmodel
            delete component.skipContent
            return vtree
        } else {
            return  [{
                    nodeName: '#comment',
                    nodeValue: unresolvedText,
                    afterChange: [avalon.directives.widget.mountComment]
                }]
        }
    }
}

function replaceSlot(vtree, slotName) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeName === 'slot') {
            var name = el.props.name || slotName
            vtree.splice(i, 1, {
                nodeName: '#comment',
                nodeValue: 'slot:' + name,
                dynamic: true,
                type: name
            }, {
                nodeName: '#comment',
                nodeValue: 'slot-end:'
            })
            i++
        } else if (el.children) {
            replaceSlot(el.children, slotName)
        }
    }
}

function insertSlots(vtree, slots) {
    for (var i = 0, el; el = vtree[i]; i++) {
        if (el.nodeName === '#comment' && slots[el.type]) {
            var args = [i + 1, 0].concat(slots[el.type])
            vtree.splice.apply(vtree, args)
            i += slots[el.type].length
        } else if (el.children) {
            insertSlots(el.children, slots)
        }
    }
}

function collectSlots(node, soleSlot) {
    var slots = {}
    if (soleSlot) {
        slots[soleSlot] = node.children
        slots.__sole__ = soleSlot
    } else {
        node.children.forEach(function (el, i) {
            var name = el.props && el.props.slot
            if (!name)
                return
            if (el.forExpr) {
                slots[name] = node.children.slice(i, i + 2)
            } else {
                if (Array.isArray(slots[name])) {
                    slots[name].push(el)
                } else {
                    slots[name] = [el]
                }
            }
        })
    }
    return slots
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
            if (el.nodeValue === unresolvedText) {
                throw 'unresolved'
            }
        } else if (el.children) {
            hasUnresolvedComponent(el)
        }
    })
}