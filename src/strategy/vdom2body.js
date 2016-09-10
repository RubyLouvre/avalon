/*
 * 本模块是用于将虚拟DOM变成一个函数
 */

var extractBindings = require('./parser/extractBindings')
var stringify = require('./parser/stringify')
var parseExpr = require('./parser/parseExpr')
var decode = require('./parser/decode')
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
    if (!vdom.nodeName)
        return false
    switch (vdom.nodeName) {
        case '#text':
            if (vdom.dynamic) {
                return add(parseText(vdom))
            } else {
                return addTag(vdom)
            }

        case '#comment':
            var nodeValue = vdom.nodeValue
            /* istanbul ignore else  */
            if (vdom.forExpr) {// 处理ms-for指令
                var copy = {
                    //  dynamic: true,
                    vmodel: '__vmodel__'
                }
                for (var i in vdom) {
                    if (vdom.hasOwnProperty(i) && !skips[i]) {
                        copy[i] = vdom[i]
                    }
                }
                avalon.directives['for'].parse(copy, vdom, vdom)

                vdom.$append += avalon.caches[vdom.signature] //vdom.template
                return addTag(copy)
            } else if (nodeValue === 'ms-for-end:') {
                vdom.$append = addTag({
                    nodeName: '#comment',
                    nodeValue: vdom.signature

                }) +
                        ' return vnodes}\n })\n},__local__,vnodes)\n' +
                        addTag({
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
            } else {
                return addTag(vdom)
            }
        default:
            if (!vdom.dynamic && vdom.skipContent) {
                return add(stringify(vdom, true))
            }

            var copy = {
                nodeName: vdom.nodeName
            }
            var props = vdom.props
            if (vdom.dynamic) {
                //copy.dynamic = '{}'//动态生成dynamic
                var bindings = extractBindings(copy, props)
                bindings.map(function (b) {
                    //将ms-*的值变成函数,并赋给copy.props[ms-*]
                    //如果涉及到修改结构,则在source添加$append,$prepend
                    avalon.directives[b.type].parse(copy, vdom, b)
                    return b.name
                })

            } else if (props) {
                copy.props = {}
                for (var i in props) {
                    copy.props[i] = props[i]
                }
            }

            if (vdom.isVoidTag) {
                copy.isVoidTag = true
            } else {
                if (!('children' in copy)) {
                    var c = vdom.children
                    if (c) {
                        if (vdom.skipContent) {
                            copy.children = '[' + c.map(function (a) {
                                return stringify(a, true)
                            }) + ']'
                        } else if (c.length === 1 && c[0].nodeName === '#text') {

                            if (c[0].dynamic) {
                                copy.children = '[' + parseText(c[0]) + ']'
                            } else {
                                copy.children = '[' + stringify(c[0], true) + ']'
                            }

                        } else {

                            copy.children = '(function(){' + parseNodes(c) + '})()'
                        }
                    }
                }
            }
            if (vdom.template)
                copy.template = vdom.template
            if (vdom.skipContent)
                copy.skipContent = true
            return addTag(copy)

    }

}

module.exports = parseNodes

function wrapDelimiter(expr) {
    return rident.test(expr) ? expr : parseExpr(expr, 'text')
}

function add(a) {
    return 'vnodes.push( ' + a + ');'
}
function addTag(obj) {
    return add(stringify(obj))
}

avalon.matchDep = function (a, s) {
    if (!s)
        return true
    return a.split(',').some(function (aa) {
        if (s.indexOf(aa) === 0)
            return true
    })
}

avalon.addDirs = function (obj, alwayHasDynamic) {
    var args = avalon.slice(arguments, 2)
    for (var i = 0; i < args.length; i += 3) {
        var path = args[i]
        var dir = args[i + 1]
        var fn = args[i + 2]
        if (avalon.matchDep(path, avalon.spath)) {
            if (typeof fn === 'function' && dir.indexOf('ms-on') === -1) {
                obj[dir] = fn()
            } else {
                obj[dir] = fn
            }

            alwayHasDynamic = true
        }
    }
    if (alwayHasDynamic) {
        obj.dynamic = {}
    }
    return obj
}

avalon.collectDep = function (str) {
    var arr = []
    str.replace(/__vmodel__\.([\$\w]+)/g, function (a, b) {
        arr.push(b)
        return ''
    })
    return arr.length ? quote(arr.join(',')) : '""'
}

function parseText(el) {
    var array = extractExpr(el.nodeValue)//返回一个数组
    var nodeValue = ''

    if (array.length === 1) {
        var expr = array[0].expr
        nodeValue = wrapDelimiter(expr)
        if (nodeValue === expr) {
            return '{\nnodeName: "#text",\ndynamic:true,\nnodeValue: ' + nodeValue + '\n}'
        } else {
            var path = avalon.collectDep(nodeValue)
            return 'avalon.addDirs({nodeName: "#text"}, false,' + path + ',"nodeValue",' + nodeValue + ')'
        }

    } else {
        var always = false
        var token = array.map(function (el) {
            if (el.type) {
                nodeValue = wrapDelimiter(el.expr)
                if (nodeValue === el.expr) {
                    always = true
                } else {
                    nodeValue += "()"
                }
                return nodeValue
            } else {
                return quote(el.expr)
            }
        }).join(' + ')
        nodeValue = 'function(){return ' + token + "}"
        var ternary = avalon.collectDep(nodeValue)
        var aaa = [always, ternary, '"nodeValue"', nodeValue]
        return  'avalon.addDirs({nodeName: "#text"}, ' + aaa + ' )'
    }


}
avalon.parseText = parseText

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
