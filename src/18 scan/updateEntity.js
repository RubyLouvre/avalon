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
    var cur = nodes[0]
    if (!cur && !parent)
        return
    parent = parent || cur.parentNode
    for (var i = 0, vn = vnodes.length; i < vn; i++) {
        var mirror = vnodes[i]
        cur = i === 0 ? cur : getNextEntity(cur, vnodes[i - 1], parent)
        if (!mirror)
            break
        if (false === execHooks(cur, mirror, parent, "change")) {
            //ms-if,ms-each,ms-repeat这些破坏原来结构的指令会这里进行中断
            execHooks(cur, mirror, parent, "afterChange")
            continue
        }
        if (mirror.signature) {
            var repeatNodes = [cur], next = cur
            while (next = next.nextSibling) {
                repeatNodes.push(next)
                if (next.nodeValue === mirror.signature + "end") {
                    break
                }
            }
            updateEntity(repeatNodes, getRepeatItem(mirror.children), parent)

        } else if (!mirror.skipContent && mirror.children && cur && cur.nodeType === 1) {

            updateEntity(avalon.slice(cur.childNodes), mirror.children, cur)
        }
        execHooks(cur, mirror, parent, "afterChange")
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
