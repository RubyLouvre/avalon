import { avalon, directives } from '../seed/core'
import { toDOM } from './toDOM'

// 以后要废掉vdom系列,action
//a是旧的虚拟DOM, b是新的
export function diff(a, b) {
    switch (a.nodeName) {
         
        case '#text':
            //两个文本节点进行比较
            toDOM(a)
            if (a.nodeValue !== b.nodeValue) {
                a.nodeValue = b.nodeValue
                console.log(b.nodeValue,'ppp')
                if (a.dom) {
                    a.dom.nodeValue = b.nodeValue
                }
            }
            break
        case '#comment':
             //两个注释节点进行比较
            toDOM(a)
            if (a.nodeName !== b.nodeName) {
                handleIf(a, b)
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
            if (a.staticRoot && a.hasScan) {
                toDOM(a)
                return
            }            
            toDOM(a)
            var parentNode = a.dom,  delay
            if (b.dirs) {
                for (var i = 0, bdir; bdir = b.dirs[i]; i++) {
                    var adir = a.dirs[i]
                    if (!adir.diff) {
                        avalon.mix(adir, directives[adir.type])
                    }
                   
                    if (adir.diff && adir.diff(adir.value, bdir.value, a, b)) {
                        toDOM(a)
                        adir.update(adir.value, a, b)
                        //如果是widget, a.dom会被删掉
                        if(a.dom !== parentNode){
                            console.log('组件指令已经执行')
                            var p = parentNode.parentNode
                            if(p){
                             
                               p.replaceChild(a.dom,parentNode)
                            }
                          
                            parentNode = a.dom
                        }
                        //如果是组件指令,那么a === b或至少保证a.nodeName === b.nodeNaem
                        if (!adir.removeName ) {
                            a.dom.removeAttribute(adir.name)
                            adir.removeName = true
                        }
                    } 
                     delay = delay || adir.delay

                }
            }
          if (a.nodeName !== b.nodeName) {
                if (b.nodeName === '#comment') {
                   toDOM(a)
                    //处理if指令
                    handleIf(a, b)
                   return
                }
           }
            if (!a.vtype && !delay) {

                var childNodes = parentNode.childNodes
                 
                var achild = a.children.concat()
                var bchild = b.children.concat()
                
                for (let i = 0; i < achild.length; i++) {
                  
                    let c = achild[i]
                    let d = bchild[i]
                 
                    if (d) { //如果数量相等则进行比较
                        let arr = diff(c, d)
                        if (typeof arr === 'number') {
                            //  console.log('数组扁平化', arr)
                            directives['for'].update(c, d, achild, bchild, i, parentNode)

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
                                avalon.log(c, c.dom, childNodes[i], 'error', e)
                            }
                        }
                    }
                }
                //移除多余节点
                if (childNodes.length > achild.length) {
                    let j = achild.length
                    while (childNodes[j]) {
                        parentNode.removeChild(childNodes[j])
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