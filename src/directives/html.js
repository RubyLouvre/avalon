import { avalon } from '../seed/core'

avalon.directive('html', {

    update: function(vdom, value) {
        this.beforeDispose()

        this.innerRender = avalon.scan('<div class="ms-html-container">' + value + '</div>', this.vm, function() {
            var oldRoot = this.root
            if(vdom.children)
               vdom.children.length = 0
            vdom.children = oldRoot.children
            this.root = vdom
            if (vdom.dom)
                avalon.clearHTML(vdom.dom)
        })

    },
    beforeDispose: function() {
        if (this.innerRender) {
            this.innerRender.dispose()
        }
    },
    delay: true
})