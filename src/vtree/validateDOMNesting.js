
import { avalon, oneObject } from '../seed/core'


export function validateDOMNesting(parent, child) {

    var parentTag = parent.nodeName
    var tag = child.nodeName
    var parentChild = nestObject[parentTag]
    if (parentChild) {
        if (parentTag === 'p') {
            if (pNestChild[tag]) {
                avalon.warn('P element can not  add these childlren:\n' +
                    Object.keys(pNestChild))
                return false
            }
        } else if (!parentChild[tag]) {
            avalon.warn(parentTag.toUpperCase() +
                'element only add these children:\n' + Object.keys(parentChild) + '\nbut you add ' + tag.toUpperCase() + ' !!')
            return false
        }
    }
    return true
}
var pNestChild = oneObject('div,ul,ol,dl,table,h1,h2,h3,h4,h5,h6,form,fieldset')
var tNestChild = oneObject('tr,style,script,template,#document-fragment')
var nestObject = {
    p: pNestChild,
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inselect
    select: oneObject('option,optgroup,#text,#document-fragment'),
    optgroup: oneObject('option,#text,#document-fragment'),
    option: oneObject('#text,#document-fragment'),
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intd
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incaption
    // No special behavior since these rules fall back to "in body" mode for
    // all except special table nodes which cause bad parsing behavior anyway.

    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intr
    tr: oneObject('th,td,style,script,template,#document-fragment'),

    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intbody
    tbody: tNestChild,
    tfoot: tNestChild,
    thead: tNestChild,
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-incolgroup
    colgroup: oneObject('col,template,#document-fragment'),
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-intable
    table: oneObject('caption,colgroup,tbody,thead,tfoot,style,script,template,#document-fragment'),
    // https://html.spec.whatwg.org/multipage/syntax.html#parsing-main-inhead
    head: oneObject('base,basefont,bgsound,link,style,script,meta,title,noscript,noframes,template,#document-fragment'),
    // https://html.spec.whatwg.org/multipage/semantics.html#the-html-element
    html: oneObject('head,body'),
}
