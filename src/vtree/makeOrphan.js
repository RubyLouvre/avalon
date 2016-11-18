/* 
 *  此模块只用于文本转虚拟DOM, 
 *  因为在真实浏览器会对我们的HTML做更多处理,
 *  如, 添加额外属性, 改变结构
 *  此模块就是用于模拟这些行为
 */
export function makeOrphan(node, nodeName, innerHTML) {
    switch (nodeName) {
        case 'style':
        case 'script':
        case 'noscript':
        case 'template':
        case 'xmp':
            node.children = [{
                nodeName: '#text',
                nodeValue: innerHTML
            }]
            break
        case 'textarea':
            var props = node.props
            props.type = nodeName
            props.value = innerHTML
            node.children = [{
                nodeName: '#text',
                nodeValue: innerHTML
            }]
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

//widget rule duplex validate