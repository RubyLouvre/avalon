//更新真实DOM树
function getVType(node) {
    switch (node.type) {
        case "#text":
            return 3
        case "#comment":
            return 8
        case "#component":
            return -1
        default:
            return 1
    }
}
function getNextEntity(prev, prevVirtual, parent) {
    if (prevVirtual && prevVirtual.signature) {
        var end = prevVirtual.signature + ":end"
        for (var i = 0, el; el = parent.childNodes[i++]; ) {
            if (el.nodeValue === end) {
                return el.nextSibling
            }
        }
    }
    return prev ? prev.nextSibling : null
}



function updateEntity(nodes, vnodes, parent) {
    var cur = nodes[0], next
    if (!cur && !parent)
        return
    parent = parent || cur.parentNode
    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var mirror = vnodes[i]
        cur = i === 0 ? cur : getNextEntity(cur, vnodes[i - 1], parent)
        if (!mirror)
            break
        if (mirror.disposed) {//如果虚拟节点标识为移除
            vnodes.splice(i, 1)
            i--
            if (cur) {
                cur && parent.removeChild(cur)
                mirror.dispose && mirror.dispose(cur)
            }
            continue
        } else if (mirror.created) {
            delete mirror.created
            var dom = mirror.toDOM()
            mirror.create && mirror.create(dom)
            if (mirror.type !== "#component") {
                parent.insertBefore(dom, cur)
                updateEntity([dom], [mirror], parent)
            } else {//组件必须用东西包起来
                // div.ms-repeat [repeatStart, other..., repeatEnd]
                var inserted = avalon.slice(dom)
                parent.insertBefore(dom, cur)//在同级位置插入
                updateEntity(inserted, mirror.children, parent)
            }
        } else {
            // 如果某一个指令会替换当前元素(比如ms-if,让当元素变成<!--ms-if-->
            // ms-repeat,让当前元素变成<!--ms-repeat-start-->)
            // 那么它们应该做成一个组件
            //  next = cur.nextSibling
            if (false === execHooks(cur, mirror, parent, "change")) {
//                cur = {
//                    nextSibling: next
//                }
                continue
            }
            if (!mirror.skipContent && !mirror.skip && mirror.children && cur && cur.nodeType === 1) {
                updateEntity(avalon.slice(cur.childNodes), mirror.children, cur)
            }
            execHooks(cur, mirror, parent, "afterChange")
        }
    }
}

function execHooks(node, vnode, parent, hookName) {
    var hooks = vnode[hookName]
    if (hooks) {
        for (var hook; hook = hooks.shift(); ) {
            if (false === hook(node, vnode, parent)) {
                return false
            }
        }
        delete vnode[hookName]
    }
}


// ms-if 没有路标, 组件
// ms-include 没有路标, 非组件
// ms-repeat 一开始添加路标,组件
// ms-each 一开始添加路标, 组件
// ms-html 没有路标,非组件
// ms-text 没有路标,非组件
