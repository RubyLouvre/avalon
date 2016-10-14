import { avalon, quote } from '../seed/lang.share'
import { variantByText } from './variantByText'
import diff from './diff'
import batchUpdate from './batch'
import variantCommon from './variantCommon'
import { parseExpr, extLocal } from './parseExpr'
import { render } from './makeRender'

avalon.lexer = variantByText
avalon.diff = diff
avalon.batch = batchUpdate
avalon.speedUp = variantCommon
avalon.parseExpr = parseExpr
avalon.render = render





