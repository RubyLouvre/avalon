/**
 * ------------------------------------------------------------
 * avalon2.2.6的新式lexer
 * 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
 * 此阶段只会生成VElement,VText,VComment
 * ------------------------------------------------------------
 */
import { avalon, Cache, config } from '../seed/core'
import { voidTag } from "./voidTag"

import { validateDOMNesting } from "./validateDOMNesting"


var specalTag = { xmp: 1, style: 1, script: 1, noscript: 1, textarea: 1, '#comment': 1, template: 1 }
var hiddenTag = { style: 1, script: 1, noscript: 1, template: 1 }
var rcontent = /\S/ //判定里面有没有内容
var rsp = /\s/
export function fromString(str) {
    return from(str)
}
avalon.lexer = fromString

var strCache = new Cache(100)


function from(str) {
    var cacheKey = str
    var cached = strCache.get(cacheKey)
    if (cached) {
        return avalon.mix(true, [], cached)
    }

    var ret = parse(str, false)
    strCache.put(cacheKey, avalon.mix(true, [], ret))
    return ret

}

/**
 * 
 * 
 * @param {any} string 
 * @param {any} getOne 只返回一个节点
 * @returns 
 */
function parse(string, getOne) {
    getOne = (getOne === void 666 || getOne === true)
    var ret = lexer(string, getOne)
    if (getOne) {
        return typeof ret[0] === 'string' ? ret[1] : ret[0]
    }
    return ret
}

function lexer(string, getOne) {
    var tokens = []
    var breakIndex = 9990
    var stack = []
    var origString = string
    var origLength = string.length

    stack.last = function() {
        return stack[stack.length - 1]
    }
    var ret = []

    function addNode(node) {
        var p = stack.last()
        if (p && p.children) {
            p.children.push(node)
        } else {
            ret.push(node)
        }
    }

    var lastNode
    do {
        if (--breakIndex === 0) {
            break
        }
        var arr = getCloseTag(string)

        if (arr) { //处理关闭标签
            string = string.replace(arr[0], '')
            const node = stack.pop()
            if (!node) {
                throw '是不是有属性值没有用引号括起'
            }
            //处理下面两种特殊情况：
            //1. option会自动移除元素节点，将它们的nodeValue组成新的文本节点
            //2. table会将没有被thead, tbody, tfoot包起来的tr或文本节点，收集到一个新的tbody元素中

            if (node.nodeName === 'option') {
                node.children = [{
                    nodeName: '#text',
                    nodeValue: getText(node)
                }]
            } else if (node.nodeName === 'table') {
                insertTbody(node.children)
            }
            lastNode = null
            if (getOne && ret.length === 1 && !stack.length) {
                return [origString.slice(0, origLength - string.length), ret[0]]
            }
            continue
        }

        var arr = getOpenTag(string)
        if (arr) {
            string = string.replace(arr[0], '')
            var node = arr[1]
            addNode(node)
            var selfClose = !!(node.isVoidTag || specalTag[node.nodeName])
            if (!selfClose) { //放到这里可以添加孩子
                stack.push(node)
            }
            if (getOne && selfClose && !stack.length) {
                return [origString.slice(0, origLength - string.length), node]
            }
            lastNode = node
            continue
        }

        var text = ''
        do {
            //处理<div><<<<<<div>的情况
            const index = string.indexOf('<')
            if (index === 0) {
                text += string.slice(0, 1)
                string = string.slice(1)

            } else {
                break
            }
        } while (string.length);



        //处理<div>{aaa}</div>,<div>xxx{aaa}xxx</div>,<div>xxx</div>{aaa}sss的情况
        const index = string.indexOf('<') //判定它后面是否存在标签
        if (index === -1) {
            text = string
            string = ''
        } else {
            const openIndex = string.indexOf(config.openTag)

            if (openIndex !== -1 && openIndex < index) {
                if (openIndex !== 0) {
                    text += string.slice(0, openIndex)
                }
                var dirString = string.slice(openIndex)
                var textDir = parseTextDir(dirString)
                text += textDir
                string = dirString.slice(textDir.length)
            } else {
                text += string.slice(0, index)
                string = string.slice(index)
            }
        }
        var mayNode = addText(lastNode, text, addNode)
        if (mayNode) {
            lastNode = mayNode
        }


    } while (string.length);
    return ret
}


function addText(lastNode, text, addNode) {
    if (rcontent.test(text)) {
        if (lastNode && lastNode.nodeName === '#text') {
            lastNode.nodeValue += text
            return lastNode
        } else {
            lastNode = {
                nodeName: '#text',
                nodeValue: text
            }
            addNode(lastNode)
            return lastNode
        }
    }
}



function parseTextDir(string) {
    var closeTag = config.closeTag
    var openTag = config.openTag
    var closeTagFirst = closeTag.charAt(0)
    var closeTagLength = closeTag.length
    var state = 'code',
        quote,
        escape
    for (var i = openTag.length, n = string.length; i < n; i++) {

        var c = string.charAt(i)
        switch (state) {
            case 'code':
                if (c === '"' || c === "'") {
                    state = 'string'
                    quote = c
                } else if (c === closeTagFirst) { //如果遇到}
                    if (string.substr(i, closeTagLength) === closeTag) {
                        return string.slice(0, i + closeTagLength)
                    }
                }
                break
            case 'string':
                if (c === '\\' && /"'/.test(string.charAt(i + 1))) {
                    escape = !escape
                }
                if (c === quote && !escape) {
                    state = 'code'
                }
                break
        }
    }
    throw '找不到界定符' + closeTag

}

