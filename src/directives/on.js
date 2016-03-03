var markID = require("../base/builtin").markID
var quote = require("../base/builtin").quote
var parse = require("../parser/parse")


//基于事件代理的高性能事件绑定
var revent = /^av-on-(\w+)/
var rfilters = /\|.+/g
var rvar = /([@$]?\w+)/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
avalon.directive("on", {
    priority: 3000,
    parse: function (binding, num) {
        var vars = binding.expr.replace(rstring," ").replace(rfilters, "").match(rvar)
        var canCache = vars.every(function (el) {
            return el.charAt(0) === "@" || el === "$event"
        })
        var vmDefine = "vnode" + num + ".onVm = __vmodel__\n"
        var pid = quote(binding.name)
        if (canCache) {
            var fn = Function("return " + parse(binding, "on"))()
            var key = "on:" + binding.expr
            avalon.caches[key] = fn
            return vmDefine + "vnode" + num + ".props[" + pid +
                    "] = avalon.caches[" + quote(key) + "]\n"
        } else {
            return vmDefine + "vnode" + num + ".props[" + pid +
                    "] = " + parse(binding, "on") + "\n"
        }
    },
    diff: function (cur, pre, type, name) {
        var fn0 = cur.props[name]
        var fn1 = pre.props[name]
        if (fn0 !== fn1) {
            var match = name.match(revent)
            type = match[1]

            var search = type + ":" + markID(fn0)
            cur.addEvents = cur.addEvents || {}
            cur.addEvents[search] = fn0

            if (typeof fn1 === "function") {
                cur.removeEvents = cur.removeEvents || {}
                cur.removeEvents[type + ":" + fn1.uuid] = fn1
            }

            if (!avalon.__eventVM__[search]) {//注册事件回调
                avalon.__eventVM__[search] = cur.onVm
            }
            delete cur.onVm

            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node, vnode) {
        var key, type, listener
        for (key in vnode.removeEvents) {
            type = key.split(":").shift()
            listener = vnode.removeEvents[key]
            avalon.unbind(node, type, listener)
        }
        delete vnode.removeEvents
        for (key in vnode.addEvents) {
            type = key.split(":").shift()
            listener = vnode.addEvents[key]
            avalon.bind(node, type, listener)
        }
        delete vnode.addEvents
    }
})




