
avalon.directive("cloak", {
    parse: function (binding, num) {
        return "vnode" + num + ".props['av-cloak'] = false\n"
    },
    diff: function (cur, pre, type, name) {//curNode, preNode
        if (cur.props[name] !== pre.props[name]) {
            var list = cur.change || (cur.change = [])
            avalon.Array.ensure(list, this.update)
        }
    },
    update: function (node) {
        node.removeAttribute("av-cloak")
        node.removeAttribute("ms-cloak")
        avalon(node).removeClass("av-cloak ms-cloak")
    }
})