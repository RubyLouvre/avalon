function scan(nodes) {
    for (var i = 0, elem; elem = nodes[i++];) {
        if (elem.nodeType === 1) {
            var $id = getController(elem)
          
            var vm = avalon.vmodels[$id]
            if (vm && !vm.$element) {
                avalon(elem).removeClass('ms-controller')
                vm.$element = elem
                var now = new Date()
                //IE6-8下元素的outerHTML前面会有空白
                var text = elem.outerHTML.trim()
                elem.vtree = avalon.lexer(text)
                avalon.speedUp(elem.vtree)
                var now2 = new Date()
                avalon.log('create primitive vtree', now2 - now)
                vm.$render = avalon.render(elem.vtree)
                avalon.scopes[vm.$id] = {
                    vmodel: vm,
                    local: {}
                }
                var now3 = new Date()
                avalon.log('create template Function ', now3 - now2)
                avalon.rerenderStart = now3
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