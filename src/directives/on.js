import { avalon, inBrowser } from '../seed/core'
import { ctrDir } from './controller'

import { addScope, makeHandle } from '../parser/index'

avalon.directive('on', {
    parse: function(value){
         var arr = addScope(value)
            var body = arr[0],
                filters = arr[1]
            body = makeHandle(body)

            if (filters) {
                filters = filters.replace(/__value__/g, '$event')
                filters += '\nif($event.$return){\n\treturn;\n}'
            }
            var ret = [
                'try{',
                '\tvar __vmodel__ = this;',
                '\t' + filters,
                '\treturn ' + body,
                '}catch(e){avalon.log(e, "in on dir")}'
            ].filter(function(el) {
                return /\S/.test(el)
            })
            return new Function('$event','$$l', ret.join('\n'))
    },
    diff: ctrDir.diff,
    update: function(value, vdom, _) {
        var uuid = (this.name+'_'+ value).
                replace(/^(\:|ms\-)/, 'e').
                replace('-', '_').
                replace(/\s/g, '').
                replace(/[^$a-z]/ig, function(e) {
                    return e.charCodeAt(0)
                })
        var fn = avalon.eventListeners[uuid]
        if (!fn) {
            fn = this.parse(value)
            fn.uuid = uuid
            avalon.eventListeners[uuid] = fn
        }
        var dom = vdom.dom
        dom._ms_context_ = _.vm
        dom._ms_local_ = _.local
        this.eventType = this.param.replace(/\-(\d)$/, '')
        this.vdom = vdom
        avalon(dom).bind(this.eventType, fn)
    },

    beforeDispose: function() {
        avalon(this.vdom.dom).unbind(this.eventType)
    }
})