import { avalon } from '../seed/core'
import { Render } from '../renders/domRender'

avalon.directive('html', {
    diff: function(oldVal, newVal) { //oldVal, newVal, oldVdom, newVdom
        oldVal = (oldVal == null ? '' : oldVal).toString().trim()
        newVal = (newVal == null ? '' : newVal).toString().trim()

        if (oldVal !== newVal) {

            this.value = newVal || ' '
            return true
        }
    },
    update: function(value, vdom, newVdom) { //oldVal( == newVal), oldVdom, newVdom
        this.beforeDispose()

        var render = this.innerRender = new Render(value, newVdom.vm)
        var children = render.tmpl.exec(render.vm, render)
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