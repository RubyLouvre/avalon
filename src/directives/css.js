var hooks = require("../vdom/hooks")
var addData = hooks.addData
var addHooks = hooks.addHooks

avalon.directive("css", {
    init: avalon.directives.attr.init,
    change: function (val, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        var change = addData(vnode, "changeCss")
        change[binding.param] = val

        addHooks(this, binding)
    },
    update: function (node, vnode) {
        var change = vnode.changeCss
        var wrap = avalon(node)
        for (var name in change) {
            wrap.css(name, change[name])
        }
        delete vnode.changeCss
    }
})
