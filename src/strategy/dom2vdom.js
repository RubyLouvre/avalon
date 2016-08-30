

var voidTag = require('./voidTag')
var vdom2body = require('./vdom2body')
var rformElement = /input|textarea|select/i
var rcolon = /^\:/
function getAttributes(node) {
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

function createVDOM(node) {
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
        var props = getAttributes(node)
        if (voidTag[type]) {
            ret.isVoidTag = true
        }
        
        ret.children = createVDOMBatch(node)
        if ('selectedIndex' in ret) {
            node.selectedIndex = ret.selectedIndex
            delete ret.selectedIndex
        }
        if (props) {
            ret.props = props
        }
    }
    return ret
}
//将当前元素的孩子转换成VDOM
function createVDOMBatch(parent) {
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
                    arr.push(createVDOM(start), createVDOM(node), createVDOM(end))

                } else {
                    arr.push(createVDOM(node))
                }
                break
            case 3:
                if (/\S/.test(node.nodeValue)) {
                    arr.push(createVDOM(node))
                } else {
                    removeNode(node)
                }
                break
            case 8:
                arr.push(createVDOM(node))

        }
        node = next

    } while (node)
    return arr
}

var f = avalon.avalonFragment
function removeNode(node) {
    f.appendChild(node)
    f.removeChild(node)
    return node
}


module.exports = createVDOM

