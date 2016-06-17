
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

function parseNodes(array, inner) {
    //ms-important， ms-controller ， ms-for 不可复制，省得死循环
    //ms-important --> ms-controller --> ms-for --> ms-widget --> ms-effect --> ms-if
    var buffer = inner ? []: ['\nvar vnodes = [];'] 

    for (var i = 0, el; el = array[i++]; ) {
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



function parseNode(pre) {
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
            delete pre.skipAttrs
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
        if(pre.skipContent)
            cur.skipContent = true
        if(pre.skipAttrs)
            cur.skipAttrs = true

        return addTag(cur)

    } else if (pre.nodeType === 8) {
        var nodeValue = pre.nodeValue
        if (rmsFor.test(nodeValue)) {// 处理ms-for指令
            if (nodeValue.indexOf('ms-for:') !== 0) {
                avalon.error('ms-for指令前不能有空格')
            }
            var cur = {
                directive: 'for',
                vmodel: '__vmodel__'
            }
            for (var i in pre) {
                if (pre.hasOwnProperty(i)) {
                    cur[i] = pre[i]
                }
            }

            directives['for'].parse(cur, pre, pre)

            return addTag(cur)

        } else if (rmsForEnd.test(nodeValue)) {
            if (nodeValue.indexOf('ms-for-end:') !== 0) {
                avalon.error('ms-for-end指令前不能有空格')
            }
            pre.$append = addTag({
                nodeType: 8,
                type: '#comment',
                nodeValue: pre.signature,
                key: 'traceKey'
            }) +
                    '\n},__local__,vnodes)\n' +
                    addTag({
                        nodeType: 8,
                        type: "#comment",
                        signature: pre.signature,
                        nodeValue: "ms-for-end:"
                    }) + '\n'

            return ''
        } else if (nodeValue.indexOf('ms-js:') === 0) {//插入JS声明语句
            var statement = parseExpr(nodeValue.replace('ms-js:', ''), 'js') + '\n'
            var ret = addTag(pre)
            var match = statement.match(rstatement)
            if (match && match[1]) {
                pre.$append = (pre.$append || '') + statement +
                        "\n__local__." + match[1] + ' = ' + match[1] + '\n'
            } else {
                avalon.warn(nodeValue + ' parse fail!')
            }
            return ret
        } else {
            return addTag(pre)
        }
    } else if (Array.isArray(pre)) {
        pre.$append = parseNodes(pre, true)
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
    return '{\ntype: "#text",\nnodeType:3,\nnodeValue: ' + nodeValue + '\n}'
}

module.exports = parseNodes
