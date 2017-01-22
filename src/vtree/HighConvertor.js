import { DOMConvertor } from './DOMConvertor'
import { StringConvertor } from './StringConvertor'
import { avalon, config, delayCompileNodes, directives } from '../seed/core'
import { getRange } from './share'
import { eventMap } from '../parser/index'




/**
 * 此转换器主要是AST节点添加dirs属性，dymatic属性， 循环区域
 */


export function HighConvertor(node) {
    if (typeof node === 'string') {
        var vnodes = StringConvertor(node)
    } else {
        vnodes = DOMConvertor(node)
    }
    this.scanChildren(vnodes, true)
    return vnodes
}




HighConvertor.prototype = {
    scanChildren(children, isRoot) {
        for (var i = 0; i < children.length; i++) {
            var vdom = children[i]
            if (vdom.nodeName) {
                switch (vdom.nodeName) {
                    case '#text':
                        this.scanText(vdom)
                        break
                    case '#comment':
                        this.scanComment(vdom, children)
                        break
                    default:
                        this.scanTag(vdom, children, false)
                        break
                }
            }
        }

        if (isRoot && this.vm) {
            this.complete()
        }
    },
    complete() {
        avalon.log('扫描完毕')
    },
    /**
     * 从文本节点获取指令
     * @param {type} vdom 
     * @returns {undefined}
     */
    scanText(vdom) {
        if (config.rexpr.test(vdom.nodeValue)) {
            vdom.dynamic = true
        }
    },
    /**
     * 从注释节点获取指令
     * @param {type} vdom 
     * @param {type} parentChildren
     * @returns {undefined}
     */
    scanComment(vdom, parentChildren) {
        if (vdom.nodeValue.slice(0, 7) === 'ms-for:') {
            this.scanRange(vdom, parentChildren)
        }
    },
    /**
     * 在带ms-for元素节点旁添加两个注释节点,组成循环区域
     * @param {type} vdom
     * @param {type} parentChildren
     * @param {type} expr
     * @returns {undefined}
     */
    _scanRange(vdom, parentChildren, expr) {
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
        this.scanRange(begin, parentChildren, cb || '')

    },
    /**
     * 为没有设置ms-widget的组件添加ms-widget属性
     */
    scanWidget(vdom, attrs, dirs) {
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
                StringConvertor(vdom.children[0].nodeValue) :
                vdom.vtype !== 1 ? vdom.children.concat() : []
            vdom.soleSlot = children 
            this.scanChildren(children)
        }
        if (dirs) {
            vdom.dirs = dirs
            vdom.dynamic = true
        }

    },
    /**
     * 创建循环区域
     */
    scanRange(begin, parentChildren, cb) {
        var expr = begin.nodeValue.replace('ms-for:', '').trim()
        begin.nodeValue = 'ms-for:' + expr
        var nodes = getRange(parentChildren, begin)
        this.scanChildren(nodes, false)
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
     *  从attrs中扫描出指令
     * @param {type} vdom 
     * @param {type} attrs
     * @returns {undefined}
     */
    scanDirs(vdom, attrs) {
        var dirs = {},
            hasDir
        for (var attr in attrs) {
            var value = attrs[attr]
            var oldName = attr
            if (attr.charAt(0) === ':') {
                attr = 'ms-' + attr.slice(1)
            }
            if (attr.slice(0, 3) === 'ms-') {
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
    /**
     * 从元素节点的nodeName与属性中获取指令
     * @param {type} vdom 
     * @param {type} parentChildren
     * @param {type} isRoot 用于执行complete方法
     * @returns {undefined}
     */
    scanTag(vdom, parentChildren, isRoot) {
        var attrs = vdom.props

        //处理dirs
        var dirs = this.scanDirs(vdom, attrs)

        //处理for
        if (dirs['ms-for']) {
            return this._scanRange(vdom, parentChildren, dirs['ms-for'])
        }

        //处理widget
        this.scanWidget(vdom, attrs, dirs)

        //处理children
        var children = vdom.children
        var noDelay = !dirs || !delayCompileNodes(dirs)
            //如果存在子节点,并且不是容器元素(script, stype, textarea, xmp...)
        if (noDelay && !vdom.vtype && children.length) {
            this.scanChildren(children, false)
        }
    },
}