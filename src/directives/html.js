import { avalon } from '../seed/core'

avalon.directive('html', {
    update: function (vdom, value) {
        this.boss && this.boss.destroy()

        this.boss = avalon.scan('<div>' + value + '</div>', this.vm, function () {
            var oldRoot = this.root
            vdom.children = oldRoot.children
            this.root = vdom
            avalon.clearHTML(vdom.dom)
        })


    },
    delay: true
})