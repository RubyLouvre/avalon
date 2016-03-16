
var parseExpr = require('./parseExpr')
var parseText = require('./parseText')
var parseBindings = require('./parseBindings')
var rexpr = avalon.config.rexpr
var quote = avalon.quote
var makeHashCode = avalon.makeHashCode

function wrap(a, num) {
    return '(function(){\n\n' + a + '\n\nreturn nodes' + num + '\n})();\n'
}

function parseView(arr, num) {
    num = num || String(new Date - 0).slice(0, 5)

    var forstack = []
    var hasIf = false
    var children = 'nodes' + num
    var vnode = 'vnode' + num
    var str = 'var ' + children + ' = []\n'
    for (var i = 0; i < arr.length; i++) {
        var el = arr[i]
        if (el.type === '#text') {
            str += 'var ' + vnode + ' = {type:"#text", skipContent:true}\n'
            var hasExpr = rexpr.test(el.nodeValue)

            if (hasExpr) {
                var array = parseText(el.nodeValue, false)
                if (array.length === 1) {
                    var a = parseExpr(array[0].expr)
                } else {
                    a = array.map(function (el) {
                        return el.type ? 'String(' + parseExpr(el.expr) + ')' : quote(el.expr)
                    }).join(' + ')

                }
                /* jshint ignore:start */

                str += vnode + '.nodeValue = String(' + a + ')\n'
                str += vnode + '.skipContent = false\n'
            } else {
                str += vnode + '.nodeValue = ' + quote(el.nodeValue) + '\n'
            }
            str += children + '.push(' + vnode + ')\n'

        } else if (el.type === '#comment') {
            var nodeValue = el.nodeValue
            if (nodeValue.indexOf('a-for:') === 0) {
                var signature = el.signature
                forstack.push(signature)
                str += children + '.push({' +
                        '\n\ttype:"#comment",' +
                        '\n\tdirective:"for",' +
                        '\n\tskipContent:false,' +
                        '\n\tsignature:' + quote(signature) + ',' +
                        '\n\tnodeValue:' + quote(nodeValue)  +
                        '\n})\n'
                str += avalon.directives['for'].parse(nodeValue, num)

            } else if (nodeValue.indexOf('a-for-end:') === 0) {
                var signature = forstack[forstack.length - 1]

                str += children + '.push({' +
                        '\n\ttype:"#comment",' +
                        '\n\tskipContent:true,' +
                        '\n\tnodeValue:' + quote(signature) + ',' +
                        '\n\tkey:traceKey\n})\n'
                str += '\n})\n' //结束循环
                if (forstack.length) {
                    var signature = forstack[forstack.length - 1]
                    str += children + '.push({' +
                            '\n\ttype:"#comment",' +
                            '\n\tskipContent:true,' +
                            '\n\tsignature:' + quote(signature) + ',' +
                            '\n\tnodeValue:' + quote(signature + ':end') + ',' +
                            '\n})\n'

                    forstack.pop()
                }
            } else if (nodeValue.indexOf('a-js:') === 0) {
                str += parseExpr(nodeValue.replace('a-js:', ''), 'js') + '\n'
            } else {
                str += children + '.push(' + quote(el) + ');;;;\n'
            }
            continue
        } else { //处理元素节点
            var hasIf = el.props['a-if'] || el.props['ms-if']
            
            if (hasIf) { // 优化处理a-if指令
                el.props['a-if'] = hasIf
                el.signature = makeHashCode('a-if') 
                delete el.props['ms-if']
                str += 'if(!(' + parseExpr(hasIf, 'if') + ')){\n'
                str += children + '.push({' +
                        '\n\ttype: "#comment",' +
                        '\n\tdirective: "if",' +
                        '\n\tnodeValue:'+ quote(el.signature)+',\n'+
                        '\n\tsignature:'+ quote(el.signature)+',\n'+
                        '\n\tprops: {"a-if":true} })\n'
                str += '\n}else{\n\n'

            }
            str += 'var ' + vnode + ' = {' +
                    '\n\ttype: ' + quote(el.type) + ',' +
                    '\n\tprops: {},' +
                    '\n\tchildren: [],' +
                    '\n\tisVoidTag: ' + !!el.isVoidTag + ',' +
                    '\n\ttemplate: ""}\n'
            var hasBindings = parseBindings(el.props, num, el)
            if (hasBindings) {
                str += hasBindings
            }

            if (el.children.length) {
                str += 'if(!' + vnode + '.props.wid){\n'
                str += '\t' + vnode + '.children = ' + wrap(parseView(el.children, num), num) + '\n'
                str += '}\n'
            } else {
                str += vnode + '.template= ' + quote(el.template) + '\n'
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