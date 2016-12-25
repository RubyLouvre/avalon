import { avalon, isObject, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { getRange } from '../renders/share'
import { toDOM } from '../renders/toDOM'
import { toHTML } from '../renders/toHTML'
import { diff } from '../renders/diff'
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
    delay: true,
    priority: 4,
    deep: true,
    init: function(oldVal, vdom, newVdom) {
        //cached属性必须定义在组件容器里面,不是template中

        this.cacheVm = !!newVdom.props.cached
        if (vdom.dom && vdom.nodeName === '#comment') {
            var comment = vdom.dom
        }
        var value = toObject(oldVal)
            //外部VM与内部VM
            // ＝＝＝创建组件的VM＝＝BEGIN＝＝＝
        var is = newVdom.props.is || value.is
        this.is = is
        var component = avalon.components[is]
            //外部传入的总大于内部

        //如果组件还没有注册，那么将原元素变成一个占位用的注释节点
        if (!component) {
            this.readyState = 0
            vdom.nodeName = '#comment'
            vdom.nodeValue = 'unresolved component placeholder'
            delete vdom.dom
            avalon.Array.ensure(componentQueue, this)
            return
        }
        this.readyState = 1
            //如果是非空元素，比如说xmp, ms-*, template
        var id = value.id || value.$id
        var hasCache = avalon.vmodels[id]
        var fromCache = false
        console.log('扫描组件的模块', newVdom)
        if (hasCache) {
            comVm = hasCache
            this.comVm = comVm
                // replaceRoot(this, comVm.$render)
            fromCache = true

        } else {
            var comVm = createComponentVm(component, value, is)
            var curVm = newVdom.vm
            fireComponentHook(comVm, vdom, 'Init')
            this.comVm = comVm
                //在组值的模板里有许多slot元素,它们需要转换成Z.slot('name')
                // ＝＝＝创建组件的VM＝＝END＝＝＝

            var innerRender = avalon.scan(component.template, comVm, false)

            comVm.$render = innerRender
            console.log('扫描完毕')
            var nodesWithSlot = []
            if (component.soleSlot) {

                this.getter = createGetter('@' + component.soleSlot)
                nodesWithSlot = { dynamic: true, nodeName: '#text', nodeValue: this.getter(comVm) || '' }
                innerRender.slots.defaults = [nodesWithSlot]
            } else {
                /*   var objectSlot = {}
                   newVdom.children.forEach(function(el, i) { //要求带slot属性
                       if (el.slot) {
                           var nodes = getRange(nodesWithSlot, el)
                           nodes.push(nodes.end)
                           nodes.unshift(el)
                           objectSlot[el.slot] = nodes
                       } else if (el.props) {
                           var name = el.props.slot
                           if (name) {
                               delete el.props.slot
                               if (Array.isArray(objectSlot[name])) {
                                   objectSlot[name].push(el)
                               } else {
                                   objectSlot[name] = [el]
                               }
                           }
                       }
                   })*/
                console.log(newVdom.slots, 'dddd')
                innerRender.slots = newVdom.slots
            }
            innerRender.exe = true
            innerRender.update = function() {}
            innerRender.complete()
            throw innerRender
        }
        //是否把slot也放在
        /*
        <div>原来旧的</div>
       
        */
        //当组件生成出来，slot元素应该在它应在的位置，然后旧的组件也有slot元素 
        if (comment) {
            var dom = avalon.vdom(vdom, 'toDOM')
            comment.parentNode.replaceChild(dom, comment)
            comVm.$element = innerRender.root.dom = dom
            delete this.reInit
        }
        var newVdom = innerRender.root

        console.log(vdom, newVdom)
        diff(vdom, newVdom)

        //  dumpTree(vdom.dom)
        comVm.$element = vdom.dom
            //    groupTree(vdom.dom, vdom.children)
        if (fromCache) {
            fireComponentHook(comVm, vdom, 'Enter')
        } else {
            fireComponentHook(comVm, vdom, 'Ready')
        }
    },
    diff: function(oldVal, newVal) {
        if (cssDiff.call(this, oldVal, newVal)) {
            if (!this.readyState)
                this.readyState = 0
            return true
        }
        console.log('失败')
    },

    update: function(value, vdom, newVdom) {
        // this.oldValue = value //★★防止递归
        this.value = avalon.mix(true, {}, value)
        console.log(this.readyState, ' 000', newVdom)
        switch (this.readyState) {
            case 0:
                this.init(value, vdom, newVdom)
                break

            default:
                this.readyState++
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
        if (!this.cacheVm) {
            fireComponentHook(comVm, this.node, 'Dispose')
            comVm.$hashcode = false
            delete avalon.vmodels[comVm.$id]
            this.innerRender && this.innerRender.dispose()
        } else {
            fireComponentHook(comVm, this.node, 'Leave')
        }
    },
})

function replaceRoot(instance, innerRender) {
    instance.innerRender = innerRender
    var root = innerRender.root
    var vdom = instance.node
    var slot = vdom.props.slot
    for (var i in root) {
        vdom[i] = root[i]
    }
    if (vdom.props && slot) {
        vdom.props.slot = slot
    }
    innerRender.root = vdom
    innerRender.vnodes[0] = vdom
}

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

function insertArraySlot(nodes, arr) {
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeName === 'slot') {
            resetParentChildren(nodes, arr)
            nodes.splice.apply(nodes, [i, 1].concat(arr))
            break
        } else if (el.children) {
            insertArraySlot(el.children, arr)
        }
    }
}



function insertObjectSlot(nodes, obj) {
    for (var i = 0, el; el = nodes[i]; i++) {
        if (el.nodeName === 'slot') {
            var name = el.props.name
            resetParentChildren(nodes, obj[name])
            nodes.splice.apply(nodes, [i, 1].concat(obj[name]))
            continue
        } else if (el.children) {
            insertObjectSlot(el.children, obj)
        }
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