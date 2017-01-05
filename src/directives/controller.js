import { avalon, platform } from '../seed/core'
import { impDir } from './important'
var cachedCtrl = {}
avalon.directive('controller', {
    priority: 2,
    diff: impDir.diff,
    update: impDir.update,
    beforeDispose: impDir.beforeDispose,
    getScope: function(bname, upper) {
        var lower  = avalon.vmodels[bname]
        if (lower) {
            lower.$render = this
            if (lower && lower !== upper) {
                var key = upper.$id + '-' + bname
                if (cachedCtrl[key])
                    return cachedCtrl[key]
                return cachedCtrl[key] = platform.fuseFactory(upper, lower)
            }
            return lower
        }
        return upper
    }
})