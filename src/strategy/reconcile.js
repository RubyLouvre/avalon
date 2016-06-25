/*
 * 
 节点对齐算法
 元素节点是1＋其类型
 文本节点是3＋其是否能移除
 注释节点是8＋其内容
 发现不一样，就对真实DOM树添加或删除
 添加的是 ms-for,ms-for-end占位的注释节点
 删除的是多余的空白文本节点,与IE6-8私下添加的奇怪节点
 */
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


var rforRange = /^8ms\-for/

function reconcile(nodes, vnodes, parent) {
    //遍平化虚拟DOM树
    vnodes = flatten(vnodes)
    var map = {}
    vnodes.forEach(function (el, index) {
        map[index] = getType(el)
    })
    var newNodes = [], change = false, el, i = 0
    while (el = nodes[i++]) {
        var vtype = getType(el)
        var v = newNodes.length
        if (map[v] == vtype) {
            newNodes.push(el)
            var vnode = vnodes[v]
            if (vnode.dynamic) {
                vnode.dom = el
            }
            if (el.nodeType === 1 && !vnode.isVoidTag && !containers[vnode.type]) {
                reconcile(el.childNodes, vnode.children, el)
            }
        } else {
            change = true
            if (rforRange.test(map[v])) {
                var vv = vnodes[v]
                var nn = document.createComment(vv.nodeValue)
                vv.dom = nn
                newNodes.push(nn)
            }
        }
    }
    if (change) {
        var f = document.createDocumentFragment(), i = 0
        while (el = newNodes[i++]) {
            f.appendChild(el)
        }
        while (parent.firstChild) {
          //  console.log(parent.firstChild)
            parent.removeChild(parent.firstChild)
        }
        parent.appendChild(f)
    }
}
var containers = avalon.oneObject('script,style,template,noscript,textarea,option')
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