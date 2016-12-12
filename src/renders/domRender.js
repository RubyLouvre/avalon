import { avalon, config, inBrowser, delayCompileNodes, directives } from '../seed/core'
import { fromDOM } from '../vtree/fromDOM'
import { fromString } from '../vtree/fromString'

import { optimize } from '../vtree/optimize'
import { Yield } from '../vtree/toTemplate'

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
function Render(node, vm, noexe) {
    this.root = node //如果传入的字符串,确保只有一个标签作为根节点
    this.vm = vm
    this.exe = noexe === undefined
    this.callbacks = []
    this.staticIndex = 0
    this.staticTree = {}
    this.init()
    this._scope = vm
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
    text: function(a) {
        return a + ''
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
    scanChildren(children, scope, isRoot) {
        for (var i = 0; i < children.length; i++) {
            var vdom = children[i]
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
            vdom.dynamic = true
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
                if (!this._scope)

                    this._scope = scope
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
            var nodes = fn.exec(this._scope, this)
            console.log(nodes)
        }



     
    },

 

    update: function() {
        for (var i = 0, el; el = this.directives[i++];) {
            el.update()
        }
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
    getForBinding(begin, scope, parentChildren, userCb) {
        var expr = begin.nodeValue.replace('ms-for:', '').trim()
        begin.nodeValue = 'ms-for:' + expr
        var nodes = getRange(parentChildren, begin)
        var end = nodes.end
        var fragment = avalon.vdom(nodes, 'toHTML')
        parentChildren.splice(nodes.start, nodes.length)
        begin.props = {}
        this.bindings.push([
            begin, scope, {
                'ms-for': expr
            }, {
                begin,
                end,
                expr,
                userCb,
                fragment,
                parentChildren
            }
        ])
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
        this.getForBinding(begin, scope, parentChildren, props['data-for-rendered'])

    }

}
