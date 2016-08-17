var update = require('./_update')
var reconcile = require('../strategy/reconcile')

avalon.directive('html', {
    parse: function (copy, src, binding) {
        if (!src.isVoidTag) {
            //将渲染函数的某一部分存起来,渲在c方法中转换为函数
            copy[binding.name] = avalon.parseExpr(binding)
            copy.vmodel = '__vmodel__'
            copy.local = '__local__'
        } else {
            copy.children = '[]'
        }
    },
    diff: function (copy, src, name) {
        var copyValue = copy[name] + ''

        if (!src.dynamic['ms-html'] || !src.render || copyValue !== src[name]) {
            src[name] = copyValue
           
            var oldTree = avalon.speedUp(avalon.lexer(copyValue))

            var render = avalon.render(oldTree, copy.local)
            src.render = render

            var newTree = render(copy.vmodel, copy.local)
            
            src.children = copy.children = newTree
            update(src, this.update)
        } else if (src.render) {
            var newTree = src.render(copy.vmodel, copy.local)
            copy.children = newTree
        }
    },
    update: function (dom, vdom, parent) {
        vdom.dynamic['ms-html'] = 1
        avalon.clearHTML(dom)
        dom.appendChild(avalon.domize(vdom.children))
    }
})
