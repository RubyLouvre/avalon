/**
 * ------------------------------------------------------------
 * avalon2.1.1的新式lexer
 * 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
 * 此阶段只会生成VElement,VText,VComment
 * ------------------------------------------------------------
 */
var ropenTag = /^<([-A-Za-z0-9_]+)\s*([^>]*?)(\/?)>/
var rendTag = /^<\/([^>]+)>/
var rmsForStart = /^\s*ms\-for\:/
var rmsForEnd = /^\s*ms\-for\-end/
//https://github.com/rviscomi/trunk8/blob/master/trunk8.js
//判定里面有没有内容
var rcontent = /\S/
var voidTag = avalon.oneObject('area,base,basefont,bgsound,br,col,command,embed,' +
        'frame,hr,img,input,keygen,link,meta,param,source,track,wbr')
var plainTag = avalon.oneObject('script,style,textarea,xmp,noscript,option,template')
var stringPool = {}


function lexer(str) {
    stringPool = {}
    str = clearString(str)
    var stack = []
    stack.last = function () {
        return  stack[stack.length - 1]
    }
    var ret = []

    var breakIndex = 100000
    do {
        var node = false
        if (str.charAt(0) !== '<') {
            var i = str.indexOf('<')
            i = i === -1 ? str.length : i
            var nodeValue = str.slice(0, i).replace(rfill, fill)
            str = str.slice(i)//处理文本节点
            node = {type: "#text", nodeType: 3, nodeValue: nodeValue}
            if (rcontent.test(nodeValue)) {
                collectNodes(node, stack, ret)//不收集空白节点
            }
        }
        if (!node) {
            var i = str.indexOf('<!--')
            if (i === 0) {
                var l = str.indexOf('-->')
                if (l === -1) {
                    avalon.error("注释节点没有闭合" + str)
                }
                var nodeValue = str.slice(4, l).replace(rfill, fill)
                str = str.slice(l + 3)
                node = {type: "#comment", nodeType: 8, nodeValue: nodeValue}
                collectNodes(node, stack, ret)
                if (rmsForEnd.test(nodeValue)) {
                    var p = stack.last()
                    var nodes = p ? p.children : ret
                    markeRepeatRange(nodes, nodes.pop())
                }
            }

        }
        if (!node) {
            var match = str.match(ropenTag)
            if (match) {
                var type = match[1].toLowerCase()
                var isVoidTag = voidTag[type] || match[3] === '\/'
                node = {type: type, nodeType: 1, props: {}, children: [], isVoidTag: isVoidTag}
                var attrs = match[2]
                if (attrs) {
                    collectProps(attrs, node.props)
                }
                collectNodes(node, stack, ret)
                str = str.slice(match[0].length)
                if (isVoidTag) {
                    node.fire = node.isVoidTag = true
                } else {
                    stack.push(node)
                    if (plainTag[type]) {
                        var index = str.indexOf("</" + type + '>')
                        var innerHTML = str.slice(0, index).trim()
                        str = str.slice(index)
                        if (innerHTML) {
                            switch (type) {
                                case 'style':
                                case 'script':
                                case 'noscript':
                                case 'template':
                                case 'xmp':
                                    node.skipContent = true
                                    if (innerHTML) {
                                        node.children.push({
                                            nodeType: 3,
                                            type: '#text',
                                            nodeValue: nomalString(innerHTML)
                                        })
                                    }
                                    break
                                case 'textarea':
                                    node.skipContent = true
                                    node.props.type = 'textarea'
                                    node.props.value = nomalString(innerHTML)
                                    break
                                case 'option':
                                    node.children.push({
                                        nodeType: 3,
                                        type: '#text',
                                        nodeValue: nomalString(trimHTML(innerHTML))
                                    })
                                    break
                            }
                        }
                    }
                }
            }
        }
        if (!node) {
            var match = str.match(rendTag)
            if (match) {
                var type = match[1].toLowerCase()
                var last = stack.last()
                if (!last) {
                    avalon.error(match[0] + '前面缺少<' + type + '>')
                } else if (last.type !== type) {
                    avalon.error(last.type + '没有闭合')
                }
                node = stack.pop()
                node.fire = true
                str = str.slice(match[0].length)
            }
        }

        if (!node || --breakIndex === 0) {
            break
        }
        if (node.fire) {
            fireEnd(node, stack, ret)
            delete node.fire
        }

    } while (str.length);

    return ret

}

module.exports = lexer

function fireEnd(node, stack, ret) {
    var type = node.type
    var props = node.props
    switch (type) {
        case 'input':
            if (!props.type) {
                props.type = 'text'
            }
            break
        case 'select':
            props.type = type + '-' + props.hasOwnProperty('multiple') ? 'multiple' : 'one'
            break
        case 'table':
            addTbody(node.children)
            break
        default:
            if (type.indexOf('ms-') === 0) {
                props.is = type
                if (!props['ms-widget']) {
                    props['ms-widget'] = '{is:' + avalon.quote(type) + '}'
                }
            }
            break
    }
    var forExpr = props['ms-for']
    if (forExpr) {
        delete props['ms-for']
        var p = stack.last()
        var arr = p ? p.children : ret
        arr.splice(arr.length - 1, 0, {
            nodeType: 8,
            type: '#comment',
            nodeValue: 'ms-for:' + forExpr
        })

        var cb = props['data-for-rendered']
        var cid = cb + ':cb'

        if (cb && !avalon.caches[cid]) {
            avalon.caches[cid] = Function('return ' + avalon.parseExpr(cb, 'on'))()
        }

        markeRepeatRange(arr, {
            nodeType: 8,
            type: '#comment',
            nodeValue: 'ms-for-end:'
        })
    }
}

