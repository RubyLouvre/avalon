import { avalon } from
    '../../seed/core'
import { variantByDom } from
    '../../strategy/dom2vdom'
import extractBindings from '../../strategy/extractBindings'

avalon.scan = function (a) {
    /* istanbul ignore if */
    if (!a || !a.nodeType) {
        avalon.warn('[avalon.scan] first argument must be element , documentFragment, or document')
        return
    }
    scanNodes([a])
}
avalon._hydrate = variantByDom
var onceWarn = true //只警告一次

function scanNodes(nodes) {
    for (var i = 0, elem; elem = nodes[i++];) {
        if (elem.nodeType === 1) {
            var $id = getController(elem)

            var vm = avalon.vmodels[$id]
            if (vm && !vm.$element) {
                vm.$element = elem
                /* istanbul ignore if */
                if (avalon.serverTemplates && avalon.serverTemplates[$id]) {
                    var tmpl = avalon.serverTemplates[$id]
                    var oldTree = avalon.speedUp(avalon.lexer(tmpl))
                    var render = avalon.render(oldTree)
                    var vtree = render(vm)
                    var dom = avalon.vdom(vtree[0], 'toDOM')
                    vm.$element = dom
                    dom.vtree = vtree
                    vm.$render = render
                    elem.parentNode.replaceChild(dom, elem)
                    avalon.diff(vtree, vtree)
                    continue
                }

                //IE6-8下元素的outerHTML前面会有空白
                //第一次扫描就清空所有空白节点,并生成最初的vtree
                var vtree = [variantByDom(elem)]
                var now = new Date()
                collectDeps(vtree[0])
                vm.$element = elem
                elem.vtree = vtree
                //    elem.vtree = avalon.speedUp(vtree)

                var now2 = new Date()
                onceWarn && avalon.log('构建虚拟DOM耗时', now2 - now, 'ms')

                //    vm.$render = avalon.render(elem.vtree)
                avalon.scopes[vm.$id] = {
                    vmodel: vm,
                    local: {},
                    isTemp: true
                }
                var now3 = new Date()
                if (onceWarn && (now3 - now2 > 100)) {
                    avalon.log('构建当前vm的$render方法耗时 ', now3 - now2, 'ms\n',
                        '如果此时间太长,达100ms以上\n',
                        '建议将当前ms-controller拆分成多个ms-controller,减少每个vm管辖的区域')
                    onceWarn = false
                }
                avalon.rerenderStart = now3
                //  avalon.batch($id)

            } else if (!$id) {
                scanNodes(elem.childNodes)
            }
        }
    }
}

function getController(a) {
    return a.getAttribute('ms-controller') ||
        a.getAttribute(':controller')
}
var rlineSp = /\n\r?\s*/g

var config = avalon.config
function extractExpr(str) {
    var ret = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            ret.push({ expr: avalon._decode(value) })
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            ret.push({
                expr: avalon.unescapeHTML(value.replace(rlineSp, '')),
                type: 'nodeValue',
                name: 'nodeValue'
            })
            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return ret
}
function collectDeps(node, vm) {
    var dirs = avalon.directives
    switch (node.nodeName) {
        case "#text":

            if (avalon.config.rexpr.test(node.nodeValue)) {
                var a = extractExpr(node.nodeValue)
                if (a.length > 1) {
                    var v = '' //处理一个文本节点存在多个花括号的情况 
                    a.forEach(function (el) {
                        if (!el.type)
                            el.expr = '+' + avalon.quote(el.expr) + '+'
                        v += el.expr
                    })
                    a = [{
                        expr: v,
                        name: 'nodeValue',
                        type: 'nodeValue'
                    }]
                }
                if (a.length === 1) {
                    var b = a[0]
                    avalon.parseExpr(b)
                    makeUpdate(b, vm, node)
                }
            }
            break
        case '#comment':
            break
        default:
            var props = node.props
            if (props) {
                if (props['ms-controller']) {
                    var newVm = props['ms-controller']
                    newVm = avalon.vmodels[newVm]
                    if (!vm) {
                        vm = newVm
                    }
                }
                var bs = extractBindings(node, props)
                bs.forEach(function (b) {
                    
                    dirs[b.type].parse({}, node, b)
                    if (b.type === 'text'){
                        if(node.dom){
                            node.dom.removeAttribute('ms-text')
                            node.dom.removeAttribute(':text')
                        }
                         return
                    }
                       
                    makeUpdate(b, vm, node)
                    if(b.type === 'on'){
                        b.update()
                    }
                })

            }
            node.children.forEach(function (el) {
                collectDeps(el, vm)
            })
            break
    }
}
function makeUpdate(b, vm, node) {
   
       b.get = Function('__vmodel__', '__local__', b.get)
    var s = (b.get + '').replace(/\r?\n\/\*{2}\//, '')
    b.get.toString = function () { return s }
    b.vmodel = vm
    b.vdom = node
    if(!node.dynamic){
        node.dynamic = {}
    }
    b.update = updater
    if (b.paths) {
        b.paths.split(',').forEach(function (p) {
            vm.$watch(p, b)
        })
        delete b.paths
    }
}
function updater() {
    try {
        var value = this.get(this.vmodel, this.local)
    } catch (e) {
        return
    }
    
    var copy = {
        vmodel: this.vmodel,
        local: this.local
    }
    copy[this.name] = value
    avalon.directives[this.type].diff(copy, this.vdom, this.name)
}