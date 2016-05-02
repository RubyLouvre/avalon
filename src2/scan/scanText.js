 rline = /\r?\n/g
var openTag =  '{{'
var closeTag = '}}'
function scanExpr(str) {
    var tokens = [],
        value, start = 0,
        stop
    do {
        stop = str.indexOf(openTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { // {{ 左边的文本
            tokens.push({
                expr: value
            })
        }
        start = stop + openTag.length
        stop = str.indexOf(closeTag, start)
        if (stop === -1) {
            break
        }
        value = str.slice(start, stop)
        if (value) { //处理{{ }}插值表达式
            tokens.hasDirective = true
            tokens.push({
                type:'expr',
                value: value.replace(rline,"")
            })
        }
        
        start = stop + closeTag.length
    } while (1)
    value = str.slice(start)
    if (value) { //}} 右边的文本
        tokens.push({
            expr: value
        })
    }
    return tokens
}
function scanText (node, vmodel){
   var nodes = scanExpr(node.nodeValue)  
   if(nodes.hasDirective){
       vmodel.$watchers.push({
           type: 'expr',
           element:node,
           vmodel: vmodel,
           nodes: nodes
       })
   }
    
}
module.exports = scanText