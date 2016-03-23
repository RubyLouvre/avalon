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

var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/

var rtext = /^[^<]+/
var rcomment = /^<!--([\w\W]*?)-->/

var rnumber = /\d+/g
var rspAfterForStart = /^\s*ms-for\:/
var rspBeforeForEnd = /^\s*ms-for-end\:/
var r = require('../seed/regexp')
var rsp = r.sp
var rfill = /\?\?\d+/g
var rleftSp = r.leftSp
var rstring = r.string


var rbind = avalon.config.rbind


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


function lexer(text, recursive) {
    var nodes = []
    if (recursive && !rbind.test(text)) {
        return nodes
    }
    if (!recursive) {
        text = text.replace(rstring, dig)
    }
    do {
        var outerHTML = ''
        var node = false
        var match = text.match(rtext)
        if (match) {//尝试匹配文本
            outerHTML = match[0]
            node = new VText(outerHTML.replace(rfill, fill))
        }

        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                outerHTML = match[0]
                node = new VComment(match[1].replace(rfill, fill))
                var nodeValue = node.nodeValue
                if (rspBeforeForEnd.test(nodeValue)) {
                    var sp = nodes[nodes.length - 1]
                    //移除紧挨着<!--ms-for-end:xxxx-->前的空白节点
                    if (sp && sp.type === '#text' && rsp.test(sp.nodeValue)) {
                        nodes.pop()
                    }
                }
            }
        }


        if (!node) {//尝试匹配拥有闭标签的元素节点
            match = text.match(rfullTag)
            if (match) {
                outerHTML = match[0]//贪婪匹配 outerHTML,可能匹配过多
                var type = match[1].toLowerCase()//nodeName
                outerHTML = clipOuterHTML(outerHTML, type)

                match = outerHTML.match(rvoidTag)||[] //抽取所有属性

                var props = {}
                if (match[2]) {
                    handleProps(match[2], props)
                }

                var innerHTML = outerHTML.slice(match[0].length,
                        (type.length + 3) * -1) //抽取innerHTML

                node = {
                    type: type,
                    props: props,
                    template: innerHTML.replace(rfill, fill).trim(),
                    children: []
                }
                node = modifyProps(node, innerHTML, nodes)
            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签
                outerHTML = match[0]
                type = match[1].toLowerCase()
                props = {}
                if (match[2]) {
                    handleProps(match[2], props)
                }
                node = {
                    type: type,
                    props: props,
                    template: '',
                    children: [],
                    isVoidTag: true
                }
                modifyProps(node, '', nodes)
            }
        }

        if (node) {//从text中移除被匹配的部分
            nodes.push(node)
            text = text.slice(outerHTML.length)
            if (node.type === '#comment' && rspAfterForStart.test(node.nodeValue)) {
                node.signature = makeHashCode('for')
                //移除紧挨着<!--ms-for:xxxx-->后的空白节点
                text = text.replace(rleftSp, '')
            }
        } else {
            break
        }
    } while (1);
    if (!recursive) {
        maps = {}
    }
    return nodes
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
    console.log(gtlt, "---")
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
    return  matchText.slice(0, findex) //取得正确的outerHTML
}


function modifyProps(node, innerHTML, nodes) {
    var type = node.type
    if (node.props['ms-skip']) {
        node.skipContent = true
    } else {
        switch (type) {
            case 'style':
            case 'script':
            case 'noscript':
            case 'template':
            case 'textarea':
                node.skipContent = true
                if (type === 'textarea') {
                    node.props.type = 'textarea'
                }
                break
            case 'input':
                if (!node.props.type) {
                    node.props.type = 'text'
                }
            case 'xmp':
                node.children.push(new VText(node.template))
                break
            case 'option':
                node.children.push(new VText(trimHTML(node.template)))
                break
            default:
                if (!node.isVoidTag) {
                    var childs = lexer(innerHTML, true)
                    node.children = childs
                    if (type === 'table') {
                        addTbody(node.children)
                    }
                }
                break
        }
        var forExpr = node.props['ms-for'] 
        if (forExpr) {
            nodes.push({
                type: '#comment',
                nodeValue: 'ms-for:' + forExpr,
                signature: makeHashCode('for')
            })
            delete node.props['ms-for']
            nodes.push(node)
            node = {
                type: '#comment',
                nodeValue: 'ms-for-end:'
            }
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
                    type: 'tbody',
                    template: '',
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
            if (node.type !== 'tr' && node.type.charAt(0) !== "#") {
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
function handleProps(str, props) {
    str.replace(rnogutter, '=').replace(rnowhite, function (el) {
        var arr = el.split('='), value = arr[1] || '',
                name = arr[0].toLowerCase()
        if (arr.length === 2) {
            if (value.indexOf('??') === 0) {
                value = value.replace(rfill, fill).
                        slice(1, -1).
                        replace(ramp, '&').
                        replace(rquote, '"')
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