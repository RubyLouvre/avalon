import {avalon} from '../seed/core'
import {quote} from '../seed/lang.share'

import {variantByText} from './variantByText'
import diff from './diff'
import batchUpdate from './batch'
import variantCommon from './variantCommon'
import parseExpr from './parseExpr'
import {serializeChildren} from './serializeChildren'

avalon.lexer = variantByText
avalon.diff = diff
avalon.batch = batchUpdate
avalon.speedUp = avalon.variantCommon = variantCommon
avalon.parseExpr = parseExpr


// dispatch与patch 为内置模块

var rquoteEscapes = /\\\\(['"])/g
function render(vtree, local) {
    var _body = Array.isArray(vtree) ? serializeChildren(vtree) : vtree
    var _local = []
    if (local) {
        for (var i in local) {
            _local.push('var ' + i + ' = __local__[' + quote(i) + ']')
        }
    }
    //处理 props: {"ms-effect": "{is:\\'star\\',action:@action}" 的情况 
    _body = _body.replace(rquoteEscapes, "$1")
    var body = '__local__ = __local__ || {};\n' +
        _local.join(';\n') + '\n' + _body

    try {
        var fn = Function('__vmodel__', '__local__', body)
    } catch (e) {
        avalon.warn(_body, 'render parse error')
    }
    return fn
}

avalon.render = render

