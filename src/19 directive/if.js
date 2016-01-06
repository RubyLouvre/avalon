var rremoveIf = /^ms-if$/
avalon.directive("if", {
    is: function (a, b) {
        if (b === void 0)
            return false
        return Boolean(a) === Boolean(b)
    },
    init: function (binding) {
        var vnode = binding.element
        
        var templale = shimTemplate(vnode, rremoveIf) //防止死循环
        
        var component = new VComponent("ms-if", {
            ok: createVirtual(templale, true)[0],
            ng: new VComment("ms-if")
        }, templale)
       
        var arr = binding.siblings
        for (var i = 0, el; el = arr[i]; i++) {
            if (el === vnode) {
                arr[i] = component
                break
            }
        }
        delete binding.siblings
        binding.vnode = component
        return false
    },
    change: function (value, binding) {
        var elem = binding.element
        if (!elem || elem.disposed)
            return
        elem.ifValue = !!value
        if (value) {
            elem.children[0] = elem.props.ok
            updateVirtual([elem.props.ok], binding.vmodel)
        } else {
            elem.children[0] = elem.props.ng
        }
        addHooks(this, binding)

    },
    update: function (node, vnode, parent) {
        var dom = node, vdom = vnode.children[0]
        if (!node.keep) {//保存之前节点的引用,减少反复创建真实DOM
            var c = vdom.toDOM()
            c.keep = node
            node.keep = c
        }
        parent.replaceChild(node.keep, node)
        dom = node.keep
        if (dom.nodeType === 1) {
            updateEntity([dom], [vdom], parent)
        }
        return false
    }
})


