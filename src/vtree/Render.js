import { avalon, config, inBrowser, delayCompileNodes, directives } from '../seed/core'
import { runActions, collectDeps } from '../vmodel/transaction'
import { addScope, makeHandle } from '../parser/index'

import { __repeat } from '../filters/array'
import { diff } from './diff'
import { HighConvertor } from './HighConvertor'

import { Compiler } from './Compiler'
import { optimize } from './optimize'

avalon.scan = function(node, vm) {
    var vnodes = new HighConvertor(node)
    var c = new Compiler(vnodes, vm, false)
    if (vnodes.length === 1) {
        optimize(vnodes[0])
    }
    c.renders.forEach(function(cc) {
        collectDeps(cc, cc.update)
    })
}
export function Render(vm, vnodes, body) {
    var fork = Function('__vmodel__', '$$l',
        'var \u01A9 = __vmodel__.$render;' +
        'return ' + body)
    this.fork = fork
    this.template = fork + ''
    this.vm = vm
    this.slots = {}
    this.uuid = Math.random()
    this.vnodes = vnodes
    vm.$render = this
}
Render.prototype = {

    static: function(i) {
        return avalon.staticNodes[i]
    },
    comment: function(value) {
        return { nodeName: '#comment', nodeValue: value }
    },
    text: function(a, d) {
        var b = avalon.text(a) || '\u200b'
        return { nodeName: '#text', nodeValue: b, dynamic: !!d }
    },
    collectSlot: function(node, slots) {
        var name = node.props.slot
        if (!slots[name]) {
            slots[name] = []
        }
        slots[name].push(node)
        return node
    },

    slot: function(name) {
        var a = this.slots[name]
        a.slot = name
        return a
    },
    //如果下方没有扫描过,继续扫描
    ctrl: function(id, topVm, isImport, cb) {
        var name = isImport ? 'important' : 'controller'
        var dir = directives[name]
        var vm = dir.getScope(id, topVm)
        var curVm = avalon.vmodels[id]
        return cb(vm, curVm, isImport && topVm)
    },
    repeat: function(obj, str, cb) {
        var nodes = []
        var keys = str.split(',')
        nodes.cb = keys.splice(3, 7).join(',')
        __repeat(obj, Array.isArray(obj), function(i, flag) {
            repeatCb(obj, obj[i], i, keys, nodes, cb, flag)
        })
        return nodes
    },
    schedule() {
        if (!this._isScheduled) {
            this._isScheduled = true
            if (!avalon.uniqActions[this.uuid]) {
                avalon.uniqActions[this.uuid] = 1
                avalon.pendingActions.push(this)
            }
            runActions() //这里会还原_isScheduled
        }

    },



    dispose: function() {

    },
    update: function() {
        this.vm.$render = this
        var oldRoot = this.vnodes[0]
        var nodes = this.fork(this.vm, {})
        var root = nodes[0]

        if (this.noDiff) {
            return
        }
        try {
            diff(oldRoot, root)
            this.vm.$element = oldRoot.dom
        } catch (diffError) {
            avalon.log(diffError)
        }
        this._isScheduled = false
    }

}

function getTraceKey(item) {
    var type = typeof item
    return item && type === 'object' ? item.$hashcode : type + ':' + item
}

function repeatCb(obj, el, index, keys, nodes, cb, isArray) {
    let local = {}
    local[keys[0]] = el
    if (keys[1])
        local[keys[1]] = index
    if (keys[2])
        local[keys[1]] = obj
    var arr = cb(local)
    var key = isArray ? getTraceKey(el) : index
    if (arr.length === 1) {
        var elem = arr[0]
        elem.key = key
        nodes.push(elem)
    } else {
        elem = {
            key: key,
            nodeName: '#document-fragment',
            children: arr
        }
        nodes.push(elem)
    }

}