function markeRepeatRange(nodes, end) {
    end.dynamic = true
    end.signature = avalon.makeHashCode('for')
    var array = [], start, deep = 1
    while (start = nodes.pop()) {
        if (start.nodeType === 8) {
            if (rmsForEnd.test(start.nodeValue)) {
                ++deep
            } else if (rmsForStart.test(start.nodeValue)) {
                --deep
                if (deep === 0) {
                    start.nodeValue = start.nodeValue.replace(rfill, fill)        //nomalString(start.nodeValue)
                    start.signature = end.signature
                    start.dynamic = 'for'
                    start.template = array.map(function (a) {
                        return avalon.vdomAdaptor(a, 'toHTML')
                    }).join('')
                    nodes.push(start, array, end)
                    break
                }
            }
        }
        array.unshift(start)
    }

}


function collectNodes(node, stack, ret) {
    var p = stack.last()
    if (p) {
        p.children.push(node)
    } else {
        ret.push(node)
    }
}

function collectProps(attrs, props) {
    attrs.replace(rnowhite, function (prop) {
        var arr = prop.split('=')
        var name = arr[0]
        var value = arr[1] || ''
        if (name.charAt(0) === ':') {
            name = 'ms-' + name.slice(1)
        }
        if (value) {
            if (value.indexOf('??') === 0) {
                value = nomalString(value).
                        replace(rlineSp, '').
                        slice(1, -1)
            }
        }
        if (!(name in props)) {
            props[name] = value
        }
    })

}
function nomalString(str) {
    return avalon.unescapeHTML(str.replace(rfill, fill))
}

function clearString(str) {
    var array = readString(str)
    for (var i = 0, n = array.length; i < n; i++) {
        str = str.replace(array[i], dig)
    }
    return str
}
function readString(str) {
    var end, s = 0
    var ret = []
    for (var i = 0, n = str.length; i < n; i++) {
        var c = str.charAt(i)
        if (!end) {
            if (c === "'") {
                end = "'"
                s = i
            } else if (c === '"') {
                end = '"'
                s = i
            }
        } else {
            if (c === '\\') {
                i += 1
                continue
            }
            if (c === end) {
                ret.push(str.slice(s, i + 1))
                end = false
            }
        }
    }
    return ret
}

var rfill = /\?\?\d+/g
var rlineSp = /\n\s*/g
var rnowhite = /\S+/g
var number = 1
function dig(a) {
    var key = '??' + number++
    stringPool[key] = a
    return key
}
function fill(a) {
    var val = stringPool[a]
    return val
}
//专门用于处理option标签里面的标签
var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
function trimHTML(v) {
    return String(v).replace(rtrimHTML, '').trim()
}

//如果直接将tr元素写table下面,那么浏览器将将它们(相邻的那几个),放到一个动态创建的tbody底下
function addTbody(nodes) {
    var tbody, needAddTbody = false, count = 0, start = 0, n = nodes.length
    for (var i = 0; i < n; i++) {
        var node = nodes[i]
        if (!tbody) {
            if (node.type === 'tr') {
                tbody = {
                    nodeType: 1,
                    type: 'tbody',
                    children: [],
                    props: {}
                }
                tbody.children.push(node)
                needAddTbody = true
                if (start === 0)
                    start = i
                nodes[i] = tbody
            }
        } else {
            if (node.type !== 'tr' && node.nodeType === 1) {
                tbody = false
            } else {
                tbody.children.push(node)
                count++
                nodes[i] = 0
            }
        }
    }

    if (needAddTbody) {
        for (i = start; i < n; i++) {
            if (nodes[i] === 0) {
                nodes.splice(i, 1)
                i--
                count--
                if (count === 0) {
                    break
                }
            }
        }
    }
}

avalon.speedUp = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        hasDirective(arr[i])
    }
}

function hasDirective(a) {
    switch (a.nodeType) {
        case 3:
            if (avalon.config.rbind.test(a.nodeValue)) {
                a.dynamic = 'expr'
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 8:
            if (a.dynamic) {
                return true
            } else {
                a.skipContent = true
                return false
            }
        case 1:
            if (a.props['ms-skip']) {
                a.skipAttrs = true
                a.skipContent = true
                return false
            }
            if (/^ms\-/.test(a.type) || hasDirectiveAttrs(a.props)) {
                a.dynamic = true
            } else {
                a.skipAttrs = true
            }
            if (a.isVoidTag && !a.dynamic) {
                a.skipContent = true
                return false
            }
            var hasDirective = childrenHasDirective(a.children)
            if (!hasDirective && !a.dynamic) {
                a.skipContent = true
                return false
            }
            return true
        default:
            if (Array.isArray(a)) {
                return childrenHasDirective(a)
            }
    }
}

function childrenHasDirective(arr) {
    var ret = false
    for (var i = 0, el; el = arr[i++]; ) {
        if (hasDirective(el)) {
            ret = true
        }
    }
    return ret
}

function hasDirectiveAttrs(props) {
    if ('ms-skip' in props)
        return false
    for (var i in props) {
        if (i.indexOf('ms-') === 0) {
            return true
        }
    }
    return false
}