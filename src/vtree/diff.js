import { avalon, directives } from '../seed/core'
import { toDOM } from '../renders/toDOM'
import { collectNode, handleDispose } from './recycler'

//a是旧的虚拟DOM, b是新的
export function diff(a, b) {

    switch (a.nodeName) {
        case '#text':
            //两个文本节点进行比较
            toDOM(a)
            if (a.nodeValue !== b.nodeValue) {
                a.nodeValue = b.nodeValue
                if (a.dom) {
                    a.dom.nodeValue = b.nodeValue
                }
            }
            break
        case '#comment':
            //两个注释节点进行比较
            if (b.nodeName !== '#comment') {
                //ms-if 注释节点要变成元素节点
                for (var i in b) {
                    a[i] = b[i]
                }
                delete a.dom
                reInitDires(a)
                diff(a, b)
            } else {
                toDOM(a)
            }
            break
        case '#document-fragment':
            break
        case void(0):
            //两个数组(循环区域进行比较 )
            return directives['for'].diff(a, b)
            break
        default:
            //两个元素节点进行比较
            //先处理静态节点,静态节点不会变动,不用比较
            //如果上面有指令,应用指令
            if (a.staticID && a.hasScan) {
                toDOM(a)
                return
            }
            toDOM(a)
            var parentNode = a.dom
            var stop = false
            var afterCb = []
            if (b.dirs) {
                for (var i = 0, bdir; bdir = b.dirs[i]; i++) {
                    var adir = a.dirs[i]
                    if (!adir.diff) {
                        avalon.mix(adir, directives[adir.type])
                    }
                    //diff时依次传入指令的旧值,指令的新值, 旧的虚拟DOM, 新的虚拟DOM

                    if (adir.diff && adir.diff(adir.value, bdir.value, a, b)) {
                        toDOM(a)

                        adir.inited = true

                        adir.update(adir.value, a, b, afterCb)
                            //如果组件没有加载,a,b分别为wbr, #comment
                            //如果成功加载,a,b分别为div, div
                            //如果是widget, a.dom会被删掉
                        if (a.dom !== parentNode) {
                            toDOM(a)
                            var p = parentNode.parentNode

                            if (p) {
                                p.replaceChild(a.dom, parentNode)
                            }
                            parentNode = a.dom
                        }
                        if (!adir.removeName && parentNode.removeAttribute) {
                            parentNode.removeAttribute(adir.name)
                            adir.removeName = true
                        }
                    }
                    //ms-important会阻止继续diff
                    stop = stop || adir.delay
                }
            }

            //可以在这里回收节点
            if (b.nodeName === '#comment') {
                //ms-if ms-widget 元素节点要变成注释节点
                a.props = b.props = a.dom = null
                handleIf(a, b)
                stop = true
            }
            if (!a.vtype && !stop) {
                var childNodes = parentNode.childNodes
                var achild = a.children.concat()
                var bchild = b.children.concat()
                for (let i = 0; i < achild.length; i++) {

                    let c = achild[i]
                    let d = bchild[i]

                    if (d) { //如果数量相等则进行比较

                        let arr = diff(c, d)
                        if (typeof arr === 'number') {
                            directives['for'].update(c, d, achild, bchild, i, afterCb)
                            c = achild[i]
                            d = bchild[i]
                            diff(c, d)
                        }
                    }

                    if (c.dom !== childNodes[i]) {
                        if (!childNodes[i]) { //数量一致就添加
                            parentNode.appendChild(c.dom)
                        } else {
                            try {
                                parentNode.insertBefore(c.dom, childNodes[i])
                            } catch (e) {
                                avalon.log(c.dom, childNodes[i], 'error', e)
                            }
                        }
                    }
                }
                //移除多余节点
                if (childNodes.length > achild.length) {
                    let j = achild.length
                    while (childNodes[j]) {
                        collectNode(childNodes[j])
                            // parentNode.removeChild(childNodes[j])
                    }
                }
            }

            if (afterCb.length) {
                afterCb.forEach(function(fn) {
                    fn()
                })
            }
            if (a.staticID) {
                a.hasScan = true
            }
            break
    }

}

function handleIf(a, b) {
    handleDispose(a)
    for (var i in b) {
        a[i] = b[i]
    }
    toDOM(a)
}
export function diffSlots(a, b) {
    if (!a) {
        return
    }
    for (var i in a) {
        if (!a.hasOwnProperty(i))
            return
        var aslot = a[i]
        var bslot = b[i]
        aslot.forEach(function(el, index) {
            diff(el, bslot[index])
        })
    }

}
/**
 * 重置所有指令对象,因为diff的双方都是同一个虚拟DOM,那么指令对象也一样,需要去掉
 * inited属性,那么在比较时,oldVal就自动变成null
 */
function reInitDires(a) {
    if (a.dirs) {
        a.dirs.forEach(function(dir) {
            delete dir.inited
        })
    }

    if (a.children) {
        a.children.forEach(function(child) {
            reInitDires(child)
        })
    }
}

