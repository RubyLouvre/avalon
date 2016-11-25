import { avalon, inBrowser } from '../seed/core'

import { Action, protectedMenbers } from '../vmodel/Action'

/**
 * 一个directive装饰器
 * @returns {directive}
 */
// DirectiveDecorator(scope, binding, vdom, this)
// Decorator(vm, options, callback)
export function Directive(vm, binding, vdom, render) {
    var type = binding.type
    var decorator = avalon.directives[type]
    if (inBrowser) {
        var dom = avalon.vdom(vdom, 'toDOM')
        if (dom.nodeType === 1) {
            dom.removeAttribute(binding.attrName)
        }
        vdom.dom = dom
    }
    var callback = decorator.update ? function (value) {
        if (!render.mount && /css|visible|duplex/.test(type)) {
            render.callbacks.push(function () {
                decorator.update.call(directive, directive.node, value)
            })
        } else {
            decorator.update.call(directive, directive.node, value)
        }

    } : avalon.noop
    for (var key in decorator) {
        binding[key] = decorator[key]
    }
    binding.node = vdom
    var directive = new Action(vm, binding, callback)
    if(directive.init){
        //这里可能会重写node, callback, type, name
        directive.init()
    }
    directive.update()
    return directive
}
