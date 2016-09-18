

var voidTag = require('./voidTag')
module.exports = markNode
//hydrateByDom

function markNode(node) {
    var ret = {}
    var type = node.nodeName.toLowerCase()
    ret.nodeName = type
    ret.dom = node
    if (type.charAt(0) === '#') {//2, 8
        var nodeValue = node.nodeValue
        if (/\S/.test(nodeValue)) {
            ret.nodeValue = nodeValue
        }
    } else {
        var props = markProps(node)
        if (voidTag[type]) {
            ret.isVoidTag = true
        }

        ret.children = markChildren(node)

        if (props) {
            if ('selectedIndex' in props) {
                node.selectedIndex = props.selectedIndex
                delete props.selectedIndex
            }
            ret.props = props
        }
    }
    return ret
}

var rformElement = /input|textarea|select/i
var rcolon = /^\:/
function markProps(node) {
    var attrs = node.attributes, ret = {}
    for (var i = 0, n = attrs.length; i < n; i++) {
        var attr = attrs[i]
        if (attr.specified) {
            var name = attr.name
            if (name.charAt(0) === ':') {
                name = name.replace(rcolon, 'ms-')
            }
            ret[name] = attr.value
        }
    }
    if (rformElement.test(node.nodeName)) {
        ret.type = node.type
    }
    var style = node.style.cssText
    if (style) {
        ret.style = style
    }
    //类名 = 去重(静态类名+动态类名+ hover类名? + active类名)
    if (ret.type === 'select-one') {
        ret.selectedIndex = node.selectedIndex
    }
    if (isEmpty(ret)) {
        return null
    }
    return ret
}

function isEmpty(a) {
    for (var i in a) {
        return false
    }
    return true
}


//将当前元素的孩子转换成VDOM
function markChildren(parent) {
    var arr = []
    var node = parent.firstChild
    if (!node) {
        return arr
    }
    do {
        var next = node.nextSibling
        switch (node.nodeType) {
            case 1:
                var a = node.getAttributeNode(':for') || node.getAttributeNode('ms-for')

                if (a) {
                    var start = document.createComment('ms-for:' + a.value)
                    var end = document.createComment('ms-for-end:')
                    node.removeAttributeNode(a)

                    if (parent) {
                        parent.insertBefore(end, node.nextSibling)
                        parent.insertBefore(start, node)
                    }
                    arr.push(markNode(start), markNode(node), markNode(end))

                } else {
                    arr.push(markNode(node))
                }
                break
            case 3:
                if (/\S/.test(node.nodeValue)) {
                    arr.push(markNode(node))
                } else {
                    var p = node.parentNode
                    if (p) {
                        p.removeChild(node)
                    }
                }
                break
            case 8:
                arr.push(markNode(node))

        }
        node = next

    } while (node)
    return arr
}






