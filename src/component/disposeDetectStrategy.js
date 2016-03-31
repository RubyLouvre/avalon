function fireDisposeHook(el) {
    if (el.nodeType === 1 && el.getAttribute('wid') && !avalon.contains(avalon.root, el)) {
        var wid = el.getAttribute('wid')
        var docker = avalon.resolvedComponents[ wid ]
        if (docker && docker.vmodel) {
            var vm = docker.vmodel
            docker.vmodel.$fire("onDispose", {
                type: 'dispose',
                target: el,
                vmodel: vm
            })
            vm.$element = null
            vm.$hashcode = false
            delete docker.vmodel
            delete avalon.resolvedComponents[ wid ]
            return false
        }
    }
}


avalon.fireDisposedComponents = function (nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}
//http://stackoverflow.com/questions/31798816/simple-mutationobserver-version-of-domnoderemovedfromdocument
module.exports = fireDisposeHook