
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

function parseNodes(array) {
    //ms-important， ms-controller ， ms-for 不可复制，省得死循环
    //ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = ['\nvar vnodes = [];']
    var forstack = []
    for (var i = 0, el; el = array[i++]; ) {
        var vnode = parseNode(el, forstack)
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
    buffer.push('return vnodes\n')
    return buffer.join('\n')
}



function parseNode(pre, forstack, logic) {
    var directives = avalon.directives
    if (pre.nodeType === 3) {
        if (config.rexpr.test(pre.nodeValue)) {
            return add(stringifyText(pre))
        } else {
            return addTag(pre)
        }
    } else if (pre.nodeType === 1) {
        var props = pre.props
        if (pre.type.indexOf('ms-') === 0) {
            if (!props['ms-widget']) {
                props['ms-widget'] = '{is:' + quote(pre.type) + '}'
            }
        }

        var cur = {
            props: {},
            type: pre.type,
            nodeType: 1,
            template: ''
        }
        var bindings = extractBindings(cur, props)
        if (!bindings.length) {
            cur.skipAttrs = true
        }

        cur.order = bindings.map(function (b) {
            //将ms-*的值变成函数,并赋给cur.props[ms-*]
            //如果涉及到修改结构,则在pre添加$append,$prepend
            directives[b.type].parse(cur, pre, b)
            return b.name

        }).join(';;')
        if (pre.directive === 'widget') {
            cur.order = cur.order ? 'ms-widget;;' + cur.order : 'ms-widget'
            cur.directive = 'widget'
            cur.local = '__local__'
            cur.vmodel = '__vmodel__'
            cur.wid = avalon.quote(pre.props.wid)
            delete cur.skipAttrs
        }
        if (pre.isVoidTag) {
            cur.isVoidTag = true
        } else {
            if (!('children' in cur)) {
                var pChildren = pre.children
                if (pChildren.length) {
                    cur.children = '(function(){' + parseNodes(pChildren) + '})()'
                } else {
                    cur.template = pre.template
                    cur.children = '[]'
                }
            }
        }

        return addTag(cur)

    } else if (pre.nodeType === 8) {
        var nodeValue = pre.nodeValue
        if (rmsFor.test(nodeValue)) {// 处理ms-for指令
            if (nodeValue.indexOf('ms-for:') !== 0) {
                avalon.error('ms-for指令前不能有空格')
            }
            forstack.push(pre)
            var cur = avalon.mix({
                directive: 'for',
                vmodel: '__vmodel__'
            }, pre)
            directives['for'].parse(cur, pre, pre)

            return addTag(cur)

        } else if (rmsForEnd.test(nodeValue)) {
            var node = forstack[forstack.length - 1]
            var signature = node.signature
            if (nodeValue.indexOf('ms-for-end:') !== 0) {
                avalon.error('ms-for-end指令前不能有空格')
            }

            pre.$append = addTag({
                nodeType: 8,
                type: '#comment',
                nodeValue: signature,
                key: 'traceKey'
            }) + '\n' //结束循环
                    + "\n})"
            if (forstack.length) {
                pre.$append += "\n" + signature + '.end =' +
                        addTag({
                            nodeType: 8,
                            type: "#comment",
                            signature: signature,
                            nodeValue: "ms-for-end:"
                        }) + '\n'
                forstack.pop()
            }
            return ''
        } else if (nodeValue.indexOf('ms-js:') === 0) {//插入JS声明语句
            var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
            var ret = addTag(pre)
            var match = statement.match(rstatement)
            if (match && match[1]) {
                pre.$append = (pre.$append || '') + statement +
                        "\n__local__." + match[1] + ' = ' + match[1] + '\n'
            }else{
                avalon.warn(nodeValue+' parse fail!')
            }
            return ret
        } else {
            return addTag(pre)
        }
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
    return '{\ntype: "#text",\nnodeType:3,\nfixIESkip: true,\nnodeValue: ' + nodeValue + '\n}'
}

module.exports = parseNodes
