import { avalon, config, directives } from '../../seed/lang.share'
import { variantByDom } from '../../strategy/variantByDom'
import { extractBindings } from '../../strategy/extractBindings'
import { parseText } from '../../strategy/parseText'

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

                vm.$element = elem
                elem.vtree = avalon.variantCommon(vtree)
                collectDeps(vtree[0])
                var now2 = new Date()
                onceWarn && avalon.log('构建虚拟DOM耗时', now2 - now, 'ms')

                vm.$render = avalon.render(elem.vtree)
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



function collectDeps(node, vm) {
    switch (node.nodeName) {
        case "#text":
            if (config.rexpr.test(node.nodeValue)) {
                var b = parseText(node.nodeValue)
                b.local = {}
                makeUpdate(b, vm, node)
            }
            break
        case '#comment':
            if (node.dynamic && node.end) {
                b = avalon.mix({
                    type: 'for',
                    name: 'ms-for'
                }, node.dynamic)
                makeUpdate(b, vm, node)
                b.update()
            }
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
                            //ms-text指令并不干活,只是负责生成了一个可变的文本节点
                            avalon.directives.text.parse({}, node, b)
                            var dom = b.dom
                            if (dom) {
                                dom.removeAttribute('ms-text')
                                dom.removeAttribute(':text')
                            }
                            break
                        case 'on':
                        case 'duplex':
                        case 'active':
                        case 'hover': //添加了事件的指令
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
    directives[b.type].parse(copy, src, b)
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
    b.update = updater
    if (!src.dynamic) {
        src.dynamic = {}
    }

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
        avalon.log(e)
        return
    }
    var copy = {
        vmodel: this.vmodel,
        local: this.local
    }
    copy[this.name] = value
    directives[this.type].diff(copy, this.vdom, this.name)
    var el = this.vdom, hooks = el.afterChange
    if (hooks) {//处理duplex的afterChange
        for (var hook, i = 0; hook = hooks[i++];) {
            hook(el.dom, el)
        }
        delete el.afterChange
    }
}