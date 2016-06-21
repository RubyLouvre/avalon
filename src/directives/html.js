var update = require('./_update')
var parseView = require('../strategy/parser/parseView')
var reconcile = require('../strategy/reconcile')


avalon.directive('html', {
    parse: function (cur, pre, binding) {
        
        if (!pre.isVoidTag) {
            //将渲染函数的某一部分存起来,渲在c方法中转换为函数
            cur[binding.name] = avalon.parseExpr(binding)
            cur.vmodel = '__vmodel__'
            cur.local = '__local__'
        }else{
            cur.children = '[]'
        }
    },
    diff: function (cur, pre, steps, name) {
        var curValue = cur[name]+''
        if (curValue !== pre[name]) {
            pre[name] = curValue
            var preTree = avalon.lexer(curValue)
            avalon.speedUp(preTree)
            pre.children = preTree
            var render =  avalon.render(preTree)
            pre.render = render
            var curTree = render(cur.vmodel, cur.local)
            cur.children = curTree
            update(pre, this.update, steps, 'html')
        }else{
            var curTree = pre.render(cur.vmodel, cur.local)
            cur.children = curTree
        }
    },
 
    update: function(dom, vdom){
        avalon.clearHTML(dom)
        var f = avalon.vdomAdaptor(vdom.children)
        reconcile(f.children, vdom.children)
        dom.appendChild(f)        
    }
})
