var getHTML = require('./htmlfy')
var first = true
function scan(nodes) {
    for (var i = 0, elem; elem = nodes[i++]; ) {
        if (elem.nodeType === 1) {
            var $id = getController(elem)

            var vm = avalon.vmodels[$id]
            if (vm && !vm.$element) {
                avalon(elem).removeClass('ms-controller')
                vm.$element = elem
                var now = new Date()
                //IE6-8下元素的outerHTML前面会有空白
                var text = getHTML(elem)//elem.outerHTML
                elem.vtree = avalon.lexer(text)
                avalon.speedUp(elem.vtree)
                var now2 = new Date()
                first && avalon.log('构建虚拟DOM耗时', now2 - now, 'ms')
                vm.$render = avalon.render(elem.vtree)
                avalon.scopes[vm.$id] = {
                    vmodel: vm,
                    local: {},
                    isTemp: true
                }
                var now3 = new Date()
                first && avalon.log('构建当前vm的$render方法耗时 ', now3 - now2, 'ms\n',
                        '如果此时间太长,达100ms以上\n',
                        '建议将当前ms-controller拆分成多个ms-controlelr,减少每个vm管辖的区域')
                avalon.rerenderStart = now3
                first = false
                avalon.batch($id)

            } else if (!$id) {
                scan(elem.childNodes)
            }
        }
    }
}

module.exports = avalon.scan = function (a) {
    if (!a || !a.nodeType) {
        avalon.warn('[avalon.scan] first argument must be element , documentFragment, or document')
        return
    }
    scan([a])
}

function getController(a) {
    return a.getAttribute('ms-controller') || a.getAttribute('ms-important')
}