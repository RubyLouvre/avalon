//此指令实际上不会操作DOM,交由expr指令处理
avalon.directive('text', {
    parse: function (copy, src, binding) {
        copy[binding.name] = 1
        src.children = []
        copy.children = '[{\nnodeType:3,\ntype:"#text",\ndynamic:true,' +
                '\nnodeValue:avalon.parsers.string(' +
                avalon.parseExpr(binding) + ')}]'
    },
    diff: function (copy, src, name) {
        if (src.dom && !src.isVoidTag && !src.children.length) {
            var parent = src.dom
            while (parent.firstChild) {
                parent.removeChild(parent.firstChild)
            }
            var dom = document.createTextNode('x')
            parent.appendChild(dom)
            var vdom = {nodeType: 3, type:'#text', dom: dom}
            src.children.push(vdom)
        }
    },
    update: avalon.noop
})