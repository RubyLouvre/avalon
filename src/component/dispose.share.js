function inDomTree(el) {
    while (el) {
        if (el.nodeType === 9) {
            return true
        }
        el = el.parentNode
    }
    return false
}

function fireDisposeHook(el) {
    if (el.nodeType === 1 && el.getAttribute('wid') && !inDomTree(el)) {
        var wid = el.getAttribute('wid')
        var docker = avalon.scopes[ wid ]
        if (!docker)
            return
        var vm = docker.vmodel
        docker.vmodel.$fire("onDispose", {
            type: 'dispose',
            target: el,
            vmodel: vm
        })
        if (docker && !el.getAttribute('cached')) {
            delete docker.vmodel
            delete avalon.scopes[ wid ]
            var is = el.getAttribute('is')
            var v = el.vtree
            detachEvents(v)
            if (v) {
                v[0][is + '-mount'] = false
                v[0]['component-ready:' + is] = false
            }
        }
        return false
    }
}
function detachEvents(arr) {
    for (var i in arr) {
        var el = arr[i]
        if (el.nodeType === 1) {
            for (var i in el) {
                if (i.indexOf('ms-on') === 0) {
                    delete el[i]
                }
            }
            if (el.children) {
                detachEvents(el.children)
            }
        }
    }
}
function fireDisposeHookDelay(a) {
    setTimeout(function () {
        fireDisposeHook(a)
    }, 4)
}
function fireDisposeHooks(nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}
module.exports = {
    fireDisposeHookDelay: fireDisposeHookDelay,
    fireDisposeHooks: fireDisposeHooks,
    fireDisposeHook: fireDisposeHook
}