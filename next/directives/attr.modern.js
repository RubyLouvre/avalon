import avalon from '../seed/core'
import attrUpdate from '../dom/attr/modern'
import {cssDiff} from './css'

avalon.directive('attr', {
    diff: cssDiff,
    update: attrUpdate
})
