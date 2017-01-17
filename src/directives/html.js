import { avalon } from '../seed/core'
import { Compiler } from '../vtree/Compiler'
import { HighConvertor } from '../vtree/HighConvertor'

avalon.directive('html', {
    diff: function(oldVal, newVal, vdom, newVdom) { //oldVal, newVal, oldVdom, newVdom
        if (!this.inited) {
            oldVal = null
        }
        oldVal = (oldVal == null ? '' : oldVal).toString().trim()
        newVal = (newVal == null ? '' : newVal).toString().trim()
        var render = this.innerRender
        if (oldVal !== newVal) {
            this.value = newVal
            return true
        } else if (render) {
            var children = render.fork(render.vm, newVdom.local)
            newVdom.children = children
        }
    },
    update: function(value, vdom, newVdom) {
        this.beforeDispose()
        var vm = newVdom.vm


        var nodes = (new HighConvertor(value)).nodes
        var render = this.innerRender = new Compiler(nodes, vm, true)
        var children = render.fork(vm, newVdom.locale)

        newVdom.children = vdom.children = children
        if (vdom.dom)
            avalon.clearHTML(vdom.dom)
    },
    beforeDispose: function() {
        if (this.innerRender) {
            this.innerRender.dispose()
            delete this.innerRender
        }
    }
})