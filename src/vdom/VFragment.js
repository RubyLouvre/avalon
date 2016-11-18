import { avalon, createFragment } from '../seed/core'

export function VFragment(children, key, val, index) {
    this.nodeName = '#document-fragment'
    this.children = children || []
    this.key = key
    this.val = val
    this.index = index
    this.props = {}
}

VFragment.prototype = {
    constructor: VFragment,
    toDOM: function () {
        if (this.dom)
            return this.dom
        var f = this.toFragment()
        //IE6-11 docment-fragment都没有children属性 
        this.split = f.lastChild
        return this.dom = f
    },
    destory: function () {
        this.toFragment()
        this.boss && this.boss.destroy()
        for (var i in this) {
            this[i] = null
        }
    },
    toFragment: function () {
        var f = createFragment()
        this.children.forEach(function (el) {
            f.appendChild(avalon.vdom(el, 'toDOM'))
        })
        return f
    },
    toHTML: function () {
        var c = this.children || []
        return c.map(function (a) {
            return avalon.vdom(a, 'toHTML')
        }).join('')
    }
}
