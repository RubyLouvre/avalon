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
        var underline = binding.name.replace('ms-on-', 'e').replace('-', '_')
        var uuid = underline + '_' + binding.expr.
                replace(/\s/g, '').
                replace(/[^$a-z]/ig, function (e) {
                    return e.charCodeAt(0)
                })

        var quoted = avalon.quote(uuid)
        var fn = '(function(){\n' +
                'var fn610 = ' +
                avalon.parseExpr(binding, 'on') +
                
                '\nfn610.uuid =' + quoted + ';\nreturn fn610})()'
        cur.vmodel = '__vmodel__'
        cur.local = '__local__'
        cur[binding.name] = fn

    },
    diff: function (cur, pre, steps, name) {
        var fn = cur[name]
        var uuid = fn.uuid
        var type = uuid.split('_').shift()
        var search = type.slice(1) + ':' + uuid
        var preFn = pre[name]
        if(!preFn || preFn.uuid !== uuid ){
            cur.addEvents = cur.addEvents || {}
            cur.addEvents[search] = fn
            avalon.eventListeners.uuid = fn
        }
        update(cur, this.update, steps, 'on')

    },
    update: function (node, vnode) {
        if (!node || node.nodeType > 1) //在循环绑定中，这里为null
            return
        var key, type, listener
        node._ms_context_ = vnode.vmodel
        node._ms_local = vnode.local
        for (key in vnode.addEvents) {
            type = key.split(':').shift()
            listener = vnode.addEvents[key]
            avalon.bind(node, type, listener)
        }
        delete vnode.addEvents
    }
})
