

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

function toHTML(a) {
    return avalon.vdomAdaptor(a, 'toHTML')
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
        if (props) {
            ret.props = props
        }

        ret.children = createVDOMs(node.childNodes, node)
        if (props && 'selectedIndex' in ret) {
            node.selectedIndex = ret.selectedIndex
            delete ret.selectedIndex
            if (isEmpty(props)) {
                delete ret.props
            }
        }
    }
    return ret
}
//根据 outerHTML 创建 虚拟DOM
function render(node) {
    return createVDOMs([node], null)
}
function createVDOMs(nodes, parent) {
    var arr = []
    nodes = avalon.slice(nodes)
    for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i]
        switch (node.nodeType) {
            case 1:
                var value = node.getAttribute('ms-for')
                        || node.getAttribute(':for')
                if (value) {
                    var start = document.createComment('ms-for:' + value)
                    var end = document.createComment('ms-for-end:')
                    node.removeAttribute('ms-for')
                    node.removeAttribute(':for')
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
    }
    return arr
}

var f = document.documentElement
function removeNode(node) {
    f.appendChild(node)
    f.removeChild(node)
    return node
}


module.exports = render

