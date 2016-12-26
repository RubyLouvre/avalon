import { avalon, config, inBrowser, delayCompileNodes, directives } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { fromString } from '../vtree/fromString'

import { optimize } from '../vtree/optimize'
import { Yield } from './toTemplate'
import { runActions, collectDeps } from '../vmodel/transaction'

import { eventMap } from '../parser/attributes'

import { startWith, dumpTree, getRange } from './share'
import { diff } from './diff2'


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

/**
 * avalon.scan 的内部实现
 */
export function Render(node, vm, noexe) {
    this.root = node //如果传入的字符串,确保只有一个标签作为根节点
    this.vm = vm
    this.exe = noexe === undefined
    this.callbacks = []
    this.staticIndex = 0
    this.staticTree = {}
    this.slots = {}
    this.uuid = Math.random()
    this.init()

}

Render.prototype = {
    /**
     * 开始扫描指定区域
     * 收集绑定属性
     * 生成指令并建立与VM的关联
     */
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
    static: function(i) {
        return this.staticTree[i]
    },
    comment: function(value) {
        return { nodeName: '#comment', nodeValue: value }
    },
    text: function(a, d) {
        return { nodeName: '#text', nodeValue: a || '', dynamic: d }
    },
    collectSlot: function(node, slots) {
        var name = node.props.slot
        if( !slots[name]) {
             slots[name] = []
        }
        slots[name].push(node)
        return node
    },
    html: function(html, vm) {
        var a = new Render(html, vm, true)
        return a.tmpl.exec(vm, this)
    },
    slot: function(name) {
        var a =this.slots[name]
      
        a.slot = name
        console.log(a, 'slot get')
        return a
    },
    ctrl: function(id, scope, cb) {
        var dir = directives['controller']
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
        if (isRoot) {
            this.complete()
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

        // 
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
                    avalon.warn(attr + ' has not registered!')
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
        var $id = dirs['ms-important'] || dirs['ms-controller']
        if ($id) {
            /**
             * 后端渲染
             * serverTemplates后端给avalon添加的对象,里面都是模板,
             * 将原来后端渲染好的区域再还原成原始样子,再被扫描
             */

            //推算出指令类型
            var type = dirs['ms-important'] === $id ? 'important' : 'controller'
                //推算出用户定义时属性名,是使用ms-属性还是:属性
            var attrName = ('ms-' + type) in attrs ? 'ms-' + type : ':' + type

            if (inBrowser) {
                delete attrs[attrName]
            }
            var dir = directives[type]
            scope = dir.getScope.call(this, $id, scope)
            if (!scope) {
                return
            } else {
                if (!this.vm) {
                    this.vm = scope
                }

                var clazz = attrs['class']
                if (clazz) {
                    attrs['class'] = (' ' + clazz + ' ').replace(' ms-controller ', '').trim()
                }

            }
        }
        return scope
    },
    /**
     * 将绑定属性转换为指令
     * 执行各种回调与优化指令
     * @returns {undefined}
     */
    complete() {
        if (!this.tmpl) {
            optimize(this.root)

            var fn = new Yield(this.vnodes, this)
            this.tmpl = fn
        }
        if (this.exe) {
            collectDeps(this, this.update)

        }
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
        var nodes = this.tmpl.exec(this.vm, {})
        if(this.noDiff){
            this.root = nodes[0]
            return
        }
        if (!this.vm.$element) {
            diff(this.vnodes[0], nodes[0])

            this.vm.$element = this.vnodes[0]
        } else {
            diff(this.vnodes[0], nodes[0])
        }
        this._isScheduled = false
    },
    /**
     * 销毁所有指令
     * @returns {undefined}
     */
    dispose() {
        var list = this.directives || []
        for (let i = 0, el; el = list[i++];) {
            el.dispose()
        }
        //防止其他地方的this.innerRender && this.innerRender.dispose报错
        for (let i in this) {
            if (i !== 'dispose')
                delete this[i]
        }
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