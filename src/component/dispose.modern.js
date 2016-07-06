
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
    //访问器属性需要用getOwnPropertyDescriptor处理
    var ep = Element.prototype
    function newSetter(html) {
        var all = avalon.slice(this.getElementsByTagName('*'))
        oldSetter.call(this, html)
        fireDisposedComponents(all)
    }
    var obj = Object.getOwnPropertyDescriptor(ep, 'innerHTML')
    var oldSetter = obj.set
    obj.set = newSetter
    Object.defineProperty(ep, 'innerHTML', obj)


    rewite('appendChild', function (fn, a) {
        fn.call(this, a)
        if (a.nodeType === 1 && this.nodeType === 11) {
            fireDisposeHookDelay(a)
        }
        return a
    })

    rewite('insertBefore', function (fn, a, b) {
        fn.call(this, a, b)
        if (a.nodeType === 1 && this.nodeType === 11) {
            fireDisposeHookDelay(a)
        }
        return a
    })
}

module.exports = function onComponentDispose(dom) {
    byRewritePrototype(dom)
}


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
        }
        return false
    }
}
function fireDisposeHookDelay(a) {
    setTimeout(function () {
        fireDisposeHook(a)
    }, 4)
}

function fireDisposedComponents(nodes) {
    for (var i = 0, el; el = nodes[i++]; ) {
        fireDisposeHook(el)
    }
}
