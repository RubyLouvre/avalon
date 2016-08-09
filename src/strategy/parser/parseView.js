/*
 * 本模块是用于将虚拟DOM变成一个函数
 */

var extractBindings = require('./extractBindings')
var stringify = require('./stringify')
var parseExpr = require('./parseExpr')
var decode = require('../decode')
var config = avalon.config
var quote = avalon.quote
var rident = /^[$a-zA-Z_][$a-zA-Z0-9_]*$/
var rstatement = /^\s*var\s+([$\w]+)\s*\=\s*\S+/
var skips = {__local__: 1, vmode: 1, dom: 1}


function parseNodes(source, inner) {
    //ms-important， ms-controller ， ms-for 不可复制，省得死循环
    //ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = inner ? [] : ['\nvar vnodes = [];']

    for (var i = 0, el; el = source[i++]; ) {
        var vnode = parseNode(el)
        if (el.$prepend) {
            buffer.push(el.$prepend)
        }
        var append = el.$append
        delete el.$append
        delete el.$prepend
        if (vnode) {
            buffer.push(vnode + '\n')
        }
        if (append) {
            buffer.push(append)
        }
    }
    if (!inner) {
        buffer.push('return vnodes\n')
    }
    return buffer.join('\n')
}



function parseNode(vdom) {
    switch (vdom.nodeType) {
        case 3:
            if (config.rexpr.test(vdom.nodeValue) && !vdom.skipContent ) {
                return add(parseText(vdom))
            } else {
                return add(createCachedNode(vdom))
            }
        case 1:

            if (vdom.skipContent && vdom.skipAttrs) {
                return add(createCachedNode(vdom))
            }
            var copy = {
                props: {},
                nodeName: vdom.nodeName,
                nodeType: 1
            }
            var bindings = extractBindings(copy, vdom.props)
            var order = bindings.map(function (b) {
                //将ms-*的值变成函数,并赋给copy.props[ms-*]
                //如果涉及到修改结构,则在source添加$append,$prepend
                avalon.directives[b.type].parse(copy, vdom, b)
                return b.name
            }).join(',')
            if (order) {
                copy.order = order
            }
            if (vdom.isVoidTag) {
                copy.isVoidTag = true
            } else {
                if (!('children' in copy)) {
                    var c = vdom.children
                    if (c.length) {
                        copy.children = '(function(){' + parseNodes(c) + '})()'
                    } else {
                        copy.children = '[]'
                    }
                }
            }
            if (vdom.template)
                copy.template = vdom.template
            if (vdom.skipContent)
                copy.skipContent = true
            if (vdom.skipAttrs) {
                copy.skipAttrs = true
            }
            if (vdom.dynamic) {
                copy.dynamic = true
            }
            return addTag(copy)
        case 8:
            var nodeValue = vdom.nodeValue
            if (vdom.dynamic === 'for') {// 处理ms-for指令
                if (nodeValue.indexOf('ms-for:') !== 0) {
                    avalon.error('ms-for指令前不能有空格')
                }
               
                var copy = {
                    dynamic: 'for',
                    vmodel: '__vmodel__'
                }
                for (var i in vdom) {
                    if (vdom.hasOwnProperty(i) && !skips[i]) {
                        copy[i] = vdom[i]
                    }
                }

                avalon.directives['for'].parse(copy, vdom, vdom)
                vdom.$append += parseNodes(avalon.speedUp(avalon.lexer(vdom.template)),true)
                return addTag(copy) 
            } else if (nodeValue === 'ms-for-end:') {
              
                vdom.$append = addTag({
                    nodeType: 8,
                    nodeName: '#comment',
                    nodeValue: vdom.signature,
                    key: 'traceKey'
                }) + '\n},__local__,vnodes)\n' +
                        addTag({
                            nodeType: 8,
                            nodeName: "#comment",
                            signature: vdom.signature,
                            nodeValue: "ms-for-end:"
                        }) + '\n'
                return ''

            } else if (nodeValue.indexOf('ms-js:') === 0) {//插入JS声明语句
                var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
                var ret = addTag(vdom)
                var match = statement.match(rstatement)
                if (match && match[1]) {
                    vdom.$append = (vdom.$append || '') + statement +
                            "\n__local__." + match[1] + ' = ' + match[1] + '\n'
                } else {
                    avalon.warn(nodeValue + ' parse fail!')
                }
                return ret
            } else if(vdom.dynamic){
                return addTag(vdom)
            }else{
                return add(createCachedNode(vdom))
            }
    }

}

module.exports = parseNodes

function wrapDelimiter(expr) {
    return rident.test(expr) ? expr : parseExpr(expr, 'text')
}

function add(a) {
    return 'vnodes.push(' + a + ');'
}
function addTag(obj) {
    return add(stringify(obj))
}

function parseText(el) {
    var array = extractExpr(el.nodeValue)//返回一个数组
    var nodeValue = ''
    if (array.length === 1) {
        nodeValue = wrapDelimiter(array[0].expr)
    } else {
        var token = array.map(function (el) {
            return el.type ? wrapDelimiter(el.expr) : quote(el.expr)
        }).join(' + ')
        nodeValue = 'String(' + token + ')'
    }
    return '{\ntype: "#text",\nnodeType:3,\ndynamic:true,\nnodeValue: ' + nodeValue + '\n}'
}

var rlineSp = /\n\s*/g

function extractExpr(str) {
    var ret = []
    do {//aaa{{@bbb}}ccc
        var index = str.indexOf(config.openTag)
        index = index === -1 ? str.length : index
        var value = str.slice(0, index)
        if (/\S/.test(value)) {
            ret.push({expr: decode(value)})
        }
        str = str.slice(index + config.openTag.length)
        if (str) {
            index = str.indexOf(config.closeTag)
            var value = str.slice(0, index)
            ret.push({
                expr: avalon.unescapeHTML(value.replace(rlineSp, '')),
                type: '{{}}'
            })
            str = str.slice(index + config.closeTag.length)
        }
    } while (str.length)
    return ret
}

function createCachedNode(vdom) {
    var uuid
    switch (vdom.nodeType) {
        case 1:
            uuid = vdom.nodeName + ';' + Object.keys(vdom.props).sort().map(function (k) {
                return k + '-' + vdom.props[k]
            }).join(';') + ';' + avalon.vdomAdaptor(vdom, 'toHTML').length
            break
        case 3:
        case 8:
            uuid = vdom.nodeType + ';' + vdom.nodeValue
            break
    }

    avalon.caches[uuid] = vdom

    return 'avalon.getCachedNode(' + quote(uuid) + ')'
}

avalon.getCachedNode = function (uuid) {
    return avalon.caches[uuid]
}