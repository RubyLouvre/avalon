var template = require("text!./panel.html")
console.log(template)
avalon.component("av:panel", {
    template: template,
    createVm: function (topVm, option, defaults) {
        var after = avalon.mix({}, defaults, option)
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