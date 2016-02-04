var markID = require("../base/builtin").markID

var hooks = require("../vdom/hooks")
var addData = hooks.addData
var addHooks = hooks.addHooks

//基于事件代理的高性能事件绑定
var rdash = /\(([^)]*)\)/
avalon.directive("on", {
    priority: 3000,
    init: function (binding) {
        var value = binding.expr
        binding.type = "on"
        // ms-on-mousemove-10
        binding.param = binding.param.replace(/-\d+$/, "")
        if (value.indexOf("(") > 0 && value.indexOf(")") > -1) {
            // aaa() aaa($event)当成aaa处理
            var matched = (value.match(rdash) || ["", ""])[1].trim()
            if (matched === "" || matched === "$event") {
                value = value.replace(rdash, "")
            }
        }
        binding.expr = value
        binding.element.dispose = disposeOn
    },
    change: function (listener, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        var type = binding.param
        var uuid = markID(listener)
        var search = type + ":" + uuid 
       
        if (!avalon.__eventVM__[search]) {//注册事件回调
            avalon.__eventVM__[search] = binding.vmodel
        }
        var change = addData(vnode, "changeEvents")// 创建一个更新包
        change[search] = listener
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        if (!vnode.disposed) {
            vnode._ = node
            for (var key in vnode.changeEvents) {
                var type = key.split(":").shift()
                var listener = vnode.changeEvents[key]
                avalon.bind(node, type, listener)
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