var rtbody = /^(tbody|thead|tfoot)$/

function insertTbody(nodes) {
    var tbody = false
    for (var i = 0, n = nodes.length; i < n; i++) {
        var node = nodes[i]
        if (rtbody.test(node.nodeName)) {
            tbody = false
            continue
        }

        if (node.nodeName === 'tr') {
            if (tbody) {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            } else {
                tbody = {
                    nodeName: 'tbody',
                    props: {},
                    children: [node]
                }
                nodes.splice(i, 1, tbody)
            }
        } else {
            if (tbody) {
                nodes.splice(i, 1)
                tbody.children.push(node)
                n--
                i--
            }
        }
    }
}

//<div>{{<div/>}}</div>
function getCloseTag(string) {
    if (string.indexOf("</") === 0) {
        var match = string.match(/\<\/(\w+[^\s\/\>]*)>/);
        if (match) {
            var tag = match[1]
            string = string.slice(3 + tag.length)
            return [match[0], {
                nodeName: tag
            }]
        }
    }
    return null
}
var ropenTag = /\<(\w[^\s\/\>]*)/

function getOpenTag(string) {
    if (string.indexOf("<") === 0) {
        var i = string.indexOf('<!--') //处理注释节点
        if (i === 0) {
            var l = string.indexOf('-->')
            if (l === -1) {
                thow('注释节点没有闭合 ' + string.slice(0, 100))
            }
            var node = {
                nodeName: '#comment',
                nodeValue: string.slice(4, l)
            }
            return [string.slice(0, l + 3), node]
        }
        var match = string.match(ropenTag) //处理元素节点
        if (match) {
            var leftContent = match[0],
                tag = match[1]
            var node = {
                nodeName: tag,
                props: {},
                children: []
            }

            string = string.replace(leftContent, '') //去掉标签名(rightContent)
            try {
                var arr = getAttrs(string) //处理属性
            } catch (e) {}
            if (arr) {
                node.props = arr[1]
                string = string.replace(arr[0], '')
                leftContent += arr[0]
            }

            if (string.charAt(0) === '>') { //处理开标签的边界符
                leftContent += '>'
                string = string.slice(1)
                if (voidTag[node.nodeName]) {
                    node.isVoidTag = true
                }
            } else if (string.slice(0, 2) === '/>') { //处理开标签的边界符
                leftContent += '/>'
                string = string.slice(2)
                node.isVoidTag = true
            }

            if (!node.isVoidTag && specalTag[tag]) { //如果是script, style, xmp等元素
                var closeTag = '</' + tag + '>'
                var j = string.indexOf(closeTag)
                var nodeValue = string.slice(0, j)
                leftContent += nodeValue + closeTag
                node.children.push({
                    nodeName: '#text',
                    nodeValue: nodeValue
                })
                if (tag === 'textarea') {
                    node.props.type = tag
                    node.props.value = nodeValue
                }
            }
            return [leftContent, node]
        }
    }
}

function getText(node) {
    var ret = ''
    node.children.forEach(function(el) {
        if (el.nodeName === '#text') {
            ret += el.nodeValue
        } else if (el.children && !hiddenTag[el.nodeName]) {
            ret += getText(el)
        }
    })
    return ret
}

function getAttrs(string) {
    var state = 'AttrName',
        attrName = '',
        attrValue = '',
        quote,
        escape,
        props = {}
    for (var i = 0, n = string.length; i < n; i++) {
        var c = string.charAt(i)
        switch (state) {
            case 'AttrName':
                if (c === '/' && string.charAt(i + 1) === '>' || c === '>') {
                    if (attrName)
                        props[attrName] = attrName
                    return [string.slice(0, i), props]
                }
                if (rsp.test(c)) {
                    if (attrName) {
                        state = 'AttrEqual'
                    }
                } else if (c === '=') {
                    if (!attrName) {
                        throw '必须指定属性名'
                    }
                    state = 'AttrQuote'
                } else {
                    attrName += c
                }
                break
            case 'AttrEqual':
                if (c === '=') {
                    state = 'AttrQuote'
                } else if (rcontent.test(c)) {
                    props[attrName] = attrName
                    attrName = c
                    state = 'AttrName'
                }
                break
            case 'AttrQuote':
                if (c === '"' || c === "'") {
                    quote = c
                    state = 'AttrValue'
                    escape = false
                }
                break
            case 'AttrValue':
                if (c === '\\' && /"'/.test(string.charAt(i + 1))) {
                    escape = !escape
                }
                if (c === '\n') {
                    break;
                }
                if (c !== quote) {
                    attrValue += c
                } else if (c === quote && !escape) {
                    props[attrName] = attrValue
                    attrName = attrValue = ''
                    state = 'AttrName'
                }
                break
        }
    }
    throw '必须关闭标签'
}