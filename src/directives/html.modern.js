
avalon.directive('html', {
    parse: function (binding, num) {
        var ret = "var htmlId =  " + avalon.parseExpr(binding) + '\n'
        ret += 'vnode' + num + '.props["ms-html"]  = htmlId;\n'
        ret += 'vnode' + num + '.props.skipContent  = true;\n'
        ret += 'var obj  = avalon.htmlFactory(htmlId,' + num + ');\n'
        ret += 'try{eval(" new function(){"+ obj.render +"}")}catch(e){};\n'
        ret += 'vnode' + num + '.children = avalon.__html;\n'
        return ret
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur.props[name]
        var preValue = pre.props[name]
        cur.skipContent = false
        if (curValue !== preValue) {
            if (cur.props[name] !== preValue) {
                var list = cur.change || (cur.change = [])
                if (avalon.Array.ensure(list, this.update)) {
                    steps.count += 1
                }
            }
        }
    },
    update: function (node, vnode) {
        if(node.nodeType !== 1){
            return
        }
        var nodes = node.querySelectorAll('[avalon-events]')
        avalon.each(nodes, function (el) {
            avalon.unbind(el)
        })
        //添加节点
        avalon.clearHTML(node)
        var fragment = document.createDocumentFragment()
        vnode.children.forEach(function (c) {
            fragment.appendChild(avalon.vdomAdaptor(c, 'toDOM'))
        })
    }
})