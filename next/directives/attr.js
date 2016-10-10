
import {avalon} from '../seed/core'
import attrUpdate from '../dom/attr/compact'
import {cssDiff} from './css'

avalon.directive('attr', {
    diff: cssDiff,
    //dom, vnode
    update: attrUpdate
})
