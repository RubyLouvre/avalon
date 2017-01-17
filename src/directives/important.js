import { avalon } from '../seed/core'

export var impDir = avalon.directive('important', {
    priority: 1,
    getScope: function(name, scope) {
        var v = avalon.vmodels[name]
        if (v)
            return v
        throw 'error! no vmodel called ' + name
    },
    diff: function(oldVal, newVal, vdom, newVdom) {
        if (!this.inited) {
            oldVal = null
        }
        if (this.inited) {
            this.delay = newVdom.topVm && newVdom.vm !== newVdom.topVm
        }
        if (oldVal !== newVal) {
            this.value = newVal
            return true
        }
    },

    update: function(val, vdom, newVdom, afterCb) {
        var vm = newVdom.vm
        var cur = newVdom.curVm
        if(cur){//改写当前vm的渲染器vm为融合vm
           cur.$render.vm = vm
        }
       
        afterCb.push(function() {
            var dom = vm.$element = vdom.dom
            avalon(dom).removeClass('ms-controller')
            var fn = vm.$hooks.onReady
            if (fn) {
                fn({
                    vmodel: vm,
                    target: dom,
                    type: 'ready'
                })
            }

        })

    },
    beforeDispose: function() {
        var vm = this.vm
        if (vm) {
            var fn = vm.$hooks.onDispose
            delete this.vm
            if (fn) {
                fn({
                    vmodel: vm,
                    target: vm.$element,
                    type: 'dispose'
                })
            }
        }

    }
})