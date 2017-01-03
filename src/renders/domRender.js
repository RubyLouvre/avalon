import { avalon, config, inBrowser, delayCompileNodes, directives } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { fromString } from '../vtree/fromString'

import { optimize } from '../vtree/optimize'
import { Lexer } from './toTemplate'
import { runActions, collectDeps } from '../vmodel/transaction'

import { eventMap } from '../parser/attributes'

import { startWith, dumpTree, getRange } from './share'
import { diff } from './diff'


/**
 * 生成一个渲染器,并作为它第一个遇到的ms-controller对应的VM的$render属性
 * @param {String|DOM} node
 * @param {ViewModel|Undefined} vm
 * @param {Function|Undefined} beforeReady
 * @returns {Render}
 */
avalon.scan = function(node, vm, a) {
    return new Render(node, vm, a)
}
avalon.staticIndex = 0
avalon.staticTree = {}

/**
 * avalon.scan 的内部实现
 */
export function Render(node, vm, noexe) {
    this.root = node //如果传入的字符串,确保只有一个标签作为根节点
    this.vm = vm
    this.exe = noexe === undefined
    this.callbacks = []

    this.slots = {}
    this.uuid = Math.random()
    this.init()

}
/**
 * 渲染器是avalon更新视图的核心组件,
 * 第一步,它会将真实DOM (fromDOM) 或HTML字符串 (fromString) 转换为AST 节点树
 * 这个节点也就是最原始的虚拟DOM树(下称vtree1),
 * 它里面包括文本节点,元素节点,文碎碎片,注释节点,循环区域(以数组形式表示)
 * 然后通过scanChildren,scanText,scanElement,scanComment
 * 为元素添加dynamic, dirs等属性, 为渲染器获取第一个vm
 * 
 * 第二步, 在vtree1都被扫描,并获得vm的情况下,
 * 再发动两次扫描vtree1,为节点添加static, staticRoot属性
 * 然后Lexer类,将vtree1转换为一个模块函数(bigrender)
 * bigrender传入一个vm及一个本地对象,就可以生成一个新的虚拟DOM树vtree2
 * 
 * 第三步,就是diff, 从上到下,vtree1, vtree2一一对应进行diff,
 * 这个过程会跳过文档碎片与循环区域,并将它们的内部节点提到外面的children上
 * 如果遇到widget,还要diff插槽元素
 * 
 */
