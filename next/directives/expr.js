import { avalon } from '../seed/core'
import update from './_update'

avalon.directive('nodeValue', {
   
    diff: function (a, b, name) {
        var newValue = a[name]
        if (b[name] + '' !== newValue + '') {
            b[name] = newValue == null ? '' : newValue + ''
            update(b, this.update)
        }
    },
    update: function (dom, vdom) {
        if (!dom && vdom.parent) {
            dom = vdom.dom = document.createTextNode('')
            var p = vdom.parent
            while (p.firstChild) {
                p.removeChild(p.firstChild)
            }

            p.appendChild(dom)
        }
        dom.nodeValue = vdom.nodeValue
    }
})