import { avalon, inBrowser } from '../seed/core'


avalon.directive('text', {
    delay: true,
    init: function () {
        
        var node = this.node
        if (node.isVoidTag) {
            avalon.error('自闭合元素不能使用ms-text')
        }
        var child = { nodeName: '#text', nodeValue: this.getValue() }
        node.children.splice(0, node.children.length, child)
        if(inBrowser){
           avalon.clearHTML(node.dom)
           node.dom.appendChild( avalon.vdom(child,'toDOM'))
        }
        this.node = child
        var type = 'expr'
        this.type = this.name = type
        var directive = avalon.directives[type]
        var me = this
        this.callback = function (value) {
            directive.update.call(me, me.node, value)
        }
    }
})
