import { avalon, isObject, platform } from '../seed/core'
import { cssDiff } from '../directives/css'
import { dumpTree, groupTree, getRange } from '../renders/share'
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
    init: function() {
        //cached属性必须定义在组件容器里面,不是template中
        var vdom = this.node
        this.cacheVm = !!vdom.props.cached
        if (vdom.dom && vdom.nodeName === '#comment') {
            var comment = vdom.dom
        }
        var oldValue = this.getValue()
        var value = toObject(oldValue)
            //外部VM与内部VM
            // ＝＝＝创建组件的VM＝＝BEGIN＝＝＝
        var is = vdom.props.is || value.is
        this.is = is
        var component = avalon.components[is]
            //外部传入的总大于内部
        if (!('fragment' in this)) {
            if (!vdom.isVoidTag) { //提取组件容器内部的东西作为模板
                var text = vdom.children[0]
                if (text && text.nodeValue) {
                    this.fragment = text.nodeValue
                } else {
                    this.fragment = avalon.vdom(vdom.children, 'toHTML')
                }
            } else {
                this.fragment = false
            }
        }
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

        if (hasCache) {
            comVm = hasCache
            this.comVm = comVm
            replaceRoot(this, comVm.$render)
            fromCache = true

        } else {
            var comVm = createComponentVm(component, value, is)
            fireComponentHook(comVm, vdom, 'Init')
            this.comVm = comVm

            // ＝＝＝创建组件的VM＝＝END＝＝＝
            var boss = avalon.scan(component.template, comVm)
            comVm.$render = boss
            replaceRoot(this, boss)
            var nodesWithSlot = []
            var directives = []
            if (this.fragment || component.soleSlot) {
                var curVM = this.fragment ? this.vm : comVm
                var curText = this.fragment || '{{##' + component.soleSlot + '}}'
                var childBoss = avalon.scan('<div>' + curText + '</div>', curVM, function() {
                    nodesWithSlot = this.root.children
                })
                directives = childBoss.directives
                for (var i in childBoss) {
                    delete childBoss[i]
                }
            }
            boss.directives.push.apply(boss.directives, directives)

            var arraySlot = [],
                objectSlot = {}
                //从用户写的元素内部 收集要移动到 新创建的组件内部的元素
            if (component.soleSlot) {
                arraySlot = nodesWithSlot
            } else {
                nodesWithSlot.forEach(function(el, i) { //要求带slot属性
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
                })
            }
            //将原来元素的所有孩子，全部移动新的元素的第一个slot的位置上
            if (component.soleSlot) {
                insertArraySlot(boss.vnodes, arraySlot)
            } else {
                insertObjectSlot(boss.vnodes, objectSlot)
            }
        }

        if (comment) {
            var dom = avalon.vdom(vdom, 'toDOM')
            comment.parentNode.replaceChild(dom, comment)
            comVm.$element = boss.root.dom = dom
            delete this.reInit
        }

        //处理DOM节点
        dumpTree(vdom.dom)
        groupTree(vdom.dom, vdom.children)
        if (fromCache) {
            fireComponentHook(comVm, vdom, 'Enter')
        } else {
            fireComponentHook(comVm, vdom, 'Ready')
        }
        this.beforeDestroy = function() {
            if (!this.cacheVm) {
                fireComponentHook(comVm, vdom, 'Dispose')
                comVm.$hashcode = false
                delete avalon.vmodels[comVm.$id]
                this.boss.destroy()
            } else {
                fireComponentHook(comVm, vdom, 'Leave')
            }

        }

    },
    diff: function(newVal, oldVal) {
        if (cssDiff.call(this, newVal, oldVal)) {
            return true
        }
    },
    update: function(vdom, value) {
        this.oldValue = value //★★防止递归
        switch (this.readyState) {
            case 0:
                if (this.reInit) {
                    this.init()
                }
                break
            case 1:
                this.readyState++
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
    }
})

function replaceRoot(instance, boss) {
    instance.boss = boss
    var root = boss.root
    var vdom = instance.node
    for (var i in root) {
        vdom[i] = root[i]
    }
    boss.root = vdom
    boss.vnodes[0] = vdom
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
    var def = avalon.mix({}, component.defaults)
    collectHooks(def, hooks)
    collectHooks(value, hooks)
    def.$id = value.id || value.$id || avalon.makeHashCode(is)
    delete value.id
    delete value.$id
    avalon.mix(def, value)
    var vm = avalon.define(def)
    hooks.forEach(function(el) {
        vm.$watch(el.type, el.cb)
    })
    return vm
}

function collectHooks(a, list) {
    for (var i in a) {
        if (componentEvents[i]) {
            if (typeof a[i] === 'function') {
                list.unshift({
                    type: i,
                    cb: a[i]
                })
            }
            delete a[i]
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
    for (var el, i = 0; el = componentQueue[i]; i++) {
        if (el.is === name) {
            componentQueue.splice(i, 1)
            el.reInit = true
            delete el.oldValue
            el.update()
            i--;
        }
    }
}