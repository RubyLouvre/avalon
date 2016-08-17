var Cache = require('../seed/cache')
var eventCache = new Cache(128)
var update = require('./_update')
var markID = require('../seed/lang.share').getLongID

var rfilters = /\|.+/g
//Ref: http://developers.whatwg.org/webappapis.html#event-handler-idl-attributes
// The assumption is that future DOM event attribute names will begin with
// 'on' and be composed of only English letters.
var rfilters = /\|.+/g
var rvar = /((?:\@|\$|\#\#)?\w+)/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rmson = /^ms\-on\-(\w+)/
//基于事件代理的高性能事件绑定
avalon.directive('on', {
    priority: 3000,
    parse: function (copy, src, binding) {
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
        copy.vmodel = '__vmodel__'
        copy.local = '__local__'
        copy[binding.name] = fn

    },
    diff: function (copy, src, name) {
        var fn = copy[name]
        var uuid = fn.uuid
        var srcFn = src[name] || {}
        var hasChange = false
       
      
        if (!src.dynamic[name] || srcFn.uuid !== uuid) {
            src[name] = fn
            avalon.eventListeners.uuid = fn
            hasChange = true
        }
    
        if (diffObj(src.local || {}, copy.local)) {
            hasChange = true
        }
        if (hasChange) {
            src.local = copy.local
            src.vmodel = copy.vmodel
            update(src, this.update)
        }
    },
    update: function (dom, vdom) {
        if (!dom || dom.nodeType > 1) //在循环绑定中，这里为null
            return
        var key, listener
        dom._ms_context_ = vdom.vmodel
        dom._ms_local = vdom.local
        for (key in vdom) {
            var match = key.match(rmson)
            if (match) {
                listener = vdom[key]
                vdom.dynamic[key] = 1
                avalon.bind(dom, match[1], listener)
            }
        }
    }
})

function diffObj(a, b) {
    for (var i in a) {//diff差异点
        if (a[i] !== b[i]) {
            return true
        }
    }
    return false
}

