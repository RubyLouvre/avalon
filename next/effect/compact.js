import avalon from "../seed/core"
import "../dom/css/compact"
import effectDetect from './detect'
import './directive'

var effectSupport = effectDetect(
    avalon.cssName('transition-duration'),
    avalon.cssName('animation-duration'),
    avalon.window
)

avalon.effect = function (name, definition) {
    avalon.effects[name] = definition || {}
    if (effectSupport.css) {
        if (!definition.enterClass) {
            definition.enterClass = name + '-enter'
        }
        if (!definition.enterActiveClass) {
            definition.enterActiveClass = definition.enterClass + '-active'
        }
        if (!definition.leaveClass) {
            definition.leaveClass = name + '-leave'
        }
        if (!definition.leaveActiveClass) {
            definition.leaveActiveClass = definition.leaveClass + '-active'
        }
    }
    if (!definition.action) {
        definition.action = 'enter'
    }
}

avalon.effect.support = effectSupport
