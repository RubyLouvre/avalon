var markID = require('../seed/lang.share').getLongID

var quote = avalon.quote

//Ref: http://developers.whatwg.org/webappapis.html#event-handler-idl-attributes
// The assumption is that future DOM event attribute names will begin with
// 'on' and be composed of only English letters.
var revent = /^ms-on-([a-z]+)/ 
var rfilters = /\|.+/g
var rvar = /([@$]?\w+)/g
var rstring = require('../seed/regexp').string
//基于事件代理的高性能事件绑定
avalon.directive('on', {
    priority: 3000,
    parse: function (binding, num) {
        var vars = binding.expr.replace(rstring, ' ').replace(rfilters, '').match(rvar)
        var canCache = vars.every(function (el) {
            return el.charAt(0) === '@' || el === '$event'
        })
        var vmDefine = 'vnode' + num + '.onVm = __vmodel__\n'
        var pid = quote(binding.name)
        if (canCache) {
            var fn = Function('return ' + avalon.parseExpr(binding, 'on'))()
            var uuid = markID(fn)
            avalon.eventListeners[uuid] = fn
            return vmDefine + 'vnode' + num + '.props[' + pid +
                    '] = avalon.eventListeners.' + uuid + '\n'
        } else {//如果闭包引用其他变量
            return vmDefine + 'vnode' + num + '.props[' + pid +
                    '] = ' + avalon.parseExpr(binding, 'on') + '\n'
        }
    },
    diff: function (cur, pre, steps, name) {
        var fn0 = cur.props[name]
        var fn1 = pre.props[name]
        
        if (fn0 !== fn1) {
            var match = name.match(revent)
            var type = match[1]
            var search = type + ':' + markID(fn0)
            cur.addEvents = cur.addEvents || {}
            cur.addEvents[search] = fn0

            if (typeof fn1 === 'function') {
                cur.removeEvents = cur.removeEvents || {}
                cur.removeEvents[type + ':' + fn1.uuid] = fn1
            }

            var list = cur.change || (cur.change = [])
            if(avalon.Array.ensure(list, this.update)){
                steps.count += 1
            }
            
        }
    },
    update: function (node, vnode) {
        var key, type, listener
        node.__av_context__ = vnode.onVm
        delete vnode.onVm
        for (key in vnode.removeEvents) {
            type = key.split(':').shift()
            listener = vnode.removeEvents[key]
            avalon.unbind(node, type, listener)
        }
        delete vnode.removeEvents
        for (key in vnode.addEvents) {
            type = key.split(':').shift()
            listener = vnode.addEvents[key]
            avalon.bind(node, type, listener)
        }
        delete vnode.addEvents
    }
})




