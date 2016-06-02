
var parseExpr = require('./parseExpr')
var parseBindings = require('./parseBindings')
var parseDelimiter = require('./parseDelimiter')
var config = avalon.config
var quote = avalon.quote
var makeHashCode = avalon.makeHashCode
var r = require('../../seed/regexp')
var rident = r.ident
var rsp = r.sp
var rneedQuote = /[W-]/
var keyMap = require('./keyMap')
var rmsFor = /^\s*ms\-for:/
var rmsForEnd = /^\s*ms\-for\-end:/
function wrapDelimiter(expr) {
    return rident.test(expr) ? expr : parseExpr(expr, 'text')
}

avalon.parseNodes = parseNodes
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
        if (vnode) {
            buffer.push(vnode + '\n')
        }
        if (el.$append) {
            buffer.push(el.$append)
        }
    }
    buffer.push('return vnodes\n')
    return buffer.join('\n')
}


function fixKey(k) {
    return (rneedQuote.test(k) || keyMap[k]) ? quote(k) : k
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
        var bindings = parseBindings(cur, props)
        if (!bindings.length) {
            cur.skipAttrs = true
        }

        cur.order = bindings.map(function (b) {
            //将ms-*的值变成函数,并赋给cur.props[ms-*]
            //如果涉及到修改结构,则在pre添加$append,$prepend
            directives[b.type].parse(cur, pre, b)
            return b.name
        }).join(';;')
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

        if (bindings.type === 'important') {
            return ''
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
        } else if (nodeValue.indexOf('ms-js:') === 0) {//插入普通JS代码
            return addTag(pre)
            //str += parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
        } else {
            return addTag(pre)
        }
    }
}

avalon.parseNode = parseNode
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


function stringifyTag(obj) {
    var arr1 = []
//字符不用东西包起来就变成变量
    for (var i in obj) {
        if (i === 'props') {
            var arr2 = []
            for (var k in obj.props) {
                var kv = obj.props[k]
                if (typeof kv === 'string') {
                    kv = quote(kv)
                }
                arr2.push(fixKey(k) + ': ' + kv)
            }
            arr1.push('\tprops: {' + arr2.join(',\n') + '}')
        } else {
            var v = obj[i]
            if (typeof v === 'string') {
                v = quoted[i] ? quote(v) : v
            }

            arr1.push(fixKey(i) + ':' + v)
        }
    }
    return '{\n' + arr1.join(',\n') + '}'
}
var quoted = {
    type: 1,
    template: 1,
    innerHTML: 1,
    outerHTML: 1,
    order: 1,
    nodeValue: 1,
    directive: 1,
    signature: 1,
    cid: 1
}
function add(a) {
    return 'vnodes.push(' + a + ');'
}
function addTag(obj) {
    return add(stringifyTag(obj))
}
