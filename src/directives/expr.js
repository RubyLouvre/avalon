import { avalon } from '../seed/core'

avalon.directive('expr', {
    update: function (vdom, value) {
        vdom.nodeValue = value
        if(vdom.dom)
           vdom.dom.nodeValue = value
    }
})