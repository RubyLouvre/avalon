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
var rretain = /[\S\xA0]/
function getType(node) {
    switch (node.nodeType) {
        case 3:
            return '3' + (/[\S\xA0]/.test(node.nodeValue) ? 'retain' : 'remove')
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
    var vn = vnodes.length
    if (vn === 0)
        return

    vnodes.forEach(function (el, index) {
        map[index] = getType(el)
    })
    var newNodes = [], change = false, el, i = 0
    var breakLoop = 0
    while (true) {
        el = nodes[i++]
        if (breakLoop++ > 5000) {
            break
        }
        var vtype = el && getType(el)
        var v = newNodes.length
        if (map[v] === vtype) {
            newNodes.push(el)
            var vnode = vnodes[v]

            if (vnode.dynamic) {
                vnode.dom = el
            }

            if (el.nodeType === 1 && !vnode.isVoidTag && !containers[vnode.type]) {
                if (el.type === 'select-one') {
                    //在chrome与firefox下删掉select中的空白节点，会影响到selectedIndex
                    var fixIndex = el.selectedIndex
                }
                reconcile(el.childNodes, vnode.children, el)
                if (el.type === 'select-one') {
                    el.selectedIndex = fixIndex
                }
            }
        } else {
            change = true
            if (rforRange.test(map[v])) {
                var vv = vnodes[v]
                var nn = document.createComment(vv.nodeValue)
                vv.dom = nn
                newNodes.push(nn)
                i = Math.max(0, --i)
            }
        }
        if (newNodes.length === vn) {
            break
        }
    }
    // console.log(newNodes.length, vnodes.length)
    if (change) {
        var f = document.createDocumentFragment(), i = 0
        while (el = newNodes[i++]) {
            f.appendChild(el)
        }
        while (parent.firstChild) {
            parent.removeChild(parent.firstChild)
        }
        parent.appendChild(f)
    }
}
var containers = avalon.oneObject('script,style,xmp,template,noscript,textarea')
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