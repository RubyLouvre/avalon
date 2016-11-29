import { avalon } from '../seed/core'

avalon.directive('html', {

    update: function(vdom, value) {
        this.boss && this.boss.dispose()
      
        this.boss = avalon.scan('<div class="ms-html-container">' + value + '</div>', this.vm, function() {
            
           
            var oldRoot = this.root
            vdom.children.splice(0)
            vdom.children = oldRoot.children
            this.root = vdom
            if(vdom.dom)
            avalon.clearHTML(vdom.dom)
        })
       
    },
    delay: true
})