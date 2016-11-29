import { avalon, createAnchor } from '../seed/core'

avalon.directive('if', {
    delay: true,
    priority: 5,
    init: function() {
        this.placeholder = createAnchor('if')
        var props = this.node.props
        delete props['ms-if']
        delete props[':if']
        this.fragment = avalon.vdom(this.node, 'toHTML')
    },
    diff: function(newVal, oldVal) {
        var n = !!newVal
        if (oldVal === void 0 || n !== oldVal) {
            this.value = n
            return true
        }
    },
    update: function(vdom, value) {
        if (this.isShow === void 0 && value) {
            continueScan(this, vdom)
            return
        }
        this.isShow = value
        var placeholder = this.placeholder

        if (value) {
            var p = placeholder.parentNode
            continueScan(this, vdom)
            p && p.replaceChild(vdom.dom, placeholder)
        } else { //移除DOM
            this.beforeDispose()
            vdom.nodeValue = 'if'
            vdom.nodeName = '#comment'
            delete vdom.children
            var dom = vdom.dom
            var p = dom && dom.parentNode
            vdom.dom = placeholder
            if (p) {
                p.replaceChild(placeholder, dom)
            }
        }
    },
    beforeDispose: function(){
        if (this.innerRender) {
            this.innerRender.dispose()
        }
    }
})

function continueScan(instance, vdom) {
    var innerRender = instance.innerRender = avalon.scan(instance.fragment, instance.vm)
    avalon.shadowCopy(vdom, innerRender.root)
    delete vdom.nodeValue
}