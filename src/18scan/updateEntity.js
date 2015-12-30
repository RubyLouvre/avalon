//更新真实DOM树


function getNextEntity(node, vnode, nextSibling) {
    if (vnode.signature && vnode.signature.indexOf(":start") > 0) {
        var end = vnode.signature.replace(":start", ":end")
        var next = node.nextSibling
        while (next) {
            if (next.nodeValue === end) {
                return next.nextSibling
            }
            next = next.nextSibling
        }
        return next
    } else {
        return nextSibling
    }
}

function getNextVirtual(node, vnode, nextSibling) {
    if (vnode.signature && vnode.signature.indexOf(":start") > 0) {
        var end = vnode.signature.replace(":start", ":end")
        var next = node.nextSibling
        while (next) {
            if (next.nodeValue === end) {
                return next.nextSibling
            }
            next = next.nextSibling
        }
        return next
    } else {
        return nextSibling
    }
}

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


function updateEntity(nodes, vnodes, parent) {
    var cur = nodes[0]

    if (!cur && !parent)
        return
    parent = parent || cur.parentNode

    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var mirror = vnodes[i]
        if (!mirror)
            break
        if (mirror.disposed) {//如果虚拟节点标识为移除
            vnodes.splice(i, 1)
            i--
            if (cur) {
                cur && parent.removeChild(cur)
                //  cur = nodes[i]
                mirror.dispose && mirror.dispose(cur)
            }
            cur = nodes[i + 1]
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
            cur = nodes[i + 1]
            //处理它的孩子
        } else {
            // 如果某一个指令会替换当前元素(比如ms-if,让当元素变成<!--ms-if-->
            // ms-include,让当前元素变成<!--ms-include-start-->)
            // ms-repeat,让当前元素变成<!--ms-repeat-start-->)
            // 那么它们应该做成一个组件
            if (false === execHooks(cur, mirror, parent, "change")) {
                cur = getNextEntity(cur, mirror, nodes[i + 1])
                continue
            }
            if (!mirror.skipContent && !mirror.skip && mirror.children && cur && cur.nodeType === 1) {
                updateEntity(avalon.slice(cur.childNodes), mirror.children, cur)
            }
            execHooks(cur, mirror, parent, "afterChange")
            cur = nodes[i + 1]
        }
    }
}

function execHooks(node, vnode, parent, hookName) {
    var hooks = vnode[hookName]
    if (hooks) {
        for (var i = 0, hook; hook = hooks[i++]; ) {
            hook(node, vnode, parent)
        }
        delete vnode[hookName]
    }
}


// a a ms-if a a ==> a a c a a
// a a ms-repeat a a ==> a a c a a
// ms-if 必须创建组件吗?
// ms-include 一开始添加路标
// ms-repeat 一开始添加路标
// ms-each 一开始添加路标
// ms-html 没有路标
// ms-text 没有路标
