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
        var vnodes = new HighConvertor(value)
        var render = this.innerRender = new Compiler(vnodes, vm, true)
        newVdom.children = vdom.children = render.fork(vm, newVdom.locale)
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