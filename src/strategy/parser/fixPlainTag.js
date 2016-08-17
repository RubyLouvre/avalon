/* 
 *  修正容器元素
 */

function fixPlainTag(node, nodeName, innerHTML) {
    switch (nodeName) {
        case 'style':
        case 'script':
        case 'noscript':
        case 'template':
        case 'xmp':
            node.children = [
                {
                    nodeName: '#text',
                    skipContent: true,
                    nodeValue: innerHTML
                }
            ]
            break
        case 'textarea':
            var props = node.props
            props.type = 'textarea'
            props.value = innerHTML
            node.children = []
            break
        case 'option':
            node.children = [{
                    nodeName: '#text',
                    nodeValue: trimHTML(innerHTML)
                }]
            break
    }

}

//专门用于处理option标签里面的标签
var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
function trimHTML(v) {
    return String(v).replace(rtrimHTML, '').trim()
}

module.exports = fixPlainTag