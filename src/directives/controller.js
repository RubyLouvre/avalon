import { avalon,platform } from '../seed/core'
import { impCb } from './important'
avalon.directive('controller', {
    priority: 2,
    getScope: function (name, scope) {
        var v = avalon.vmodels[name]
        if (v){
            v.$render = this
            if(scope && scope !== v){
               return platform.fuseFactory(scope, v) 
            }
            return v
        }
        return scope
    },
    update: impCb
})