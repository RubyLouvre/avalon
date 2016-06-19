
function getType(node) {
    switch (node.nodeType) {
        case 3:
            return '3' + (/\S/.test(node.nodeValue) ? 'retain' : 'remove')
        case 1:
            return '1' + (node.nodeName || node.type).toLowerCase()
        case 8:
            return '8' + node.nodeValue
    }

}
//[1,8,3],[3,3,1,8,3]
var rforRange = /^8ms\-for/
function reconcile(nodes, vnodes, parent) {
    vnodes = flatten(vnodes)
    var map = {}
    vnodes.forEach(function (el, index) {
        map[index] = getType(el)
    })
    var nodes = avalon.slice(nodes)
    var n = nodes.length
    for (var index = 0; index < n; ) {
        var vtype = map[index]
        var el = nodes[index]
        var type = el && getType(el)
        if (!vtype && !type) {
            break
        }
        //console.log(vtype, type)
        if (vtype !== type) {
            if (rforRange.test(vtype) && type !== '3remove') {
                //如果循环节点与空白节点不在一块,则创建循环节点
                var nodeValue = vtype.slice(1)
                var node = document.createComment(nodeValue)
                parent.insertBefore(node, el)
                nodes.splice(index, 0, node)
                index++
                n++
            } else if (type === '3remove') {
                //如果是空白节点
                parent.removeChild(el)
                var a = nodes.splice(index, 1)
                n--
                if (rforRange.test(vtype)) {
                    ++n
                }
            } else if (!vtype) {
                //移除多余节点
                parent.removeChild(el)
                nodes.splice(index, 1)
                n--
            } else if (vtype.charAt(0) + type.charAt(0) === '11') {
                //移除IE下产生的奇怪元素
                parent.removeChild(el)
                nodes.splice(index, 0, node)
                n--
            }
        } else {
            index++
        }
        var preIndex = index - 1
        if (el && el.nodeType === 1 && nodes[preIndex] === el) {
            var vnode = vnodes[preIndex]
            if (!vnode.isVoidTag && vnode.children) {
                reconcile(el.childNodes, vnode.children, el)
            }
        }
    }
}

function flatten(nodes) {
    var arr = []
    for (var i = 0, el; el = nodes[i]; i++) {
        if (Array.isArray(el)) {
            arr = arr.concat(flatten(el))
        } else {
            arr.push(el)
        }
    }
    return arr
}

module.exports = reconcile