import { avalon, createAnchor } from '../seed/core'

avalon.directive('if', {
    delay: true,
    priority: 5,
    init: function () {
        this.placeholder = createAnchor('if')
        var props = this.node.props
        delete props['ms-if']
        delete props[':if']
        this.fragment = avalon.vdom(this.node, 'toHTML')

    },
    diff: function (newVal, oldVal) {
        var n = !!newVal
        if (oldVal === void 0 || n !== oldVal) {
            this.value = n
            return true
        }
    },
    update: function (vdom, value) {
        if (this.isShow === void 0 && value ){
            continueScan(this, vdom)
            return
        }
        this.isShow = value
        var placeholder = this.placeholder
        if (value) {
            var p = placeholder.parentNode
            continueScan(this, vdom)
            p && p.replaceChild(vdom.dom, placeholder)

        } else {//移除DOM
            this.boss && this.boss.destroy()
            var dom = vdom.dom
            if (!dom.parentNode || dom.parentNode.nodeType === 11) {
                vdom.dom = placeholder
            } else {
                var p = dom.parentNode
                p.replaceChild(placeholder, dom)
            }
        }
    }
})
function continueScan(instance, vdom){
    var boss = instance.boss = avalon.scan(instance.fragment, instance.vm)
    vdom.children = boss.root.children
    vdom.dom = boss.root.dom
}

