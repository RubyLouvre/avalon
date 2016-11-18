
import { avalon } from '../seed/core'
import { cssDiff } from './css'
import { updateAttrs } from '../dom/attr/compact'

avalon.directive('attr', {
    diff: cssDiff,
    update: function (vdom, value) {
        var props = vdom.props
            for(var i in value){
               if(!!value[i] === false){
                  delete props[i]
                }else{
                   props[i] = value[i]
                }
            }
        var dom = vdom.dom
        if (dom && dom.nodeType === 1) {
            updateAttrs(dom, value)
        }
    }
})

