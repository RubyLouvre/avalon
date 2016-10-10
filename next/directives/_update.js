import {avalon} from '../seed/core'

export default function update(vdom, update, hookName) {
    if (hookName) {
        vdom.afterChange = vdom.afterChange || []
        avalon.Array.ensure(vdom.afterChange, update)
    } else {
        var dom = vdom.dom
        update(vdom.dom, vdom, dom && dom.parentNode)
    }
}
