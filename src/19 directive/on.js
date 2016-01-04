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
        var elem = binding.element
        if (!elem || elem.disposed)
            return
        var type = binding.param
        var uuid = markID(listener)
        var key = type + ":" + uuid + "??"
        if (!avalon.__eventVM__[key]) {//注册事件回调
            avalon.__eventVM__[key] = binding.vmodel
        }
        var change = addData(elem, "changeEvents")// 创建一个更新包
        change[key] = listener
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


