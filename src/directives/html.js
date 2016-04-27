avalon.directive('html', {
    parse: function (binding, num,el) {
        var isVoidTag = !!el.isVoidTag
        el.isVoidTag = false
        var ret = ["var htmlId =  " + avalon.parseExpr(binding),
            'vnode' + num + '.props["ms-html"]  = htmlId;',
            'vnode' + num + '._isVoidTag  = '+isVoidTag,
            'var obj  = avalon.htmlFactory(htmlId,' + num + ');',
            'try{eval(" new function(){"+ obj.render +"}")}catch(e){};',
            'vnode' + num + '.children = avalon.__html;']
        return ret.join('\n')+'\n'
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur.props[name]
        var preValue = pre.props[name]
        cur.isVoidTag = cur._isVoidTag
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
        if (node.nodeType !== 1) {
            return
        }
        if (node.querySelectorAll) {
            var nodes = node.querySelectorAll('[avalon-events]')
            avalon.each(nodes, function (el) {
                avalon.unbind(el)
            })
        } else {
            var nodes = node.getElementsByTagName('*')
            //IE6-7这样取所有子孙节点会混入注释节点
            avalon.each(nodes, function (el) {
                if (el.nodeType === 1 && el.getAttribute('avalon-events')) {
                    avalon.unbind(el)
                }
            })
        }
        //添加节点
        avalon.clearHTML(node)
        var fragment = document.createDocumentFragment()
        vnode.children.forEach(function (c) {
            fragment.appendChild(avalon.vdomAdaptor(c, 'toDOM'))
        })
        node.appendChild(fragment)
    }
})
