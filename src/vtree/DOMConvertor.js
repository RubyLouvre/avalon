import {
    orphanTag,
    voidTag,
    makeOrphan
} from './tags'


export function DOMConvertor(dom) {
    return [fromDOM(dom)]
}
/**
 * 虚拟元素节点有如下属性
 * nodeName: 标签名,一律小写
 * ns: svg | vml | html
 * dom: 原来的元素节点
 * vtype: 1 闭合 2容器(里面都是文本,存兼容问题) 0 不闭合;原先的isVoidTag被废掉
 * props: 属性集合
 * dirs: 指令数组
 */
export function fromDOM(node) {
    var type = node.nodeName.toLowerCase()
    switch (type) {
        case '#text':

        case '#comment':
            return {
                nodeName: type,
                dom: node,
                nodeValue: node.nodeValue
            }
        default:
            var props = markProps(node, node.attributes || [])
            var vnode = {
                nodeName: type,
                dom: node,
                vtype: voidTag[type] || orphanTag[type] || 0,
                props: props,
                children: []
            }
            if (type === 'option') {
                if (props.selected) {
                    props.selected = true
                }
                if (props.disabled) {
                    props.disabled = true
                }
            }

            if (type in orphanTag) {
                makeOrphan(vnode, type, node.text || node.innerHTML)
                if (node.childNodes.length === 1) {
                    vnode.children[0].dom = node.firstChild
                }
            } else if (!vnode.vtype) {

                for (var i = 0, el; el = node.childNodes[i++];) {
                    var child = fromDOM(el)
                    if (/\S/.test(child.nodeValue)) {
                        vnode.children.push(child)
                    }
                }
            }
            return vnode
    }
}

var rformElement = /input|textarea|select/i

function markProps(node, attrs) {
    var ret = {}
    for (var i = 0, n = attrs.length; i < n; i++) {
        var attr = attrs[i]
        if (attr.specified) {
            //IE6-9不会将属性名变小写,比如它会将用户的contenteditable变成contentEditable
            ret[attr.name.toLowerCase()] = attr.value
        }
    }
    if (rformElement.test(node.nodeName)) {
        ret.type = node.type
        var a = node.getAttributeNode('value')
        if (a && /\S/.test(a.value)) { //IE6,7中无法取得checkbox,radio的value
            ret.value = a.value
        }

    }
    var style = node.style.cssText
    if (style) {
        ret.style = style
    }
    //类名 = 去重(静态类名+动态类名+ hover类名? + active类名)
    if (ret.type === 'select-one') {
        ret.selectedIndex = node.selectedIndex
    }
    return ret
}