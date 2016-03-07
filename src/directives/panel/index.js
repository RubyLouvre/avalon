var template = require("text!./panel.html")
avalon.component("av:panel", {
    template: template,
    createVm: function (topVm, defaults,options) {
        var after = avalon.mix({}, defaults, options)
        var vm = avalon.mediatorFactory(topVm, after)
        return vm
    },
    defaults: {
        title: "标题"
    },
    diff: function (cur, pre) {

    },
    update: function (dom, node, parent) {
        var el = avalon.vdomAdaptor(node).toDOM()
        avalon(el).addClass(el.getAttribute("wid"))
        parent.replaceChild(el, dom)
    }
})