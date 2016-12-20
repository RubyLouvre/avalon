import { avalon } from '../seed/core'
import { Render } from '../renders/domRender'

avalon.directive('html', {
    diff: function(oldVal, newVal) {
        oldVal = (oldVal == null ? '' : oldVal).toString().trim()
        newVal = (newVal == null ? '' : newVal).toString().trim()

        if (oldVal !== newVal) {

            this.value = newVal || ' '
            return true
        }
    },
    update: function(value, vdom) {
        this.beforeDispose()

        var a = this.innerRender = new Render(value, this.vm)
        var children = a.tmpl.exec(a.vm, a)
        vdom.children = children
        if (vdom.dom)
            avalon.clearHTML(vdom.dom)

    },
    beforeDispose: function() {
        if (this.innerRender) {
            this.innerRender.dispose()
        }
    },
    delay: true
})