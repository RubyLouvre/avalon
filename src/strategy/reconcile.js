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
   
    
    var n = vnodes.length
    //遍历真实DOM树
    for (var index = 0; index < n; ) {
        var vtype = map[index]
        var el = nodes[index]
        var type = el && getType(el)
        
        if (!vtype && !type) {
            break
        }
        if (vtype !== type) {
            if (rforRange.test(vtype) && type !== '3remove') {
                //如果循环节点与空白节点不在一块,则创建循环节点
                var nodeValue = vtype.slice(1)
                var node = document.createComment(nodeValue)
                var vdom = vnodes[index]
                vdom.dom = node
                parent.insertBefore(node, el)
                continue
            } else if (type === '3remove' || !vtype) {
                //如果是空白节点,移除后不变索引,后面的节点跟上来
                parent.removeChild(el)
                continue
             } else if(!type) {//ms-html,ms-text
                var vv = vnodes[index]
                var dom = avalon.vdomAdaptor(vv, 'toDOM')
                vv.dom = dom
                var before = nodes[index-1]
                if(before){
                    parent.insertBefore(dom,before && before.nextSibling)
                }else{
                    parent.appendChild(dom)
                }
                continue
            }
        } else {
            var vnode = vnodes[index]
            if (vnode.dynamic) {
                vnode.dom = el
            }
            if (el && el.nodeType === 1 && !vnode.isVoidTag) {
                if (vnode.children && (vnode.children.length || el.childNodes.length)) {
                    reconcile(el.childNodes, vnode.children, el)
                }
            }
            index++
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