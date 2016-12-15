import { avalon } from '../seed/core'

avalon.directive('expr', {
    update: function (vdom, value) {
        value = (value === null || value === '') ? '\u200b' : value
        vdom.nodeValue = value
        //https://github.com/RubyLouvre/avalon/issues/1834
        if(vdom.dom)
           vdom.dom.data = value
    }
})