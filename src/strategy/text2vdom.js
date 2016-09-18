/**
 * ------------------------------------------------------------
 * avalon2.1.1的新式lexer
 * 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
 * 此阶段只会生成VElement,VText,VComment
 * ------------------------------------------------------------
 */
var avalon = require('../seed/core')
var clearString = require('./clearString')
var voidTag = require('./voidTag')
var addTbody = require('./addTbody')
var variantSpecial = require('./variantSpecial')
var specialTag = avalon.oneObject('script,style,textarea,xmp,noscript,option,template')

var ropenTag = /^<([-A-Za-z0-9_]+)\s*([^>]*?)(\/?)>/
var rendTag = /^<\/([^>]+)>/
//https://github.com/rviscomi/trunk8/blob/master/trunk8.js
//判定里面有没有内容
var rcontent = /\S/
var rfill = /\?\?\d+/g
var rnowhite = /\S+/g
var number = 1
var stringPool = {}


module.exports = makeNode

function makeNode(str) {
    stringPool = {}
    str = clearString(str, dig)
    var stack = []
    stack.last = function () {
        return  stack[stack.length - 1]
    }
    var ret = []

    var breakIndex = 100000
    do {
        var node = false
        if (str.charAt(0) !== '<') {//处理文本节点
            var i = str.indexOf('<')
            i = i === -1 ? str.length : i
            var nodeValue = str.slice(0, i).replace(rfill, fill)
            str = str.slice(i)
            node = {
                nodeName: '#text',
                nodeValue: nodeValue
            }
            if (rcontent.test(nodeValue)) {
                makeChildren(node, stack, ret)//不收集空白节点
            }
        }
        if (!node) {
            var i = str.indexOf('<!--')//处理注释节点
            /* istanbul ignore if*/
            if (i === 0) {
                var l = str.indexOf('-->')
                if (l === -1) {
                    avalon.error('注释节点没有闭合' + str)
                }
                var nodeValue = str.slice(4, l).replace(rfill, fill)
                str = str.slice(l + 3)
                node = {
                    nodeName: '#comment',
                    nodeValue: nodeValue
                }
                makeChildren(node, stack, ret)
            }

        }
        if (!node) {
            var match = str.match(ropenTag)//处理元素节点开始部分
            if (match) {
                var nodeName = match[1].toLowerCase()
                var isVoidTag = voidTag[nodeName] || match[3] === '\/'
                node = {
                    nodeName: nodeName,
                    props: {},
                    children: [],
                    isVoidTag: isVoidTag
                }

                var attrs = match[2]
                if (attrs) {
                    makeProps(attrs, node.props)
                }
                makeChildren(node, stack, ret)
                str = str.slice(match[0].length)
                if (isVoidTag) {
                    node.end = true
                } else {
                    stack.push(node)
                    if (specialTag[nodeName]) {
                        var index = str.indexOf('</' + nodeName + '>')
                        var innerHTML = str.slice(0, index).trim()
                        str = str.slice(index)

                        variantSpecial(node, nodeName, nomalString(innerHTML))

                    }
                }
            }
        }
        if (!node) {
            var match = str.match(rendTag)//处理元素节点结束部分
            if (match) {
                var nodeName = match[1].toLowerCase()
                var last = stack.last()
                /* istanbul ignore if*/
                /* istanbul ignore else*/
                if (!last) {
                    avalon.error(match[0] + '前面缺少<' + nodeName + '>')
                } else if (last.nodeName !== nodeName) {
                    avalon.error(last.nodeName + '没有闭合')
                }
                node = stack.pop()
                node.end = true
                str = str.slice(match[0].length)
            }
        }

        if (!node || --breakIndex === 0) {
            break
        }
        if (node.end) {
            makeTbody(node, stack, ret)
            delete node.end
        }

    } while (str.length);

    return ret

}



function makeTbody(node, stack, ret) {
    var nodeName = node.nodeName
    var props = node.props
    if (nodeName === 'table') {
        addTbody(node.children)
    }
    var forExpr = props['ms-for']
    //tr两旁的注释节点还会在addTbody中挪一下位置
    if (forExpr) {
        delete props['ms-for']
        var p = stack.last()
        var arr = p ? p.children : ret
        arr.splice(arr.length - 1, 1, {
            nodeName: '#comment',
            nodeValue: 'ms-for:' + forExpr,
            type: nodeName
        }, node, {
            nodeName: '#comment',
            nodeValue: 'ms-for-end:',
            type: nodeName
        })

    }
}


function makeChildren(node, stack, ret) {
    var p = stack.last()
    if (p) {
        p.children.push(node)
    } else {
        ret.push(node)
    }
}

var rlineSp = /[\n\r]s*/g
var rattrs = /([^=\s]+)(?:\s*=\s*(\S+))?/
function makeProps(attrs, props) {
    while (attrs) {
        var arr = rattrs.exec(attrs)
        if (arr) {
            var name = arr[1]
            var value = arr[2] || ''
            attrs = attrs.replace(arr[0], '')
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
        } else {
            break
        }
    }
}

function nomalString(str) {
    return avalon.unescapeHTML(str.replace(rfill, fill))
}

function dig(a) {
    var key = '??' + number++
    stringPool[key] = a
    return key
}
function fill(a) {
    var val = stringPool[a]
    return val
}