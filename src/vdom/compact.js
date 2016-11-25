/**
 * 虚拟DOM的4大构造器
 */
import { avalon, createFragment } from '../seed/core'
import { VText } from './VText'
import { VComment } from './VComment'
import { VElement } from './VElement'
import { VFragment } from './VFragment'


avalon.mix(avalon, {
    VText,
    VComment,
    VElement,
    VFragment
})

var constNameMap = {
    '#text': 'VText',
    '#document-fragment': 'VFragment',
    '#comment': 'VComment'
}

var vdom = avalon.vdomAdaptor = avalon.vdom = function(obj, method) {
    if (!obj) { //obj在ms-for循环里面可能是null
        return method === "toHTML" ? '' : createFragment()
    }
    var nodeName = obj.nodeName
    if (!nodeName) {
        return (new avalon.VFragment(obj))[method]()
    }
    var constName = constNameMap[nodeName] || 'VElement'
    return avalon[constName].prototype[method].call(obj)
}

avalon.domize = function(a) {
    return avalon.vdom(a, 'toDOM')
}

export { vdom, avalon, VText, VComment, VElement, VFragment }