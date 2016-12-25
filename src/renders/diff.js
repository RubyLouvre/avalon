import { avalon, directives } from '../seed/core'
import { toDOM } from './toDOM'

// // 以后要废掉vdom系列,action
//a是旧的虚拟DOM, b是新的
export function diff(a, b) {
    switch (a.nodeName) {
        case '#text':
            toDOM(a)

            if (a.nodeValue !== b.nodeValue) {
                a.nodeValue = b.nodeValue
                if (a.dom) {
                    a.dom.nodeValue = b.nodeValue
                }
            }
            break
        case '#comment':
            toDOM(a)
            if (a.nodeName !== b.nodeName) {
                handleIf(a, b)
                toDOM(a)
            }
            break
        case '#document-fragment':
            diff(a.children, b.children)
            break
        case void(0):

            console.log('这是数组')

            return directives['for'].diff(a, b)
            break
        default:
          
            
            toDOM(a)
            if (a.staticRoot && a.hasScan) {
                return
            }
            var parentNode = a.dom
             if (a.nodeName !== b.nodeName) {
                handleIf(a, b)
                return
            }
            var delay
            if (b.dirs) {
                for (var i = 0, bdir; bdir = b.dirs[i]; i++) {
                    var adir = a.dirs[i]

                    if (!adir.diff) {
                        avalon.mix(adir, directives[adir.type])
                    }
                    delay = delay || adir.delay
                    if (adir.diff && adir.diff(adir.value, bdir.value, a, b)) {
                        toDOM(a)
                        adir.update(adir.value, a, b)
                        if (!adir.removeName) {
                            a.dom.removeAttribute(adir.name)
                            adir.removeName = true
                        }


                    } else {
                        if (!adir.diff)
                            console.log(adir, '没有diff方法')
                    }

                }
            }

            if (!a.vtype && !delay) {

                var childNodes = parentNode.childNodes
                var achild = a.children.concat()
                var bchild = b.children.concat()
                for (let i = 0; i < achild.length; i++) {
                    let c = achild[i]
                    let d = bchild[i]

                    if (d) {
                        let arr = diff(c, d)
                     

                        if (typeof arr === 'number') {
                            //  console.log('数组扁平化', arr)
                            directives['for'].update(c, d, achild, bchild, i, parentNode)

                            c = achild[i]
                            d = bchild[i]
                            diff(c, d)
                        }
                    }
                    //  toDOM(c)
                    if (c.dom !== childNodes[i]) {

                        if (!childNodes[i]) {
                            //  parentNode.removeChild(c.dom)
                            parentNode.appendChild(c.dom)
                        } else {
                            try {
                                parentNode.insertBefore(c.dom, childNodes[i])
                            } catch (e) {
                                console.log(c, c.dom, childNodes[i], 'error', e)
                            }
                        }
                    } else {
                        // parentNode.appendChild(c.dom)
                    }
                }
            }
            if (a.staticRoot) {
                a.hasScan = true
            }
            break
    }
}

function handleIf(a, b) {
    handleDispose(a)
    for (var i in a) {
        delete a[i]
    }
    for (var i in b) {
        a[i] = b[i]
    }
    toDOM(a)
}

function handleDispose(a) {
    if (a.dirs) {
        for (var i = 0, el; el = a.dirs[i++];) {
            if (el.beforeDispose) {
                el.beforeDispose()
            }
        }
    }
    var arr = a.children || Array.isArray(a) ? a : false
    if (arr) {
        for (var i = 0, el; el = arr[i++];) {
            handleDispose(el)
        }
    }
}