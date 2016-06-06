var update = require('./_update')
var parseView = require('../strategy/parser/parseView')

avalon.htmlFactory = function (str, vm, local) {
    var vtree = avalon.lexer(str + "")
    var e = avalon.render(vtree)
    return  e(vm, local)
}

avalon.directive('html', {
    parse: function (cur, pre, binding) {
        if (!pre.isVoidTag) {
            //将渲染函数的某一部分存起来,渲在c方法中转换为函数
            cur[binding.name] = avalon.parseExpr(binding)
            delete pre.children
            cur.children = 'avalon.htmlFactory(' + avalon.parseExpr(binding) + ',__vmodel__,__local__)'
        }else{
            cur.children = '[]'
        }
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur[name]
        var preValue = pre[name]

        if (curValue !== preValue) {
            update(cur, this.update, steps, 'html')
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
