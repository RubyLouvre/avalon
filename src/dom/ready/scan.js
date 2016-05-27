var scanStatistics = 0
function scan(nodes, fn) {
    for (var i = 0, elem; elem = nodes[i++]; ) {
        if (elem.nodeType === 1) {
            var $id = getController(elem)
            if ($id) {
                ++scanStatistics
            }
            var vm = avalon.vmodels[$id]
            if (vm && !vm.$element) {
                cleanWhitespace(elem)//减少虚拟DOM的规模及diff, patch的时间
                avalon(elem).removeClass('ms-controller')
                vm.$element = elem
                var now = new Date()
                //IE6-8下元素的outerHTML前面会有空白
                elem.vtree = avalon.lexer(elem.outerHTML.trim())
                var now2 = new Date()
                avalon.log('create primitive vtree', now2 - now)
                vm.$render = avalon.render(elem.vtree)
                var now3 = new Date()
                avalon.log('create template Function ', now3 - now2)
                avalon.rerenderStart = now3
                avalon.batch($id, true)
                if(typeof fn === 'function'){
                    fn(vm)
                }
            } else if (!$id) {
                scan(elem.childNodes, fn)
            }
        }
    }
}
var notWhitespace = /\S/
function cleanWhitespace(target) {
    var keep
    for (var i = 0; i < target.childNodes.length; i++) {
        var node = target.childNodes[i]
        if ((node.nodeType === 3) && (!notWhitespace.test(node.nodeValue))) {
            keep = target.removeChild(node)
            i--
        } else if (node.nodeType === 1) {
            cleanWhitespace(node)
        }
    }
    if (target.childNodes.length === 0 && keep) {
        target.appendChild(keep)
    }
}
module.exports = avalon.scan = function (a, fn) {
    if (!a || !a.nodeType) {
        avalon.warn('[avalon.scan] first argument must be element , documentFragment, or document')
        return
    }
    scan([a], fn)
    scanStatistics = 0
}

function getController(a) {
    return a.getAttribute('ms-controller')
}