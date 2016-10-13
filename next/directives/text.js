//此指令实际上不会操作DOM,交由expr指令处理
import { avalon } from '../seed/core'

avalon.directive('text', {
    parse: function (copy, src, binding) {
        if (!src.isVoidTag) {
            copy.children = src.children = [{
                nodeName: '#text',
                nodeValue: avalon.config.openTag+ binding.expr+avalon.config.closeTag,
                parent: src.dom
            }]
            delete src.props['ms-text']
            delete copy.props['ms-text']
        }
    }
})