Render.prototype = {
    init() {
        var vnodes
        if (this.root && this.root.nodeType > 0) {
            vnodes = fromDOM(this.root) //转换虚拟DOM
                //将扫描区域的每一个节点与其父节点分离,更少指令对DOM操作时,对首屏输出造成的频繁重绘
            dumpTree(this.root)
        } else if (typeof this.root === 'string') {
            vnodes = fromString(this.root) //转换虚拟DOM
        } else {
            return avalon.warn('avalon.scan first argument must element or HTML string')
        }
        this.root = vnodes[0]
        this.vnodes = vnodes
        this.scanChildren(vnodes, this.vm, true)
    },

    scanChildren(children, scope, isRoot) {
        for (var i = 0; i < children.length; i++) {
            var vdom = children[i]
            if (vdom.nodeName) {
                switch (vdom.nodeName) {
                    case '#text':
                        this.scanText(vdom, scope)
                        break
                    case '#comment':
                        this.scanComment(vdom, scope, children)
                        break
                    default:
                        this.scanTag(vdom, scope, children, false)
                        break
                }
            }
        }

        if (isRoot && this.vm) {
            this.complete()
        }
    },
    /**
     * 将绑定属性转换为指令
     * 执行各种回调与优化指令
     * @returns {undefined}
     */
    complete() {
        if (!this.template) {
            if (this.root) { //如果是空字符串,vnodes为[], root为undefined
                optimize(this.root)
            }
            this.beginIndex = avalon.staticIndex
            var lexer = new Lexer(this.vnodes, this)
            this.endIndex = avalon.staticIndex

            this.template = lexer.fork + ''
            this.fork = lexer.fork
        }
        if (this.exe) {
            collectDeps(this, this.update)
        }
    },

    /**
     * 从文本节点获取指令
     * @param {type} vdom 
     * @param {type} scope
     * @returns {undefined}
     */
    scanText(vdom, scope) {
        if (config.rexpr.test(vdom.nodeValue)) {
            vdom.dynamic = true
        }
    },
    /**
     * 从注释节点获取指令
     * @param {type} vdom 
     * @param {type} scope
     * @param {type} parentChildren
     * @returns {undefined}
     */
    scanComment(vdom, scope, parentChildren) {
        if (startWith(vdom.nodeValue, 'ms-for:')) {
            this.getForBinding(vdom, scope, parentChildren)
        }
    },
    /**
     * 从元素节点的nodeName与属性中获取指令
     * @param {type} vdom 
     * @param {type} scope
     * @param {type} parentChildren
     * @param {type} isRoot 用于执行complete方法
     * @returns {undefined}
     */
    scanTag(vdom, scope, parentChildren, isRoot) {
        var attrs = vdom.props

        //处理dirs
        var dirs = this.checkDirs(vdom, attrs)

        //处理scope
        scope = this.checkVm(scope, attrs, dirs)

        //处理for
        if (dirs['ms-for']) {
            return this.getForBindingByElement(vdom, scope, parentChildren, dirs['ms-for'])
        }

        //处理widget
        this.checkWidget(vdom, attrs, dirs)

        //处理children
        var children = vdom.children
        var noDelay = !dirs || !delayCompileNodes(dirs)
            //如果存在子节点,并且不是容器元素(script, stype, textarea, xmp...)
        if (noDelay && !vdom.vtype && children.length) {
            this.scanChildren(children, scope, false)
        }
    },
    dispose: function() {
        for (var i = this.beginIndex, n = this.endIndex; i < n; i++) {
            delete avalon.staticTree[i]
        }
    },
    checkWidget(vdom, attrs, dirs) {
        if (/^ms\-/.test(vdom.nodeName)) {
            attrs.is = vdom.nodeName
        }

        if (attrs['is']) {
            dirs = dirs || {}
            if (!dirs['ms-widget']) {
                dirs['ms-widget'] = '{}'
            }
        }
        if (dirs['ms-widget']) {
            var children = vdom.vtype === 2 ?
                fromString(vdom.children[0].nodeValue) :
                vdom.vtype !== 1 ? vdom.children.concat() : []
            vdom._children = children
            this.scanChildren(children)
        }
        if (dirs) {
            vdom.dirs = dirs
            vdom.dynamic = true
        }

    },
    checkDirs(vdom, attrs) {
        var dirs = {},
            hasDir
        for (var attr in attrs) {
            var value = attrs[attr]
            var oldName = attr
            if (attr.charAt(0) === ':') {
                attr = 'ms-' + attr.slice(1)
            }
            if (startWith(attr, 'ms-')) {
                dirs[attr] = value
                var type = attr.match(/\w+/g)[1]
                type = eventMap[type] || type
                if (!directives[type]) {
                    avalon.warn(`不存在${attr} 指令`)
                } else if (attr === 'ms-for') {
                    if (vdom.dom) {
                        vdom.dom.removeAttribute(oldName)
                    }
                    delete attrs[oldName]
                }
                hasDir = true
            }

        }
        return hasDir ? dirs : false
    },
    checkVm(scope, attrs, dirs) {
        if (scope) {
            if (!this.vm) {
                this.vm = scope
            }
            return scope
        }

        var $id = dirs['ms-important'] || dirs['ms-controller']
        if ($id) {
            var vm = avalon.vmodels[$id]
            if (vm) {
                this.vm = vm
                return vm
            }
        }
    },

    static: function(i) {
        return avalon.staticTree[i]
    },
    comment: function(value) {
        return { nodeName: '#comment', nodeValue: value }
    },
    text: function(a, d) {
        a = a == null ? '\u200b' : a + ''
        return { nodeName: '#text', nodeValue: a || '', dynamic: !!d }
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
    ctrl: function(id, scope, isImport, cb) {
        var name = isImport ? 'important' : 'controller'
        var dir = directives[name]
        scope = dir.getScope.call(this, id, scope)
        return cb(scope)
    },
    repeat: function(obj, str, cb) {
        var nodes = []
        var keys = str.split(',')
        nodes.cb = keys.splice(3, 7).join(',')

        if (Array.isArray(obj)) {
            for (var i = 0, n = obj.length; i < n; i++) {
                repeatCb(obj, obj[i], i, keys, nodes, cb, true)
            }
        } else if (avalon.isObject(obj)) {
            for (var i in obj) {
                if (obj.hasOwnProperty(i)) {
                    repeatCb(obj, obj[i], i, keys, nodes, cb)
                }
            }
        }
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

    update: function() {
        this.vm.$render = this
        var nodes = this.fork(this.vm, {})
        var root = this.root = nodes[0]
        if (this.noDiff) {
            return
        }
        try {
            diff(this.vnodes[0], root)
            this.vm.$element = this.vnodes[0]
        } catch (diffError) {
            avalon.log(diffError)
        }
        this._isScheduled = false
    },


    /**
     * 将循环区域转换为for指令
     * @param {type} begin 注释节点
     * @param {type} scope
     * @param {type} parentChildren
     * @param {type} userCb 循环结束回调
     * @returns {undefined}
     */
    getForBinding(begin, scope, parentChildren, cb) {
        var expr = begin.nodeValue.replace('ms-for:', '').trim()
        begin.nodeValue = 'ms-for:' + expr

        var nodes = getRange(parentChildren, begin)
        this.scanChildren(nodes, scope, false)
        var end = nodes.end
        begin.dynamic = true
        parentChildren.splice(nodes.start, nodes.length, [])

        begin.for = {
            begin,
            end,
            expr,
            nodes,
            cb

        }

    },
    /**
     * 在带ms-for元素节点旁添加两个注释节点,组成循环区域
     * @param {type} vdom
     * @param {type} scope
     * @param {type} parentChildren
     * @param {type} expr
     * @returns {undefined}
     */
    getForBindingByElement(vdom, scope, parentChildren, expr) {
        var index = parentChildren.indexOf(vdom) //原来带ms-for的元素节点
        var props = vdom.props
        var begin = {
            nodeName: '#comment',
            nodeValue: 'ms-for:' + expr
        }
        if (props.slot) {
            begin.slot = props.slot
            delete props.slot
        }
        var end = {
            nodeName: '#comment',
            nodeValue: 'ms-for-end:'
        }
        parentChildren.splice(index, 1, begin, vdom, end)
        var cbName = 'data-for-rendered'
        var cb = props[cbName]
        delete props[cbName]
        this.getForBinding(begin, scope, parentChildren, cb || '')

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