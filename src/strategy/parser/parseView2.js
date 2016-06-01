
var parseExpr = require('./parseExpr')
var parseBindings = require('./parseBindings2')
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

function add(a) {
    return 'vnodes.push(' + a + ')'
}
function parseNode(pre, forstack) {
    var directives = avalon.directives
    if (pre.nodeType === 3) {
        if (config.rexpr.test(pre.nodeValue)) {
            return add(stringifyText(pre))
        } else {
            return stringifyNode(pre)
        }
    } else if (pre.nodeType === 1) {
        if (pre.type.indexOf('ms-') === 0) {
            if (!pre.props['ms-widget']) {
                pre.props['ms-widget'] = '{is:' + quote(pre.type) + '}'
            }
        }

        var cur = {//用于生成高质量的虚拟节点
            props: {},
            type: pre.type,
            nodeType: 1,
            template: ''
        }
        var props = pre.props
        if (props['ms-important']) {
            directives.important.parse(cur, pre, {
                expr: props['ms-important']
            })
            return ''
        } else if (props['ms-controller']) {
            directives.controller.parse(cur, pre, {
                expr: props['ms-controller']
            })
        }
        //ms-for在laxer阶段已经变成注释节点
        if (props['ms-widget']) {
            directives['widget'].parse(cur, pre, {
                expr: props['ms-widget'],
                name: 'ms-widget'
            })

            return  add(stringifyTag(cur))
        }

        var bindings = parseBindings(cur, props)
        bindings.forEach(function (b) {
            directives[b.type].parse(cur, pre, b)
        })

        if (cur.skip || cur.skipContent) {
            cur.template = quote(pre.template)
        }
        var pChildren = pre.children
        if (!('children' in cur) && !pre.isVoidTag) {
            if (pChildren.length) {
                cur.children = '(function(){' + parseNodes(pre.children) + '})()'
            } else {
                cur.template = quote(pre.template)
                cur.children = '[]'
            }
        }

        //我们在cur添加vmodel,children等后来添加的属性,属性值都应该是字符串
        //然后在pre上添加$append, $prepend等改变
        //收集cur上的属性parseNodes流程的分支
        return add(stringifyTag(cur,{
            vmodel: 1,
            'data-duplex-set':1,
            'data-duplex-get':1,
            'data-duplex-format':1

        }))

    } else if (pre.nodeType === 8) {
        var nodeValue = pre.nodeValue
        if (rmsFor.test(nodeValue)) {// 处理ms-for指令
            if (nodeValue.indexOf('ms-for:') !== 0) {
                avalon.error('ms-for指令前不能有空格')
            }
            forstack.push(pre)
            var cur = avalon.mix({
                skipContent: true,
                directive: 'for',
              //  start: 'vnodes.length',
                vmodel: '__vmodel__'
            }, pre)
            directives['for'].parse(cur, pre, pre)


            return add(stringifyTag(cur, {
                vmodel: 1
            }))

        } else if (rmsForEnd.test(nodeValue)) {
            var node = forstack[forstack.length - 1]
            var signature = node.signature
            if (nodeValue.indexOf('ms-for-end:') !== 0) {
                avalon.error('ms-for-end指令前不能有空格')
            }

            pre.$append = stringifyNode({
                nodeType: 8,
                type: '#comment',
                skipContent: true,
                nodeValue: signature,
                key: 'traceKey'
            }, {key: 1}) + '\n' //结束循环
                    + "\n})"
            if (forstack.length) {
                pre.$append += "\n" + signature + '.end =' +
                        stringifyNode({
                            nodeType: 8,
                            type: "#comment",
                            skipContent: true,
                            signature: signature,
                            nodeValue: "ms-for-end:"
                        }) + '\n'
                forstack.pop()
            }
            return ''
        } else if (nodeValue.indexOf('ms-js:') === 0) {//插入普通JS代码
            return stringifyNode(pre)
            //str += parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
        } else {
            return stringifyNode(pre)
        }
    }

}


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


function stringifyTag(obj, noQuote) {
    var arr1 = []
//字符不用东西包起来就变成变量
    for (var i in obj) {
        if (i === 'props') {
            var arr2 = []
            for (var k in obj.props) {
                var kv = obj.props[k]
                if (typeof kv === 'string' && (
                        k.slice(0,3) !== 'ms-' &&
                        kv.indexOf('(function()') == -1)) {
                    kv = quote(kv)
                }
                arr2.push(fixKey(k) + ': ' + kv)
            }
            arr1.push('\tprops: {' + arr2.join(',\n') + '}')
        } else {
            var v = obj[i]
            if (typeof v === 'string' && i !== 'children') {
                v = noQuote && noQuote[i] ? v : quote(v)
            }
            arr1.push(fixKey(i) + ':' + v)
        }
    }
    return '{\n' + arr1.join(',\n') + '}'
}

function stringifyNode(obj, skip) {
    var arr = []
    skip = skip || {}
    for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
            if (skip[i]) {
                arr.push('\t' + fixKey(i) + ': ' + obj[i])
            } else {
                arr.push('\t' + fixKey(i) + ': ' + quote(obj[i]))
            }
        }
    }
    return add('{\n' + arr.join(',\n') + '}')
}
