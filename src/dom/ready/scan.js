function scan(nodes) {
    for (var i = 0, elem; elem = nodes[i++]; ) {
        if (elem.nodeType === 1) {
            var $id = elem.getAttribute('a-controller') || elem.getAttribute('ms-controller')
            var vm = avalon.vmodels[$id]
            if (vm && !vm.$element) {
                var str = elem.outerHTML
                avalon(elem).removeClass('ms-controller a-controller')

                vm.$element = elem
                var now = new Date - 0
                var vnode = avalon.lexer(str)
                avalon.log('create primitive vtree', new Date - now)
                now = new Date
                vm.$render = avalon.render(vnode)
                avalon.log('create template Function ', new Date - now)
                avalon.rerenderStart = new Date
                elem.vnode = vnode
                avalon.batch($id, true)

            } else if (!$id) {
                scan(elem.childNodes)
            }
        }
    }
}

module.exports = avalon.scan = function (a) {

    avalon.warn('[avalon.scan] is inner method that only invokes once!')

    a && a.nodeType && scan([a])
}