/**
 * ------------------------------------------------------------
 * lexer 将字符串变成一个虚拟DOM树,方便以后进一步变成模板函数
 * 此阶段只会生成VElement,VText,VComment
 * ------------------------------------------------------------
 */

var makeHashCode = avalon.makeHashCode
var vdom = require('../vdom/index')
var VText = vdom.VText
var VComment = vdom.VComment


//匹配只有开标签的无内容元素（Void elements 或 self-contained tags）
//http://www.colorglare.com/2014/02/03/to-close-or-not-to-close.html
//http://blog.jobbole.com/61514/

//var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
//var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/
var rfullTag = /^<([-A-Za-z0-9_]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
var rvoidTag = /^<([-A-Za-z0-9_]+)\s*([^>]*?)\/?>/
var rtext = /^[^<]+/
var rcomment = /^<!--([\w\W]*?)-->/

var rnumber = /\d+/g
var rmsForStart = /^\s*ms\-for\:/
var rmsForEnd = /^\s*ms\-for\-end/
var r = require('../seed/regexp')
var rsp = r.sp
var rfill = /\?\?\d+/g
var rleftSp = r.leftSp
var rstring = r.string


var config = avalon.config


var maps = {}
var number = 1
function dig(a) {
    var key = '??' + number++
    maps[key] = a
    return key
}
function fill(a) {
    var val = maps[a]
    return val
}
var rhasString = /=["']/
var rlineSp = /\n\s*/g
function fixLongAttrValue(attr) {
    return rhasString.test(attr) ?
            attr.replace(rlineSp, '').replace(rstring, dig) : attr
}
function lexer(text, curDeep) {
    var nodes = []
    if (typeof curDeep !== 'number') {
        curDeep = 0
    }
    if (!curDeep) {
        text = text.replace(rstring, dig)
    }
    do {
        var outerHTML = ''
        var node = false
        var match = text.match(rtext)
        if (match) {//尝试匹配文本
            outerHTML = match[0]
            node = {
                type: '#text',
                nodeType: 3,
                nodeValue: outerHTML.replace(rfill, fill)
            }

        }

        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                outerHTML = match[0]
                node = {
                    type: '#comment',
                    nodeType: 8,
                    nodeValue: match[1].replace(rfill, fill)
                }
            }
        }


        if (!node) {//尝试匹配拥有闭标签的元素节点
            match = text.match(rfullTag)
            if (match) {
                outerHTML = match[0]//贪婪匹配 outerHTML,可能匹配过多
                var type = match[1].toLowerCase()//nodeName
                outerHTML = clipOuterHTML(outerHTML, type)

                match = outerHTML.match(rvoidTag) //抽取所有属性

                var props = {}
                if (match[2]) {
                    handleProps(fixLongAttrValue(match[2]), props)
                }

                var innerHTML = outerHTML.slice(match[0].length,
                        (type.length + 3) * -1) //抽取innerHTML
                node = {
                    nodeType: 1,
                    type: type,
                    props: props,
                    children: []
                }
                node = modifyProps(node, nodes, curDeep, innerHTML,
                        innerHTML.replace(rfill, fill).trim())


            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签
                outerHTML = match[0]
                type = match[1].toLowerCase()
                props = {}
                if (match[2]) {
                    handleProps(fixLongAttrValue(match[2]), props)
                }
                node = {
                    nodeType: 1,
                    type: type,
                    props: props,
                    children: [],
                    isVoidTag: true
                }
                node = modifyProps(node, nodes, curDeep, '', '')
            }
        }

        if (node) {//从text中移除被匹配的部分
            if (node.nodeType !== 3 || /\S/.test(node.nodeValue)) {
                nodes.push(node)
            }
            text = text.slice(outerHTML.length)
            if (node.nodeType === 8) {
                if (rmsForStart.test(node.nodeValue)) {

                    node.signature = node.signature || makeHashCode('for')
                    node.dynamic = 'for'
                } else if (rmsForEnd.test(node.nodeValue)) {
                    //将 ms-for与ms-for-end:之间的节点塞到一个数组中
                    nodes.pop()
                    markeRepeatRange(nodes, node)
                }
            }
        } else {
            break
        }
    } while (1);
    if (!curDeep) {
        maps = {}
    }
    return nodes
}



function markeRepeatRange(nodes, end) {

    var array = [], start, deep = 1
    while (start = nodes.pop()) {
        if (start.nodeType === 8) {
            if (rmsForEnd.test(start.nodeValue)) {
                ++deep
            } else if (rmsForStart.test(start.nodeValue)) {
                --deep
                if (deep === 0) {
                    end.signature = start.signature
                    nodes.push(start, array, end)
                    start.template = array.map(function (a) {
                        return avalon.vdomAdaptor(a, 'toHTML')
                    }).join('')
                    break
                }
            }
        }
        array.unshift(start)
    }

}

