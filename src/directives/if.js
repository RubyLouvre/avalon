import { avalon } from '../seed/core'

avalon.directive('if', {

    priority: 5,

    diff: function(oldVal, newVal) {
        return true  
    },
    update: function(value, vdom) {
       
    }
})

