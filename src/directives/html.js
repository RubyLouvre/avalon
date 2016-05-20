var update = require('./_update')

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
            update(cur, this.update, steps, 'html' )
        }
    },
    update: function (node, vnode) {
        if (node.nodeType !== 1) {
            return
        }
        //添加节点
        avalon.clearHTML(node)
        var fragment = document.createDocumentFragment()
        vnode.children.forEach(function (c) {
            c && fragment.appendChild(avalon.vdomAdaptor(c, 'toDOM'))
        })
        node.appendChild(fragment)
    }
})
