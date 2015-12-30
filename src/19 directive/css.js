avalon.directive("css", {
    init: directives.attr.init,
    change: function (val, binding) {
        var elem = binding.element
        if (!elem || elem.disposed)
            return
        var change = addData(elem, "changeCss")
        change[this.param] = val
        addHooks(this, binding)
    },
    update: function (elem, vnode) {
        var change = vnode.changeCss
        var wrap = avalon(elem)
        for (var name in change) {
            wrap.css(name, change[name])
        }
        delete vnode.changeCss
    }
})
