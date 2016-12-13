import { orphanTag } from './orphanTag'
import { voidTag } from './voidTag'
import { makeOrphan } from './makeOrphan'

export function fromDOM(dom) {
    return [from(dom)]
}

export function from(node) {
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
                isVoidTag: !!voidTag[type],
                props: props
            }
            if(type === 'option'){
                //即便你设置了option.selected = true,
                //option.attributes也找不到selected属性
               props.selected = node.selected
            }
            if (orphanTag[type] || type === 'option') {
                makeOrphan(vnode, type, node.text || node.innerHTML)
                if (node.childNodes.length === 1) {
                    vnode.children[0].dom = node.firstChild
                }
            } else if (!vnode.isVoidTag) {
                vnode.children = []
                for (var i = 0, el; el = node.childNodes[i++];) {
                    var child = from(el)
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