
var parseExpr = require('./parseExpr')
var parseBindings = require('./parseBindings')
var parseDelimiter = require('./parseDelimiter')
var rexpr = avalon.config.rexpr
var quote = avalon.quote
var makeHashCode = avalon.makeHashCode
var r = require('../../seed/regexp')
var rident = r.ident
var rsp = r.sp
function wrapDelimiter(expr) {
    return rident.test(expr) ? expr : parseExpr(expr)
}


function wrap(a, num) {
    return '(function(){\n\n' + a + '\n\nreturn vnodes' + num + '\n})();\n'
}

function parseView(arr, num) {
    num = num || String(new Date - 0).slice(0, 5)

    var forstack = []
    var hasIf = false
    var children = 'vnodes' + num
    var vnode = 'vnode' + num
    var str = 'var ' + children + ' = []\n'
    for (var i = 0; i < arr.length; i++) {
        var el = arr[i]
        if (el.type === '#text') {
            str += 'var ' + vnode + ' = {type:"#text", skipContent:true}\n'
            var hasDelimiter = rexpr.test(el.nodeValue)

            if (hasDelimiter) {
                var array = parseDelimiter(el.nodeValue)
                if (array.length === 1) {
                    var a = parseExpr(array[0].expr)
                    str += vnode + '.nodeValue = ' + wrapDelimiter(array[0].expr) + '\n'
                } else {
                    a = array.map(function (el) {
                        return el.type ? wrapDelimiter(el.expr) : quote(el.expr)
                    }).join(' + ')
                    str += vnode + '.nodeValue = String(' + a + ')\n'
                }
                str += vnode + '.fixIESkip = true\n'
                /* jshint ignore:start */
                str += vnode + '.skipContent = false\n'
            } else {
                if (rsp.test(el.nodeValue)) {
                    str += vnode + '.nodeValue = "\\n"\n'
                } else {
                    str += vnode + '.nodeValue = ' + quote(el.nodeValue) + '\n'
                }
            }
            str += children + '.push(' + vnode + ')\n'

        } else if (el.type === '#comment') {
            var nodeValue = el.nodeValue
            if (nodeValue.indexOf('ms-for:') === 0) {// 处理ms-for指令
                var signature = el.signature
                forstack.push(signature)
                str += '\nvar ' + signature + '= {' +
                        '\n\ttype:"#comment",' +
                        '\n\tdirective:"for",' +
                        '\n\tskipContent:false,' +
                        '\n\tsignature:' + quote(signature) + ',' +
                        '\n\tstart:' + children + '.length,' +
                        '\n\tnodeValue:' + quote(nodeValue) +
                        '\n}\n'
                str += children + '.push(' + signature + ')\n'
                str += avalon.directives['for'].parse(nodeValue, num)

            } else if (nodeValue.indexOf('ms-for-end:') === 0) {
                var signature = forstack[forstack.length - 1]

                str += children + '.push({' +
                        '\n\ttype:"#comment",' +
                        '\n\tskipContent:true,' +
                        '\n\tnodeValue:' + quote(signature) + ',' +
                        '\n\tkey:traceKey\n})\n'
                str += '\n})\n' //结束循环
                if (forstack.length) {
                    var signature = forstack[forstack.length - 1]
                    str += signature + '.end =' + children + '.push({' +
                            '\n\ttype:"#comment",' +
                            '\n\tskipContent:true,' +
                            '\n\tsignature:' + quote(signature) + ',' +
                            '\n\tnodeValue:' + quote(signature + ':end') +
                            '\n})\n'
                    forstack.pop()
                }
            } else if (nodeValue.indexOf('ms-js:') === 0) {//插入普通JS代码
                str += parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
            } else {
                str += children + '.push(' + quote(el) + ')\n\n\n'
            }
            continue
        } else { //处理元素节点
            var hasIf = el.props['ms-if']

            if (hasIf) { // 处理ms-if指令
                el.signature = makeHashCode('ms-if')
                str += 'if(!(' + parseExpr(hasIf, 'if') + ')){\n'
                str += children + '.push({' +
                        '\n\ttype: "#comment",' +
                        '\n\tdirective: "if",' +
                        '\n\tnodeValue:' + quote(el.signature) + ',\n' +
                        '\n\tsignature:' + quote(el.signature) + ',\n' +
                        '\n\tprops: {"ms-if":true} })\n'
                str += '\n}else{\n\n'
            }
            str += 'var ' + vnode + ' = {' +
                        '\n\ttype: ' + quote(el.type) + ',' +
                        '\n\tprops: {},' +
                        '\n\tchildren: [],' +
                        '\n\tisVoidTag: ' + !!el.isVoidTag + ',' +
                        '\n\ttemplate: ""}\n'
            var hasWidget = el.props['ms-widget']
            if (hasWidget) {// 处理ms-widget指令
                
                str += avalon.directives.widget.parse({
                    expr: hasWidget,
                    type: 'widget'
                }, num, el)
                hasWidget = false
            } else {

                var hasBindings = parseBindings(el.props, num, el)
                if (hasBindings) {
                    str += hasBindings
                }
                if(el.children.length){
                    str += vnode + '.children = ' + wrap(parseView(el.children, num), num) + '\n'
                }else{
                    str += vnode + '.template = ' + quote(el.template) + '\n'
                }
            }
            str += children + '.push(' + vnode + ')\n'
            if (hasIf) {
                str += '}\n'
                hasIf = false
            }
        }
    }
    return str
}

module.exports = parseView