
var addHooks = require("../vdom/hooks").addHooks
var scanNodes = require("../scan/scanNodes")

var shimTemplate = require("../vdom/shimTemplate")
var VComponent = require("../vdom/VComponent")
var VComment = require("../vdom/VComment")
var updateEntity = require("../strategy/updateEntity")
var createVirtual = require("../strategy/createVirtual")
var rremoveIf = /^(?:ms|av)-if$/
avalon.directive("if", {
    is: function (a, b) {
        if (b === void 0)
            return false
        return Boolean(a) === Boolean(b)
    },
    init: function (binding) {
        var vnode = binding.element

        var templale = shimTemplate(vnode, rremoveIf) //防止死循环

        var component = new VComponent({
            type: "ms-if",
            props: {
                ok: createVirtual(templale)[0],
                ng: new VComment("ms-if")
            },
            children: [],
            template: templale
        })
        var arr = binding.siblings
        for (var i = 0, el; el = arr[i]; i++) {
            if (el === vnode) {
                arr[i] = component
                break
            }
        }
        delete binding.siblings
        binding.element = component
        return false
    },
    change: function (value, binding) {
        var elem = binding.element
        if (!elem || elem.disposed)
            return
        elem.isMount = !!value
        if (value) {
            elem.children[0] = elem.props.ok
            scanNodes([elem.props.ok], binding.vmodel)
        } else {
            elem.children[0] = elem.props.ng
        }
        addHooks(this, binding)

    },
    update: function (node, vnode, parent) {
        //vnode为#component
        if (!vnode.okDom) {
            vnode.okDom = node
        }
        if (!vnode.ngDom) {
            vnode.ngDom = vnode.props.ng.toDOM()
        }
        var curNode = vnode.isMount ? vnode.okDom : vnode.ngDom

        if (node !== curNode) {
            parent.replaceChild(curNode, node)
        }

        if (curNode.nodeType === 1) {
            updateEntity([curNode], [vnode.children[0]], parent)
        }
        return false
    }
})


avalon.components["ms-if"] = {
    toDOM: function (self) {
        return self.children[0].toDOM()
    }
}