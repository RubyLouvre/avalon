avalon.directive("css", {
    init: directives.attr.init,
    change: function (val, binding) {
        var elem = binding.element
        if (elem) {
            var change = addData(elem, "changeStyles")
            change[this.param] = val
            addHooks(this, binding)
        }
    },
    update: function (elem, vnode) {
        var change = vnode.changeStyles
        var wrap = avalon(elem)
        for (var name in change) {
            if (name !== "display") {
                wrap.css(name, change[name])
            }
        }
    }
})
