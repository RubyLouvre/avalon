import { avalon } from '../seed/core'

avalon.directive('if', {
    priority: 5,
    diff: avalon.noop
})

