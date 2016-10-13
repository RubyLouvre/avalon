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
                var b = a[0]
                b.local = {}
                makeUpdate(b, vm, node)
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
                    switch (b.type) {
                        case 'controller':
                        case 'important':
                            return
                        case 'text':
                            var dom = b.dom
                            if (dom) {
                                dom.removeAttribute('ms-text')
                                dom.removeAttribute(':text')
                            }
                            break
                        case 'on':
                        case 'duplex':
                            makeUpdate(b, vm, node)
                            b.update()
                            break
                        default:
                             makeUpdate(b, vm, node)
                             break
                    }
                })
            }
            node.children.forEach(function (el) {
                collectDeps(el, vm)
            })
            
            break
    }
}
function makeUpdate(b, vm, src) {
    var name = b.name
    var copy = {}
    copy.props = src.props
    avalon.directives[b.type].parse(copy, src, b)
    var body = copy[name]
    if (name === 'nodeValue') {
        /**
         *将
```
(function (){
try{
var __value__ = __vmodel__.b
__value__ =  avalon.parsers.string(__value__)
__value__ = avalon.composeFilters(["uppercase"],["truncate",5])(__value__)
return __value__
}catch(e){
	avalon.warn(e, "parse nodeValue binding【 @b|uppercase | truncate(5) 】fail")
	return ""
}
})()
```
        变成
```
avalon.composeFilters(["uppercase"],["truncate",5])(avalon.parsers.string(__vmodel__.b))       
```
         */
        var arr = body.split('\n').slice(2, 5).map(function (s) {
            return s.replace('__value__ = ', '')
        })
        body = arr[0].replace('var ', '').trim()
        body = arr[1].replace('__value__', body)
        if (arr[2].indexOf('composeFilters') !== -1) {
            body = arr[2].replace('__value__', body)
        }
    }
    var get = Function('__vmodel__', '__local__', 'return ' + body)
    b.get = get
    b.update = updater
    var s = (get + '').replace(/\r?\n\/\*{2}\//, '')
    b.get.toString = function () {
        return s
    }
    b.vmodel = vm
    b.vdom = src
    if (!src.dynamic) {
        src.dynamic = {}
    }
    b.update = updater
    if (b.paths) {
        b.paths.split(',').forEach(function (p) {
            console.log(name, p)
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
    var el = this.vdom, hooks = el.afterChange
    if(hooks){//处理duplex的afterChange
        for (var hook, i = 0; hook = hooks[i++];) {
            hook(el.dom, el)
        }
        delete el.afterChange
    }
}