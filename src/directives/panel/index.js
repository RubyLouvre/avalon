//var avalon  = require("avalon")

avalon.component("panel", {
    createVm: function (option, topVm) {

    },
    createRender: function (nodes) {
        return nodes
    },
    diff: function (cur, pre) {

    },
    update: function (dom, node, parent) {
        var el = avalon.vdomAdaptor(node).toDOM()
        avalon(el).addClass(el.getAttribute("wid"))
        parent.replaceChild(el, dom)
    }
})