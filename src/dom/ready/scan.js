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
                var str = elem.outerHTML
                avalon(elem).removeClass('ms-controller')
                vm.$element = elem
                var now = new Date() - 0
                var vtree = elem.vtree = avalon.lexer(str)
                avalon.log('create primitive vtree', new Date - now)
                now = new Date()
                vm.$render = avalon.render(vtree)
                avalon.log('create template Function ', new Date - now)
                avalon.rerenderStart = new Date
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