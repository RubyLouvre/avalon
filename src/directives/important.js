import { avalon } from '../seed/core'

var impDir = avalon.directive('important', {
    priority: 1,
    getScope: function(name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        throw 'error! no vmodel called ' + name
    },
    update: function(node, attrName, $id) {
        if (!avalon.inBrowser)
            return
        var dom = avalon.vdom(node, 'toDOM')
        if (dom.nodeType === 1) {
            dom.removeAttribute(attrName)
            avalon(dom).removeClass('ms-controller')
        }
        var vm = avalon.vmodels[$id]
        if(vm){
           vm.$element = dom
           vm.$render = this
           vm.$fire('onReady')
           delete vm.$events.onReady
        }
       
    }
})

export var impCb = impDir.update