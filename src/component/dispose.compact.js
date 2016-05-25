

//http://stackoverflow.com/questions/11425209/are-dom-mutation-observers-slower-than-dom-mutation-events
//http://stackoverflow.com/questions/31798816/simple-mutationobserver-version-of-domnoderemovedfromdocument
function byMutationEvent(dom) {
    dom.addEventListener("DOMNodeRemovedFromDocument", function () {
        fireDisposeHookDelay(dom)
    })
}
//用于IE8+, firefox
function byRewritePrototype() {
    if (byRewritePrototype.execute) {
        return
    }
//https://www.web-tinker.com/article/20618.html?utm_source=tuicool&utm_medium=referral
//IE6-8虽然暴露了Element.prototype,但无法重写已有的DOM API
    byRewritePrototype.execute = true
    var p = Node.prototype
    function rewite(name, fn) {
        var cb = p[name]
        p[name] = function (a, b) {
            return  fn.call(this, cb, a, b)
        }
    }
    rewite('removeChild', function (fn, a, b) {
        fn.call(this, a, b)
        if (a.nodeType === 1) {
            fireDisposeHookDelay(a)
        }
        return a
    })

    rewite('replaceChild', function (fn, a, b) {
        fn.call(this, a, b)
        if (a.nodeType === 1) {
            fireDisposeHookDelay(a)
        }
        return a
    })

    rewite('innerHTML', function (fn, html) {
        var all = this.getElementsByTagName('*')
        fn.call(this, html)
        fireDisposedComponents(all)
    })

    rewite('appendChild', function (fn, a) {
        fn.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            fireDisposeHookDelay(a)
        }
        return a
    })

    rewite('insertBefore', function (fn, a) {
        fn.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            fireDisposeHookDelay(a)
        }
        return a
    })
}

//用于IE6~8
var checkDisposeNodes = []
var checkID = 0
function byPolling(dom) {
    avalon.Array.ensure(checkDisposeNodes, dom)
    if (!checkID) {
        checkID = setInterval(function () {
            for (var i = 0, el; el = checkDisposeNodes[i]; ) {
                if (false === fireDisposeHook(el)) {
                    avalon.Array.removeAt(checkDisposeNodes, i)
                } else {
                    i++
                }
            }
            if (checkDisposeNodes.length == 0) {
                clearInterval(checkID)
                checkID = 0
            }
        }, 700)
    }
}


module.exports = {
    byPolling: byPolling,
    byMutationEvent: byMutationEvent,
    byRewritePrototype: byRewritePrototype
}

function fireDisposeHook(el) {
    if (el.nodeType === 1 && el.getAttribute('wid') && !avalon.contains(avalon.root, el)) {
        var wid = el.getAttribute('wid')
        var docker = avalon.resolvedComponents[ wid ]
        var vm = docker.vmodel
        var cached = !!docker.cached
        docker.vmodel.$fire("onDispose", {
            type: 'dispose',
            target: el,
            vmodel: vm,
            cached: cached
        })
        if (docker && docker.vmodel && !cached) {
            vm.$element = null
            vm.$hashcode = false
            delete docker.vmodel
            delete avalon.resolvedComponents[ wid ]
        }
        return false
    }
}
function fireDisposeHookDelay(a){
    setTimeout(function () {
        fireDisposeHook(a)
    },4)
}
function fireDisposedComponents(nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}