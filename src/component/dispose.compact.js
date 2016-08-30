var ret = require('./dispose.share')
var fireDisposeHook = ret.fireDisposeHook
var fireDisposeHooks = ret.fireDisposeHooks
var fireDisposeHookDelay = ret.fireDisposeHookDelay


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
    //访问器属性需要用getOwnPropertyDescriptor处理
    var ep = Element.prototype, oldSetter
    function newSetter(html) {
        var all = avalon.slice(this.getElementsByTagName('*'))
        oldSetter.call(this, html)
        fireDisposeHooks(all)
    }
    try {
        var obj = Object.getOwnPropertyDescriptor(ep, 'innerHTML')
        var oldSetter = obj.set
        obj.set = newSetter
        Object.defineProperty(ep, 'innerHTML', obj)
    } catch (e) {
        //safari 9.1.2使用Object.defineProperty重写innerHTML会抛
        // Attempting to change the setter of an unconfigurable property.
        if (ep && ep.__lookupSetter__) {
            oldSetter = ep.__lookupSetter__('innerHTML')
            ep.__defineSetter__('innerHTML', newSetter)
        } else {
            throw e
        }
    }

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


function fn(dom) {
    if (window.chrome && window.MutationEvent) {
        byMutationEvent(dom)
    } else {
        try {
            byRewritePrototype(dom)
        } catch (e) {
            byPolling(dom)
        }
    }
}
fn.byMutationEvent = byMutationEvent
fn.byRewritePrototype = byRewritePrototype
fn.byPolling = byPolling

module.exports = fn
