
//http://stackoverflow.com/questions/11425209/are-dom-mutation-observers-slower-than-dom-mutation-events
//http://stackoverflow.com/questions/31798816/simple-mutationobserver-version-of-domnoderemovedfromdocument
function byMutationEvent(dom) {
    dom.addEventListener("DOMNodeRemovedFromDocument", function () {
        avalon.fireDisposedComponents = avalon.noop
        setTimeout(function () {
            fireDisposeHook(dom)
        })
    })
}
//用于IE6,7
var checkDisposeNodes = []
var checkID = 0
function byPolling(dom) {
    avalon.Array.ensure(checkDisposeNodes, dom)
    if (!checkID) {
        checkID = setInterval(function () {
            for (var i = 0, el; el = checkDisposeNodes[i++]; ) {
                if (false === fireDisposeHook(el)) {
                    avalon.Array.removeAt(checkDisposeNodes, i)
                    --i
                }
            }
            if (checkDisposeNodes.length == 0) {
                clearInterval(checkID)
                checkID = 0
            }
        }, 1000)
    }
}

//用于safari
var tags = {}
function byCustomElement(name) {
    if (tags[name])
        return
    tags[name] = true
    var prototype = Object.create(HTMLElement.prototype)
    prototype.detachedCallback = function () {
        var dom = this
        avalon.fireDisposedComponents = avalon.noop
        setTimeout(function () {
            fireDisposeHook(dom)
        })
    }
    document.registerElement(name, prototype)
}


//用于IE8+, firefox
function byRewritePrototype() {
    if (byRewritePrototype.execute) {
        return
    }
    byRewritePrototype.execute = true
    var _removeChild = Node.prototype.removeChild
    Node.prototype.removeChild = function (a, b) {
        _removeChild.call(this, a, b)
        if (a.nodeType === 1) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
    var _innerHTML = Node.prototype.innerHTML
    Node.prototype.innerHTML = function (html) {
        var all = this.getElementsByTagName('*')
        _innerHTML.call(this, html)
        fireDisposedComponents(all)
    }
    var _appendChild = Node.prototype.innerHTML
    Node.prototype.appendChild = function (a) {
        _appendChild.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
    }
    var _insertBefore = Node.prototype.insertBefore
    Node.prototype.insertBefore = function (a) {
        _insertBefore.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            setTimeout(function () {
                fireDisposeHook(a)
            })
        }
        return a
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

function fireDisposedComponents (nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}