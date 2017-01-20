import { avalon, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { toDOM } from '../renders/toDOM'
import { Compiler } from '../vtree/Compiler'
import { HighConvertor } from '../vtree/HighConvertor'
import { diffSlots } from '../vtree/diff'
import { createGetter } from '../parser/index'


var legalTags = { wbr: 1, xmp: 1, template: 1 }
var events = 'onInit,onReady,onViewChange,onDispose,onEnter,onLeave'
var componentEvents = avalon.oneObject(events)

function toObject(value) {
    var value = platform.toJson(value)
    if (Array.isArray(value)) {
        var v = {}
        value.forEach(function(el) {
            el && avalon.shadowCopy(v, el)
        })
        return v
    }
    return value
}
var componentQueue = []
avalon.directive('widget', {

    priority: 4,
    deep: true,
    init: function(oldVal, vdom, newVdom, afterCb) {
        //cached属性必须定义在组件容器里面,不是template中
        this.cacheVm = !!newVdom.props.cached
            //将数组形式转换为对象形式
        var value = toObject(oldVal)

        var is = newVdom.props.is || value.is
        this.is = is
        var component = avalon.components[is]
            //如果组件还没有注册，那么将原元素变成一个占位用的注释节点
        if (!component) {
            this.readyState = 0
            newVdom.nodeName = '#comment'
            newVdom.nodeValue = 'unresolved component placeholder'
            newVdom.dom = newVdom.props = null
            avalon.Array.ensure(componentQueue, this)
            return
        }

        this.readyState = 1

        var id = value.id || value.$id,
            innerRender, comVm
        var fromCache = avalon.vmodels[id]

        if (fromCache) {
            comVm = fromCache
            this.comVm = comVm
            innerRender = comVm.$render

        } else {
            comVm = createComponentVm(component, value, is)
            fireComponentHook(newVdom.vm, vdom, 'Init')
            this.comVm = comVm
            var vnodes = new HighConvertor(component.template)
            innerRender = new Compiler(vnodes, comVm, true)
            if (component.soleSlot) {
                this.getter = this.getter || createGetter('@' + component.soleSlot)
                this.slots = innerRender.slots.defaults = { dynamic: true, nodeName: '#text', nodeValue: this.getter(comVm) || '' }
            } else {
                this.slots = newVdom.slots
            }
 
            var nodes = innerRender.fork(comVm, newVdom.locale)
            innerRender.root = nodes[0]
            delete vdom.dom
        }

        //当组件生成出来，slot元素应该在它应在的位置，然后旧的组件也有slot元素 

        this.vdom = vdom
        var root = innerRender.root

        Array('nodeName', 'vtype', 'props', 'children', 'dom').forEach(function(prop) {
            newVdom[prop] = vdom[prop] = root[prop]
        })


        afterCb.push(function() {
            comVm.$element = vdom.dom
            root.dom = vdom.dom
            if (fromCache) {
                fireComponentHook(comVm, vdom, 'Enter')
            } else {
                fireComponentHook(comVm, vdom, 'Ready')
            }
        })

    },
    diff: function(oldVal, newVal, vdom, newVdom) {
        diffSlots(this.slots, newVdom.slots)

        if (cssDiff.call(this, oldVal, newVal)) {
            if (!this.readyState)
                this.readyState = 0
            this.delay = false
            return true
        }
        this.delay = true
        console.log('diff return false')
    },

    update: function(value, vdom, newVdom, afterCb) {
        // this.oldValue = value //★★防止递归
        this.value = avalon.mix(true, {}, value)
        switch (this.readyState) {
            case 0:
                this.init(value, vdom, newVdom, afterCb)
                break

            default:
                this.readyState++;

                var comVm = this.comVm
                avalon.viewChanging = true
                avalon.transaction(function() {
                    for (var i in value) {
                        if (comVm.hasOwnProperty(i)) {
                            comVm[i] = value[i]
                        }
                    }
                })

                //要保证要先触发孩子的ViewChange 然后再到它自己的ViewChange
                fireComponentHook(comVm, vdom, 'ViewChange')
                delete avalon.viewChanging
                break
        }
    },
    beforeDispose: function() {
        var comVm = this.comVm
        console.log(comVm, 'dispose')
            //        if (!this.cacheVm) {
            //            fireComponentHook(comVm, this.node, 'Dispose')
            //            comVm.$hashcode = false
            //            delete avalon.vmodels[comVm.$id]
            //            this.innerRender && this.innerRender.dispose()
            //        } else {
            //            fireComponentHook(comVm, this.node, 'Leave')
            //        }
    },
})



function fireComponentHook(vm, vdom, name) {
    var list = vm.$events['on' + name]
    if (list) {
        list.forEach(function(el) {
            el.callback.call(vm, {
                type: name.toLowerCase(),
                target: vdom.dom,
                vmodel: vm
            })
        })
    }
}


export function createComponentVm(component, value, is) {
    var hooks = []
    var defaults = component.defaults
    collectHooks(defaults, hooks)
    collectHooks(value, hooks)
    var obj = {}
    for (var i in defaults) {
        var val = value[i]
        if (val == null) {
            obj[i] = defaults[i]
        } else {
            obj[i] = val
        }
    }
    obj.$id = value.id || value.$id || avalon.makeHashCode(is)
    delete obj.id
    var def = avalon.mix(true, {}, obj)
    var vm = avalon.define(def)
    hooks.forEach(function(el) {
        vm.$watch(el.type, el.cb)
    })
    return vm
}

function collectHooks(a, list) {
    for (var i in a) {
        if (componentEvents[i]) {
            if (typeof a[i] === 'function' &&
                i.indexOf('on') === 0) {
                list.unshift({
                    type: i,
                    cb: a[i]
                })
            }
            //delete a[i] 这里不能删除,会导致再次切换时没有onReady
        }
    }
}

function resetParentChildren(nodes, arr) {
    var dir = arr && arr[0] && arr[0].forDir
    if (dir) {
        dir.parentChildren = nodes
    }
}



avalon.components = {}
avalon.component = function(name, component) {
    /**
     * template: string
     * defaults: object
     * soleSlot: string
     */
    avalon.components[name] = component
    component.extend = function(child) {
        var obj = avalon.mix(true, {}, this.defaults, child)
        return avalon.component(name, obj)
    }
    for (var el, i = 0; el = componentQueue[i]; i++) {
        if (el.is === name) {
            componentQueue.splice(i, 1)
            el.reInit = true
            delete el.value
            el.update()
            i--;
        }
    }
    return component
}