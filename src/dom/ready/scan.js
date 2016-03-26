var scanStatistics = 0
function scan(nodes) {
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
                var vtree = elem.vtree = avalon.lexer(elem.outerHTML)
                var now2 = new Date()
                avalon.log('create primitive vtree', now2 - now)
                vm.$render = avalon.render(vtree)
                var now3 = new Date()
                avalon.log('create template Function ', now3 - now2)
                avalon.rerenderStart = now3
                avalon.batch($id, true)

            } else if (!$id) {
                scan(elem.childNodes)
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
module.exports = avalon.scan = function (a) {
    if (!a || !a.nodeType) {
        avalon.warn('[avalon.scan] first argument must be element , documentFragment, or document')
        return
    }
    scan([a])
    if (scanStatistics === 0) {
        avalon.warn('[avalon.scan] your nodes must has "ms-controller" attribute')
    }
    scanStatistics = 0
}

function getController(a) {
    return a.getAttribute('ms-controller')
}