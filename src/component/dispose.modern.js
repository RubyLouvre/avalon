var ret = require('./dispose.share')
var fireDisposeHook = ret.fireDisposeHook
var fireDisposeHooks = ret.fireDisposeHooks
var fireDisposeHookDelay = ret.fireDisposeHookDelay

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
        if (ep && ep._lookupSetter__) {
            oldSetter = ep.__lookupSetter__('innerHTML')
            ep.__defineSetter__('innerHTML', newSetter)
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

module.exports = function onComponentDispose(dom) {
    byRewritePrototype(dom)
}

