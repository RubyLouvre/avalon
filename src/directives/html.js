
var disposeVirtual = require("../strategy/disposeVirtual")
var createVirtual = require("../strategy/createVirtual")

var pushArray = require("../base/builtin").pushArray
var scanNodes = require("../scan/scanNodes")
var addHooks = require("../vdom/hooks").addHooks

avalon.directive("html", {
    change: function (value, binding) {
        var vnode = binding.element
        if (!vnode || vnode.disposed)
            return
        value = typeof value === "string" ? value : String(value)
        disposeVirtual(vnode.children)
        var children = createVirtual(value)
        pushArray(vnode.children, scanNodes(children, binding.vmodel))
        addHooks(this, binding)
    },
    update: function (node, vnode) {
        if (window.Rage) {
            node.innerHTML = vnode.children.map(function (el) {
                return el.toHTML()
            }).join("")
        } else {
            avalon.clearHTML(node)
            for (var i = 0, el; el = vnode.children[i++]; ) {
                node.appendChild(el.toDOM())
            }
        }
        //这里就不用劳烦用created, disposed
    }
})
