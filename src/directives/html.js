var update = require('./_update')

avalon._createChildren = function (fn, vmodel, local) {
    var text = fn() + ''
    if (!avalon.caches[text]) {
        var oldTree = avalon.variant(avalon.lexer(text))
        var render = avalon.render(oldTree, local)
        avalon.caches[text] = render
    }
    var render = avalon.caches[text]
    var s = avalon.spath//9.12 弹制渲染所有东西
    delete avalon.spath
    var vtree = render(vmodel, local)
    avalon.spath = s
    vtree.text = text
    return vtree
}
avalon.directive('html', {
    parse: function (copy, src, binding) {
        //将渲染函数的某一部分存起来,渲在c方法中转换为函数
        copy[binding.name] = 1
        copy.children = 'avalon._createChildren(' + [avalon.parseExpr(binding), '__vmodel__', '__local__'] + ')'
    },
    diff: function (copy, src, name) {
        if (copy.children.text !== src.text) {
            src.text = copy.children.text
            src.children = copy.children
            update(src, this.update)
        }
    },
    update: function (dom, vdom) {
        vdom.dynamic['ms-html'] = 1
        avalon.clearHTML(dom)
        dom.appendChild(avalon.domize(vdom.children))
    }
})
