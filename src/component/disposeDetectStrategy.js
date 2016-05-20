//用于chrome, safari
var tags = {}
function byCustomElement(name) {
    if (tags[name])
        return
    tags[name] = true
    var prototype = Object.create(HTMLElement.prototype)
    prototype.detachedCallback = function () {
        var dom = this
        setTimeout(function () {
            fireDisposeHook(dom)
        })
    }
    document.registerElement(name, prototype)
}

//http://stackoverflow.com/questions/11425209/are-dom-mutation-observers-slower-than-dom-mutation-events
//http://stackoverflow.com/questions/31798816/simple-mutationobserver-version-of-domnoderemovedfromdocument
function byMutationEvent(dom) {
    dom.addEventListener("DOMNodeRemovedFromDocument", function () {
        setTimeout(function () {
            fireDisposeHook(dom)
        })
    })
}
//用于IE8+, firefox
function byRewritePrototype() {
    if (byRewritePrototype.execute) {
        return
    }

    byRewritePrototype.execute = true
    var p = Node.prototype
    var _removeChild = p.removeChild
    p.removeChild = function (a, b) {
        _removeChild.call(this, a, b)
        if (a.nodeType === 1) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
    var _replaceChild = p.replaceChild
    p.replaceChild = function (a, b) {
        _replaceChild.call(this, a, b)
        if (a.nodeType === 1) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
    var _innerHTML = p.innerHTML
    p.innerHTML = function (html) {
        var all = this.getElementsByTagName('*')
        _innerHTML.call(this, html)
        fireDisposedComponents(all)
    }
    var _appendChild = p.appendChild
    p.appendChild = function (a) {
        _appendChild.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
    var _insertBefore = p.insertBefore
    p.insertBefore = function (a) {
        _insertBefore.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
}


//用于IE6,7
var checkDisposeNodes = []
var checkID = 0
function byPolling(dom) {
    avalon.Array.ensure(checkDisposeNodes, dom)
    if (!checkID) {
        checkID = setInterval(function () {
            for (var i = 0, el; el = checkDisposeNodes[i]; ) {
              if (false === fireDisposeHook(el)) {
                avalon.Array.removeAt(checkDisposeNodes, i)
              }else{
                i++
              }
            }
            if (checkDisposeNodes.length == 0) {
                clearInterval(checkID)
                checkID = 0
            }
        }, 1000)
    }
}


module.exports = {
    byPolling: byPolling,
    byMutationEvent: byMutationEvent,
    byCustomElement: byCustomElement,
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

function fireDisposedComponents(nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}