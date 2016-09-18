var onceWarn = true //只警告一次
var dom2vdom = require('../../strategy/dom2vdom')
function scan(nodes) {
    for (var i = 0, elem; elem = nodes[i++]; ) {
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
                var vtree = [dom2vdom(elem)]
                var now = new Date()
                elem.vtree = avalon.speedUp(vtree)

                var now2 = new Date()
                onceWarn && avalon.log('构建虚拟DOM耗时', now2 - now, 'ms')

                vm.$render = avalon.render(elem.vtree)
                avalon.scopes[vm.$id] = {
                    vmodel: vm,
                    local: {},
                    isTemp: true
                }
                var now3 = new Date()
                onceWarn && avalon.log('构建当前vm的$render方法耗时 ', now3 - now2, 'ms\n',
                        '如果此时间太长,达100ms以上\n',
                        '建议将当前ms-controller拆分成多个ms-controller,减少每个vm管辖的区域')
                avalon.rerenderStart = now3
                onceWarn = false
                avalon.batch($id)

            } else if (!$id) {
                scan(elem.childNodes)
            }
        }
    }
}


module.exports = avalon.scan = function (a) {
     /* istanbul ignore if */
    if (!a || !a.nodeType) {
        avalon.warn('[avalon.scan] first argument must be element , documentFragment, or document')
        return
    }
    scan([a])
}
avalon.scan.dom2vdom = avalon._hydrate = dom2vdom

function getController(a) {
    return a.getAttribute('ms-controller') ||
            a.getAttribute(':controller')
}