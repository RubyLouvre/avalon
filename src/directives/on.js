import { avalon, inBrowser } from '../seed/core'

import { addScope, makeHandle } from '../parser/index'

avalon.directive('on', {
    beforeInit: function() {
        this.getter = avalon.noop
    },
    init: function() {
        var vdom = this.node
        var underline = this.name.replace('ms-on-', 'e').replace('-', '_')
        var uuid = underline + '_' + this.expr.
        replace(/\s/g, '').
        replace(/[^$a-z]/ig, function(e) {
            return e.charCodeAt(0)
        })
        var fn = avalon.eventListeners[uuid]
        if (!fn) {
            var arr = addScope(this.expr)
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
            fn = new Function('$event', ret.join('\n'))
            fn.uuid = uuid
            avalon.eventListeners[uuid] = fn
        }


        var dom = avalon.vdom(vdom, 'toDOM')
        dom._ms_context_ = this.vm

        this.eventType = this.param.replace(/\-(\d)$/, '')
        delete this.param
        avalon(dom).bind(this.eventType, fn)
    },

    beforeDispose: function() {
        avalon(this.node.dom).unbind(this.eventType)
    }
})