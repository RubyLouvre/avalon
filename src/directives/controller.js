import { avalon, platform } from '../seed/core'
import { impDir } from './important'
var cachedCtrl = {}
avalon.directive('controller', {
    priority: 2,
    diff: impDir.diff,
    update: impDir.update,
    getScope: function(name, scope) {
        var v = avalon.vmodels[name]
        if (v) {
            v.$render = this
            if (scope && scope !== v) {
                var key = scope.$id + '-' + name
                if (cachedCtrl[key])
                    return cachedCtrl[key]
                return cachedCtrl[key] = platform.fuseFactory(scope, v)
            }
            return v
        }
        return scope
    }
})