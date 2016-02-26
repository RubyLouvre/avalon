var markID = require("../base/builtin").markID
var quote = require("../base/builtin").quote

//var hooks = require("../vdom/hooks")
//var addData = hooks.addData
//var addHooks = hooks.addHooks

//基于事件代理的高性能事件绑定
var rdash = /\(([^)]*)\)/
avalon.directive("on", {
    priority: 3000,
    parse: function (binding, num) {
        return  "vnode" + num + ".$vm = __vmodel__\n" +
                "vnode" + num + ".props[" + quote(binding.name) + "] = " +
                "avalon.caches[" + quote(binding.type + ":" + binding.expr) + "] = " +
                
                "avalon.caches[" + quote(binding.type + ":" + binding.expr) + "] || " +
                "avalon.parseExprProxy(" + quote(binding.expr) + ",'on');\n"
    },
    diff: function (cur, pre, type, name) {
        var curValue = cur.props[name]
        var preValue = pre.props[name]
        if (curValue !== preValue) {
            type = name.replace("av-on-","").replace(/-\d+$/,"")
            var uuid = markID(curValue)
            var search = type + ":" + uuid
            if (!avalon.__eventVM__[search]) {//注册事件回调
                avalon.__eventVM__[search] = cur.$vm
            }
            delete cur.vm
            cur.changeEvents = cur.changeEvents || {}
            cur.changeEvents[search] = curValue
            cur.change = cur.change || []
            avalon.Array.ensure(cur.change, this.update)
        }
    },

    update: function (node, vnode) {
        if (!vnode.disposed) {
            vnode._ = node
            for (var key in vnode.changeEvents) {
                var type = key.split(":").shift()
                var listener = vnode.changeEvents[key]
                avalon.bind(node, type.replace(/-\d+$/,""), listener)
            }
            delete vnode.changeEvents
        }
    }
})

function disposeOn() {
    if (this._) {
        avalon.unbind(this._)
        this._ = null
    }
}


