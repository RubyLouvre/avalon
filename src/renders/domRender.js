import { avalon, config, inBrowser, delayCompileNodes, directives } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { fromString } from '../vtree/fromString'

import { optimize } from '../vtree/optimize'
import { Yield } from '../vtree/toTemplate'
import { runActions, collectDeps } from '../vmodel/transaction'

import { orphanTag } from '../vtree/orphanTag'
import { parseAttributes, eventMap } from '../parser/attributes'
import { parseInterpolate } from '../parser/interpolate'

import { startWith, groupTree, dumpTree, getRange } from './share'


/**
 * 生成一个渲染器,并作为它第一个遇到的ms-controller对应的VM的$render属性
 * @param {String|DOM} node
 * @param {ViewModel|Undefined} vm
 * @param {Function|Undefined} beforeReady
 * @returns {Render}
 */
avalon.scan = function(node, vm) {
    return new Render(node, vm)
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
    html: function(html, vm) {
        var a = new Render(html, vm, true)
        return a.tmpl.exec(vm, this)
    },
    ctrl: function(id, scope, cb) {
        var dir = directives['controller']
        scope = dir.getScope.call(this, id, scope)
        return cb(scope)
    },
    repeat: function(obj, str, cb) {
        var nodes = []
        var keys = str.split(',')
        nodes.cb = keys.splice(3,7).join(',')
        
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
        var dirs = {},
            attrs = vdom.props,
            hasDir, hasFor
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
                }
                hasDir = true
            }
            if (attr === 'ms-for') {
                hasFor = value
                delete attrs[oldName]
            }
        }
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
                vdom.dynamic = true
                var clazz = attrs['class']
                if (clazz) {
                    attrs['class'] = (' ' + clazz + ' ').replace(' ms-controller ', '').trim()
                }
            }
            var render = this
            scope.$render = render

        }
        if (hasFor) {
            if (vdom.dom) {
                vdom.dom.removeAttribute(oldName)
            }
            return this.getForBindingByElement(vdom, scope, parentChildren, hasFor)
        }

        if (/^ms\-/.test(vdom.nodeName)) {
            attrs.is = vdom.nodeName
        }

        if (attrs['is']) {
            if (!dirs['ms-widget']) {
                dirs['ms-widget'] = '{}'
            }
            hasDir = true
        }
        if (hasDir) {
            vdom.dirs = dirs
            vdom.dynamic = true
        }
        var children = vdom.children
            //如果存在子节点,并且不是容器元素(script, stype, textarea, xmp...)
        if (!orphanTag[vdom.nodeName] &&
            children &&
            children.length &&
            !delayCompileNodes(dirs)
        ) {
            this.scanChildren(children, scope, false)
        }
    },
    /**
     * 将绑定属性转换为指令
     * 执行各种回调与优化指令
     * @returns {undefined}
     */
    complete() {
        optimize(this.root)
        this.Yield = Yield

        var fn = new Yield(this.vnodes, this)
        this.tmpl = fn
        if (this.exe) {

            var me = this
            collectDeps(this, this.update)

        }
    },
    insert: function(nodes) {
        toDOM(nodes, true)

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
    if(arr.length === 1){
        var elem = arr[0]
        elem.key = key
        nodes.push(elem)
    }else{
         elem = {
            key: key,
            nodeName: '#document-fragment',
            children: arr
        }
        nodes.push(elem)
    }
       

}

var container = {
    script: function(node) {
        try {
            node.dom.text = node.children[0].nodeValue
        } catch (e) {
            avalon.log(node)
        }
    },
    style: function(node) {
        try {
            node.dom.textContext = node.children[0].nodeValue
        } catch (e) { avalon.log(node) }
    }
}