//用于创建适配某一种标签的正则表达式
var openStr = '(?:\\s+[^>=]*?(?:=[^>]+?)?)*>'
var tagCache = {}// 缓存所有匹配开标签闭标签的正则
var rchar = /./g
var regArgs = avalon.msie < 9 ? 'ig' : 'g'//IE6-8，标签名都是大写
function clipOuterHTML(matchText, type) {
    var opens = []
    var closes = []
    var ropen = tagCache[type + 'open'] ||
            (tagCache[type + 'open'] = new RegExp('<' + type + openStr, regArgs))
    var rclose = tagCache[type + 'close'] ||
            (tagCache[type + 'close'] = new RegExp('<\/' + type + '>', regArgs))

    /* jshint ignore:start */
    matchText.replace(ropen, function (_, b) {
        //注意,页面有时很长,b的数值就很大,如
        //000000000<000000011>000000041<000000066>000000096<000000107>
        opens.push(('0000000000' + b + '<').slice(-10))//取得所有开标签的位置
        return _.replace(rchar, '1')
    }).replace(rclose, function (_, b) {
        closes.push(('0000000000' + b + '>').slice(-10))//取得所有闭标签的位置               
    })

    /* jshint ignore:end */
    //<div><div>01</div><div>02</div></div><div>222</div><div>333</div>
    //会变成000<005<012>018<025>031>037<045>051<059>
    //再变成<<><>><><>
    //最后获取正确的>的索引值,这里为<<><>>的最后一个字符,
    var pos = opens.concat(closes).sort()
    var gtlt = pos.join('').replace(rnumber, '')
    var k = 0, last = 0

    for (var i = 0, n = gtlt.length; i < n; i++) {
        var c = gtlt.charAt(i)
        if (c === '<') {
            k += 1
        } else {
            k -= 1
        }
        if (k === 0) {
            last = i
            break
        }
    }
    var findex = parseFloat(pos[last]) + type.length + 3 // (</>为三个字符)
    return matchText.slice(0, findex) //取得正确的outerHTML
}


function modifyProps(node, nodes, curDeep, innerHTML, template) {
    var type = node.type
    var props = node.props
    switch (type) {
        case 'style':
        case 'script':
        case 'noscript':
        case 'template':
        case 'textarea':
        case 'xmp':
            node.skipContent = true

            if (template) {
                node.children.push(new VText(template))
            } else {
                node.children = []
            }
            if (type === 'textarea') {
                props.type = 'textarea'
                node.children.length = 0
            }
            break
        case 'input':
            if (!props.type) {
                props.type = 'text'
            }
            break
        case 'select':
            if (props.hasOwnProperty('multiple')) {
                props.multiple = 'multiple'
                node.multiple = true
            }
            break

        case 'option':
            node.children.push(new VText(trimHTML(template)))
            break
        default:
            if (/^ms-/.test(type)) {
                props.is = type
                if (!props['ms-widget']) {
                    props['ms-widget'] = '{is:' + avalon.quote(type) + '}'
                }
            }
            break
    }

    if (!node.isVoidTag && !node.skipContent) {
        var childs = lexer(innerHTML, curDeep + 1)
        node.children = childs
        if (type === 'table') {
            addTbody(node.children)
        }
    }
    var forExpr = props['ms-for']
    if (forExpr) {
        var cb = props['data-for-rendered']
        var cid = cb + ':cb'
        delete props['ms-for']
        nodes.push({
            nodeType: 8,
            type: '#comment',
            nodeValue: 'ms-for:' + forExpr,
            signature: makeHashCode('for'),
            dynamic: 'for',
            cid: cid
        })

        if (cb && !avalon.caches[cid]) {
            avalon.caches[cid] = Function('return ' + avalon.parseExpr(cb, 'on'))()
        }

        nodes.push(node)
        return {
            nodeType: 8,
            type: '#comment',
            dynamic: true,
            nodeValue: 'ms-for-end:'
        }
    }

    return node
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


var ramp = /&amp;/g
var rnowhite = /\S+/g
var rquote = /&quot;/g
var rnogutter = /\s*=\s*/g
//https://github.com/RubyLouvre/avalon/issues/1501
function handleProps(str, props) {
    str.replace(rnogutter, '=').replace(rnowhite, function (el) {
        var arr = el.split('='), value = arr[1] || '',
                name = arr[0].toLowerCase()
        if (arr.length === 2) {
            if (value.indexOf('??') === 0) {
                value = value.replace(rfill, fill).
                        slice(1, -1)
            }
        }
        props[name] = value
    })
}


//form prototype.js
var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
function trimHTML(v) {
    return String(v).replace(rtrimHTML, '').trim()
}


module.exports = lexer

avalon.speedUp = function (arr) {
    for (var i = 0; i < arr.length; i++) {
        hasDirective(arr[i])
    }
}

function hasDirective(a) {
    switch (a.nodeType) {
        case 3:
            if (config.rbind.test(a.nodeValue)) {
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
            if (/^ms\-/.test(a.type)) {
                a.dynamic = true
            }
            if (hasDirectiveAttrs(a.props)) {
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