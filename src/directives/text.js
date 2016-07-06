//此指令实际上不会操作DOM,交由expr指令处理
var update = require('./_update')

avalon.directive('text', {
    parse: function (copy, src, binding) {
        copy[binding.name] = 1
        src.children = []
        copy.children = '[{\nnodeType:3,\ntype:"#text",\ndynamic:true,' +
                '\nnodeValue:avalon.parsers.string(' +
                avalon.parseExpr(binding) + ')}]'
    },
    diff: function (copy, src) {
        if(!src.children.length){
           update(src, this.update)
        }
    },
    update: function(dom, vdom){
        if (dom && !vdom.isVoidTag ) {
            var parent = dom
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild)
            }
            var dom = document.createTextNode('x')
            parent.appendChild(dom)
            var a = {nodeType: 3, type:'#text', dom: dom}
            vdom.children.push(a)
        }
    }
})