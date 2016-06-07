var markID = require('../seed/lang.share').getLongID
var Cache = require('../seed/cache')
var eventCache = new Cache(128)
var quote = avalon.quote
var update = require('./_update')

//Ref: http://developers.whatwg.org/webappapis.html#event-handler-idl-attributes
// The assumption is that future DOM event attribute names will begin with
// 'on' and be composed of only English letters.
var revent = /^ms-on-([a-z]+)/
var rfilters = /\|.+/g
var rvar = /((?:\@|\$|\#\#)?\w+)/g
var rstring = require('../seed/regexp').string
//基于事件代理的高性能事件绑定
avalon.directive('on', {
    priority: 3000,
    parse: function (cur, pre, binding) {
        var vars = binding.expr.replace(rstring, ' ').replace(rfilters, '').match(rvar)
        var canCache = vars.every(function (el) {
            return el.charAt(0) === '@' || el.slice(0, 2) === '##' || el === '$event'
        })
        cur.vmodel = '__vmodel__'
        if (canCache) {
            var key = binding.expr
            var fn = eventCache.get(key)
            if (!fn) {
                var fn = Function('return ' + avalon.parseExpr(binding, 'on'))()
                var uuid = markID(fn)
                eventCache.put(key, fn)
            }else{
                uuid = fn.uuid
            }
            
            avalon.eventListeners[uuid] = fn
            cur[binding.name] = 'avalon.eventListeners.' + uuid
        } else {//如果闭包引用其他变量
            cur[binding.name] = avalon.parseExpr(binding, 'on')

        }
    },
    diff: function (cur, pre, steps, name) {
        var cFn = cur[name]
        var pFn = pre[name]
        if (cFn !== pFn) {
            if (typeof pFn === 'function' && typeof cFn === 'function') {
                var pid = pFn.uuid
                cFn.uuid = pid
                avalon.eventListeners[ pid ] = cFn
                return
            }
            var match = name.match(revent)
            var type = match[1]
            var search = type + ':' + markID(cFn)
            cur.addEvents = cur.addEvents || {}
            cur.addEvents[search] = cFn
            update(cur, this.update, steps, 'on')
        }
    },
    update: function (node, vnode) {
        if (!node || node.nodeType > 1) //在循环绑定中，这里为null
            return
        var key, type, listener
        node._ms_context_ = vnode.vmodel
        for (key in vnode.addEvents) {
            type = key.split(':').shift()
            listener = vnode.addEvents[key]
            avalon.bind(node, type, listener)
        }
        delete vnode.addEvents
    }
})