// 以后要废掉vdom系列,action
//a是旧的虚拟DOM, b是新的
function diff(a, b) {
    switch (a.nodeName) {
        case '#text':
            toDOM(a)

            if (a.nodeValue !== b.nodeValue) {
                a.nodeValue = b.nodeValue
                if (a.dom) {
                    a.dom.nodeValue = b.nodeValue
                }
            }
            break
        case '#comment':
            toDOM(a)
            if (a.nodeName !== b.nodeName) {
                handleIf(a, b)
                toDOM(a)
            }
            break
        case '#document-fragment':
            diff(a.children, b.children)
            break
        case void(0):

            console.log('这是数组')

            return avalon.directives['for'].diff(a, b)
            break
        default:
            toDOM(a)
            if (a.staticRoot && a.hasScan) {

                return
            }
            var parentNode = a.dom
            if (a.nodeName !== b.nodeName) {
                handleIf(a, b)
                return
            }
            var delay
            var isHTML
            var directives = avalon.directives
            if (b.dirs) {
                for (var i = 0, bdir; bdir = b.dirs[i]; i++) {
                    var adir = a.dirs[i]

                   
                    if(!adir.diff){
                        avalon.mix(adir, directives[adir.type])
                    }
                     delay = delay || adir.delay
                    if (adir.diff && adir.diff(adir.value, bdir.value, a, b)) {
                        toDOM(a)
                        adir.update(adir.value, a, b)
                        if (!adir.removeName) {
                            a.dom.removeAttribute(adir.name)
                            adir.removeName = true
                        }


                    }else{
                        if(!adir.diff)
                        console.log(adir, '没有diff方法')
                    }

                }
            }

            if (!a.isVoidTag && !delay && !orphanTag[a.nodeName]) {

                var childNodes = parentNode.childNodes
                var achild = a.children.concat()
                var bchild = b.children.concat()
                for (let i = 0; i < achild.length; i++) {
                    let c = achild[i]
                    let d = bchild[i]

                    if (d) {
                        let arr = diff(c, d)
                        c.updating = false

                        if (typeof arr === 'number') {
                          //  console.log('数组扁平化', arr)
                            avalon.directives.for.update(c, d, achild, bchild, i, parentNode)

                            c = achild[i]
                            d = bchild[i]
                            diff(c, d)
                        }
                    }
                  //  toDOM(c)
                    if (c.dom !== childNodes[i]) {

                        if (!childNodes[i]) {
                            //  parentNode.removeChild(c.dom)
                            parentNode.appendChild(c.dom)
                        } else {
                            try {
                                parentNode.insertBefore(c.dom, childNodes[i])
                            } catch (e) {
                                console.log(c, c.dom, childNodes[i], 'error', e)
                            }
                        }
                    } else {
                        // parentNode.appendChild(c.dom)
                    }
                }
            }
            if (a.staticRoot) {
                a.hasScan = true
            }
            break
    }
}


function toDOM(el, b) {

    if (el.props) {
        if (el.dom) {
            return el.dom
        }
        el.dom = document.createElement(el.nodeName)

        for (var i in el.props) {
            if (typeof el.dom[i] === 'boolean') {
                el.dom[i] = !!el.props[i]
            } else {
                el.dom.setAttribute(i, el.props[i])
            }
        }
        if (container[el.nodeName]) {
            container[el.nodeName](el)
        } else if (el.children && !el.isVoidTag && !el.dirs) {
            appendChild(el.dom, el.children)
        }
        return el.dom
    } else if (el.nodeName === '#comment') {
        return el.dom || (el.dom = document.createComment(el.nodeValue))
    } else if (el.nodeName === '#document-fragment') {
        console.log('文档变DOM')
        var dom = document.createDocumentFragment()
        appendChild(dom, el.children)
        el.split = dom.lastChild
        el.dom = dom
        return el.dom = dom
    } else if (el.nodeName === '#text') {
        if (el.dom) {

            return el.dom
        }

        return el.dom = document.createTextNode(el.nodeValue)
    } else if (Array.isArray(el)) {
        // el = flatten(el)
        console.log('数组变DOM', b)
       
            //        if (el.length === 1) {
            //            return toDOM(el[0])
            //        } else {
            //            var a = document.createDocumentFragment()
            //            appendChild(a, el)
            //            return a
            //        }
    }
}

function handleIf(a, b) {
    handleDispose(a)
    for (var i in a) {
        delete a[i]
    }
    for (var i in b) {
        a[i] = b[i]
    }
    toDOM(a)
}

function handleDispose(a) {
    if (a.dirs) {
        for (var i = 0, el; el = a.dirs[i++];) {
            if (el.beforeDispose) {
                el.beforeDispose()
            }
        }
    }
    var arr = a.children || Array.isArray(a) ? a : false
    if (arr) {
        for (var i = 0, el; el = arr[i++];) {
            handleDispose(el)
        }
    }
}

function appendChild(parent, children) {
    for (var i = 0, n = children.length; i < n; i++) {
        var b = toDOM(children[i])
        if (b) {
            parent.appendChild(b)
        }
    }
}

function flatten(array) {
    var ret = []
    for (var i = 0, n = array.length; i < n; i++) {
        var el = array[i]
        if (Array.isArray(el)) {
            el = flatten(el)
            ret.push.apply(ret, el)
        } else if (el.nodeName === '#document-fragment') {

            ret.push.apply(ret, el.children)
        } else {
            ret.push(el)
        }
    }
    return ret
}