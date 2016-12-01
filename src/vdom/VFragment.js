import { avalon, createFragment } from '../seed/core'

export function VFragment(children, key, val, index) {
    this.nodeName = '#document-fragment'
    this.children = children
    this.key = key
    this.val = val
    this.index = index
    this.props = {}
}
VFragment.prototype = {
    constructor: VFragment,
    toDOM() {
        if (this.dom)
            return this.dom
        var f = this.toFragment()
            //IE6-11 docment-fragment都没有children属性 
        this.split = f.lastChild
        return this.dom = f
    },
    dispose() {
        this.toFragment()
        this.innerRender && this.innerRender.dispose()
        for (var i in this) {
            this[i] = null
        }
    },
    toFragment() {
        var f = createFragment()
        this.children.forEach(el =>
            f.appendChild(avalon.vdom(el, 'toDOM'))
        )
        return f
    },
    toHTML() {
        var c = this.children
        return c.map(el => avalon.vdom(el, 'toHTML')).join('')
    }
}