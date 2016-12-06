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

function nomalString(str) {
    return avalon.unescapeHTML(str.replace(rfill, fill))
}
//https://github.com/rviscomi/trunk8/blob/master/trunk8.js

var ropenTag = /^<([-A-Za-z0-9_]+)\s*([^>]*?)(\/?)>/
var rendTag = /^<\/([^>]+)>/
var rtagStart = /[\!\/a-z]/i //闭标签的第一个字符,开标签的第一个英文,注释节点的!
var rlineSp = /\\n\s*/g
var rattrs = /([^=\s]+)(?:\s*=\s*(\S+))?/

var rcontent = /\S/ //判定里面有没有内容
export function fromString(str) {
    return from(str)
}
avalon.lexer = fromString

var strCache = new Cache(100)

function AST() {}
AST.prototype = {
    init(str) {
        this.ret = []
        var stack = []
        stack.last = function() {
            return stack[stack.length - 1]
        }
        this.stack = stack
        this.str = str
    },
    gen() {
        var breakIndex = 999999
        do {
            this.tryGenText()
            this.tryGenComment()
            this.tryGenOpenTag()
            this.tryGenCloseTag()
            var node = this.node
            this.node = 0
            if (!node || --breakIndex === 0) {
                break
            }
            if (node.end) {
                if (node.nodeName === 'table') {
                    makeTbody(node.children)
                }
                delete node.end
            }
        } while (this.str.length);
        return this.ret
    },
    fixPos: function(str, i) {
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
        return i
    },
    tryGenText() {
        var str = this.str
        if (str.charAt(0) !== '<') { //处理文本节点
            var i = str.indexOf('<')
            if (i === -1) {
                i = str.length
            } else if (!rtagStart.test(str.charAt(i + 1))) {
                //处理`内容2 {{ (idx1 < < <  1 ? 'red' : 'blue' ) + a }} ` 的情况 
                i = this.fixPos(str, i)
            }
            var nodeValue = str.slice(0, i).replace(rfill, fill)
            this.str = str.slice(i)
            this.node = {
                nodeName: '#text',
                nodeValue: nodeValue
            }
            if (rcontent.test(nodeValue)) {
                this.tryGenChildren() //不收集空白节点
            }
        }
    },
    tryGenComment() {
        if (!this.node) {
            var str = this.str
            var i = str.indexOf('<!--') //处理注释节点
                /* istanbul ignore if*/
            if (i === 0) {
                var l = str.indexOf('-->')
                if (l === -1) {
                    avalon.error('注释节点没有闭合' + str)
                }
                var nodeValue = str.slice(4, l).replace(rfill, fill)
                this.str = str.slice(l + 3)
                this.node = {
                    nodeName: '#comment',
                    nodeValue: nodeValue
                }
                this.tryGenChildren()
            }
        }
    },
    tryGenOpenTag() {
        if (!this.node) {
            var str = this.str
            var match = str.match(ropenTag) //处理元素节点开始部分
            if (match) {
                var nodeName = match[1]
                var props = {}
                if (/^[A-Z]/.test(nodeName) && avalon.components[nodeName]) {
                    props.is = nodeName
                }
                nodeName = nodeName.toLowerCase()
                var isVoidTag = !!voidTag[nodeName] || match[3] === '\/'
                var node = this.node = {
                    nodeName: nodeName,
                    props: {},
                    children: [],
                    isVoidTag: isVoidTag
                }
                var attrs = match[2]
                if (attrs) {
                    this.genProps(attrs, node.props)
                }
                this.tryGenChildren()
                str = str.slice(match[0].length)
                if (isVoidTag) {
                    node.end = true
                } else {
                    this.stack.push(node)
                    if (orphanTag[nodeName] || nodeName === 'option') {
                        var index = str.indexOf('</' + nodeName + '>')
                        var innerHTML = str.slice(0, index).trim()
                        str = str.slice(index)
                        makeOrphan(node, nodeName, nomalString(innerHTML))
                    }
                }
                this.str = str
            }
        }
    },
    tryGenCloseTag() {
        if (!this.node) {
            var str = this.str
            var match = str.match(rendTag) //处理元素节点结束部分
            if (match) {
                var nodeName = match[1].toLowerCase()
                var last = this.stack.last()
                    /* istanbul ignore if*/
                if (!last) {
                    avalon.error(match[0] + '前面缺少<' + nodeName + '>')
                        /* istanbul ignore else*/
                } else if (last.nodeName !== nodeName) {
                    var errMsg = last.nodeName + '没有闭合,请注意属性的引号'
                    avalon.warn(errMsg)
                    avalon.error(errMsg)
                }
                var node = this.stack.pop()
                node.end = true
                this.node = node
                this.str = str.slice(match[0].length)
            }
        }
    },
    tryGenChildren() {
        var node = this.node
        var p = this.stack.last()
        if (p) {
            validateDOMNesting(p, node)
            p.children.push(node)
        } else {
            this.ret.push(node)
        }
    },
    genProps(attrs, props) {
        
        while (attrs) {
            var arr = rattrs.exec(attrs)
   
            if (arr) {
                var name = arr[1]
                var value = arr[2] || ''
                attrs = attrs.replace(arr[0], '')
                if (value) {
                    //https://github.com/RubyLouvre/avalon/issues/1844
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
}

var vdomAst = new AST()

function from(str) {
    var cacheKey = str
    var cached = strCache.get(cacheKey)
    if (cached) {
        return avalon.mix(true, [], cached)
    }
    stringPool.map = {}
    str = clearString(str)

    vdomAst.init(str)
    var ret = vdomAst.gen()
    strCache.put(cacheKey, avalon.mix(true, [], ret))
    return ret

}