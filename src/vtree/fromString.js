/**
 * ------------------------------------------------------------
 * avalon2.1.1的新式lexer
 * 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
 * 此阶段只会生成VElement,VText,VComment
 * ------------------------------------------------------------
 */
import { avalon, Cache } from '../seed/core'
import { clearString, stringPool, fill, rfill } from "./clearString"
import { voidTag } from "./voidTag"
import { orphanTag } from "./orphanTag"
import { makeOrphan } from "./makeOrphan"
import { makeTbody } from "./makeTbody"
import { validateDOMNesting } from "./validateDOMNesting"


var ropenTag = /^<([-A-Za-z0-9_]+)\s*([^>]*?)(\/?)>/
var rendTag = /^<\/([^>]+)>/
    //https://github.com/rviscomi/trunk8/blob/master/trunk8.js
    //判定里面有没有内容
var rcontent = /\S/
export function fromString(str) {
    return from(str)
}
avalon.lexer = fromString
var rtagStart = /[\!\/a-z]/i //闭标签的第一个字符,开标签的第一个英文,注释节点的!
var strCache = new Cache(100)

function from(str) {
    var cacheKey = str
    var cached = strCache.get(cacheKey)
    if (cached) {
        return avalon.mix(true, [], cached)
    }
    stringPool.map = {}
    str = clearString(str)
    var stack = []
    stack.last = function() {
        return stack[stack.length - 1]
    }
    var ret = []

    var breakIndex = 100000
    do {
        var node = false
        if (str.charAt(0) !== '<') { //处理文本节点
            var i = str.indexOf('<')
            if (i === -1) {
                i = str.length
            } else if (!rtagStart.test(str.charAt(i + 1))) {
                //处理`内容2 {{ (idx1 < < <  1 ? 'red' : 'blue' ) + a }} ` 的情况 
                var tryCount = str.length - i
                while (tryCount--) {
                    if (!rtagStart.test(str.charAt(i + 1))) {
                        i = str.indexOf('<', i + 1)
                    } else {
                        break
                    }
                }
                if (tryCount === 0) {
                    i = str.length
                }
            }

            var nodeValue = str.slice(0, i).replace(rfill, fill)
            str = str.slice(i)
            node = {
                nodeName: '#text',
                nodeValue: nodeValue
            }
            if (rcontent.test(nodeValue)) {
                makeChildren(node, stack, ret) //不收集空白节点
            }
        }
        if (!node) {
            var i = str.indexOf('<!--') //处理注释节点
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
            var match = str.match(ropenTag) //处理元素节点开始部分
            if (match) {
                var nodeName = match[1]
                var props = {}
                if (/^[A-Z]/.test(nodeName) && avalon.components[nodeName]) {
                    props.is = nodeName
                }
                nodeName = nodeName.toLowerCase()
                var isVoidTag = !!voidTag[nodeName] || match[3] === '\/'
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
                    if (orphanTag[nodeName] || nodeName == 'option') {
                        var index = str.indexOf('</' + nodeName + '>')
                        var innerHTML = str.slice(0, index).trim()
                        str = str.slice(index)
                        makeOrphan(node, nodeName, nomalString(innerHTML))

                    }
                }
            }
        }
        /* istanbul ignore if*/
        if (!node) {
            var match = str.match(rendTag) //处理元素节点结束部分
            if (match) {
                var nodeName = match[1].toLowerCase()
                var last = stack.last()
                    /* istanbul ignore if*/
                if (!last) {
                    avalon.error(match[0] + '前面缺少<' + nodeName + '>')
                        /* istanbul ignore else*/
                } else if (last.nodeName !== nodeName) {
                    var errMsg = last.nodeName + '没有闭合,请注意属性的引号'
                    avalon.warn(errMsg)
                    avalon.error(errMsg)
                }
                node = stack.pop()
                node.end = true
                str = str.slice(match[0].length)
            }
        }
        /* istanbul ignore if*/
        if (!node || --breakIndex === 0) {
            break
        }
        if (node.end) {
            if (node.nodeName === 'table') {
                makeTbody(node.children)
            }
            delete node.end
        }

    } while (str.length)

    strCache.put(cacheKey, avalon.mix(true, [], ret))
    return ret

}


function makeChildren(node, stack, ret) {
    var p = stack.last()
    if (p) {

        validateDOMNesting(p, node)
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