
var parseExpr = require('./parseExpr')
var extractBindings = require('./extractBindings')
var parseDelimiter = require('./parseDelimiter')
var stringify = require('./stringify')
var config = avalon.config
var quote = avalon.quote
var makeHashCode = avalon.makeHashCode
var r = require('../../seed/regexp')
var rident = r.ident
var rsp = r.sp

var rmsFor = /^\s*ms\-for:/
var rmsForEnd = /^\s*ms\-for\-end:/
function wrapDelimiter(expr) {
    return rident.test(expr) ? expr : parseExpr(expr, 'text')
}

function add(a) {
    return 'vnodes.push(' + a + ');'
}
function addTag(obj) {
    return add(stringify(obj))
}

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



function parseNode(source) {
    var directives = avalon.directives
    if (source.nodeType === 3) {
        if (config.rexpr.test(source.nodeValue)) {
            return add(stringifyText(source))
        } else {
            return addTag(source)
        }
    } else if (source.nodeType === 1) {

        var copy = {
            props: {},
            type: source.type,
            nodeType: 1
        }
        var bindings = extractBindings(copy, source.props)
        copy.order = bindings.map(function (b) {
            //将ms-*的值变成函数,并赋给copy.props[ms-*]
            //如果涉及到修改结构,则在source添加$append,$prepend
            directives[b.type].parse(copy, source, b)
            return b.name

        }).join(',')

        if (source.isVoidTag) {
            copy.isVoidTag = true
        } else {
            if (!('children' in copy)) {
                var pChildren = source.children
                if (pChildren.length) {
                    copy.children = '(function(){' + parseNodes(pChildren) + '})()'
                } else {
                    copy.children = '[]'
                }
            }
        }
        if (source.skipContent)
            copy.skipContent = true
        if (source.skipAttrs)
            copy.skipAttrs = true

        return addTag(copy)

    } else if (source.nodeType === 8) {
        var nodeValue = source.nodeValue
        if (rmsFor.test(nodeValue)) {// 处理ms-for指令
            if (nodeValue.indexOf('ms-for:') !== 0) {
                avalon.error('ms-for指令前不能有空格')
            }
            var copy = {
                dynamic: 'for',
                vmodel: '__vmodel__'
            }
            for (var i in source) {
                if (source.hasOwnProperty(i)) {
                    copy[i] = source[i]
                }
            }

            directives['for'].parse(copy, source, source)

            return addTag(copy)

        } else if (rmsForEnd.test(nodeValue)) {
            if (nodeValue.indexOf('ms-for-end:') !== 0) {
                avalon.error('ms-for-end指令前不能有空格')
            }
            source.$append = addTag({
                nodeType: 8,
                type: '#comment',
                nodeValue: source.signature,
                key: 'traceKey'
            }) +
                    '\n},__local__,vnodes)\n' +
                    addTag({
                        nodeType: 8,
                        type: "#comment",
                        signature: source.signature,
                        nodeValue: "ms-for-end:"
                    }) + '\n'

            return ''
        } else if (nodeValue.indexOf('ms-js:') === 0) {//插入JS声明语句
            var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
            var ret = addTag(source)
            var match = statement.match(rstatement)
            if (match && match[1]) {
                source.$append = (source.$append || '') + statement +
                        "\n__local__." + match[1] + ' = ' + match[1] + '\n'
            } else {
                avalon.warn(nodeValue + ' parse fail!')
            }
            return ret
        } else {
            return addTag(source)
        }
    } else if (Array.isArray(source)) {
        source.$append = parseNodes(source, true)
    }
}
var rstatement = /^\s*var\s+([$\w]+)\s*\=\s*\S+/

function stringifyText(el) {
    var array = parseDelimiter(el.nodeValue)//返回一个数组
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

module.exports = parseNodes
