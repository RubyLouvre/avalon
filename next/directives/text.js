//此指令实际上不会操作DOM,交由expr指令处理
import { avalon, config } from '../seed/lang.share'

avalon.directive('text', {
    parse: function (copy, src, binding) {
        if (!src.isVoidTag) {
            copy.children = src.children = [{
                nodeName: '#text',
                nodeValue: config.openTag+ binding.expr+ config.closeTag,
                parent: src.dom
            }]
            delete src.props['ms-text']
            if(copy.props){
                delete copy.props['ms-text']
            }
        }
    }
})