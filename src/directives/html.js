import { avalon } from '../seed/core'
import { Render } from '../renders/domRender'

avalon.directive('html', {
    diff: function(a, b, vdom, dir){
        a = (a == null ? '': a ).toString().trim()
        b = (b == null ? '': b).toString().trim()
        
        if(a !== b){
            this.vm = dir.vm
            this.value = a || ' '
            return true
        }
    },
    update: function(vdom, value) {
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