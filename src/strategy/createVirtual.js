
var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
//匹配只有开标签的无内容元素（Void elements 或 self-contained tags）
//http://www.colorglare.com/2014/02/03/to-close-or-not-to-close.html
//http://blog.jobbole.com/61514/
var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/
//用于创建适配某一种标签的正则表达式
//var openStr = "(?:\\s+[^=\\s]+(?:\\=[^>\\s]+)?)*\\s*>"
var openStr = "(?:\\s+[^>=]*?(?:=[^>]+?)?)*>"
//匹配文本节点
var rtext = /^[^<]+/
//匹配注释节点
var rcomment = /^<!--([\w\W]*?)-->/

var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g
var rstring2 = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/
// /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
var rnocontent = /textarea|template|script|style/
var tagCache = {}// 缓存所有匹配开标签闭标签的正则
var controllerHook = require("../vdom/hooks").controllerHook

var maps = {}
var number = 1
function dig(a) {
    var key = "??" + number++
    maps[key] = a
    return key
}
var rfill = /\?\?\d+/g
function fill(a) {
    var val = maps[a]
    return val
}
var pushArray = require("../base/builtin").pushArray
var vdom = require("../vdom/index")
var VText = vdom.VText
var VComment = vdom.VComment
var VElement = vdom.VElement
var rchar = /./g
//=== === === === 创建虚拟DOM树 === === === === =

//此阶段只会生成VElement,VText,VComment
function createVirtual(text, recursive) {

    var nodes = []
    if (recursive && !avalon.config.rbind.test(text)) {
        return nodes
    }
    if (!recursive) {
        text = text.replace(rstring, dig)
    }
    do {
        var matchText = ""

        var match = text.match(rtext)
        var node = false

        if (match) {//尝试匹配文本
            matchText = match[0]
            node = new VText(matchText.replace(rfill, fill))
        }

        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                matchText = match[0]
                node = new VComment(match[1].replace(rfill, fill))
            }
        }


        if (!node) {//尝试匹配拥有闭标签的元素节点
            match = text.match(rfullTag)
            if (match) {
                matchText = match[0]//贪婪匹配 outerHTML,可能匹配过多
                var type = match[1].toLowerCase()//nodeName
                var opens = []
                var closes = []
                var ropen = tagCache[type + "open"] ||
                        (tagCache[type + "open"] = new RegExp("<" + type + openStr, "g"))
                var rclose = tagCache[type + "close"] ||
                        (tagCache[type + "close"] = new RegExp("<\/" + type + ">", "g"))
                /* jshint ignore:start */
                matchText.replace(ropen, function (_, b) {
                    //注意,页面有时很长,b的数值就很大,如
                    //000000000<000000011>000000041<000000066>000000096<000000107>
                    opens.push(("0000000000" + b + "<").slice(-10))//取得所有开标签的位置
                    return _.replace(rchar, "1")
                }).replace(rclose, function (_, b) {
                    closes.push(("0000000000" + b + ">").slice(-10))//取得所有闭标签的位置               
                })

                /* jshint ignore:end */
                //<div><div>01</div><div>02</div></div><div>222</div><div>333</div>
                //会变成000<005<012>018<025>031>037<045>051<059>
                //再变成<<><>><><>
                //最后获取正确的>的索引值,这里为<<><>>的最后一个字符,
                var pos = opens.concat(closes).sort()
                var gtlt = pos.join("").replace(/\d+/g, "")
                var k = 0, last = 0

                for (var i = 0, n = gtlt.length; i < n; i++) {
                    var c = gtlt.charAt(i)
                    if (c === "<") {
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
                matchText = matchText.slice(0, findex) //取得正确的outerHTML
                match = matchText.match(rvoidTag) //抽取所有属性

                var attrs = {}
                if (match[2]) {
                    parseAttrs(match[2], attrs)
                }

                var template = matchText.slice(match[0].length,
                        (type.length + 3) * -1) //抽取innerHTML
                var innerHTML = template.replace(rfill, fill)

                node = {
                    type: type,
                    props: attrs,
                    template: innerHTML,
                    children: []
                }

                if (node.props["ms-skip"]) {
                    node.skipContent = true
                } else if (type === "option") {
                    node.children.push(new VText(trimHTML(innerHTML)))
                } else if (type === "xmp") {
                    node.children.push(new VText(innerHTML))
                } else if (rnocontent.test(type)) {
                    node.skipContent = true
                } else {//script, noscript, template, textarea
                    var childs = createVirtual(template, true)
                    if (childs.length) {
                        pushArray(node.children, childs)
                    }
                }
                node = new VElement(node)
                controllerHook(node)
            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]
                type = match[1].toLowerCase()
                attrs = {}
                if (match[2]) {
                    parseAttrs(match[2], attrs)
                }
                node = new VElement({
                    type: type,
                    props: attrs,
                    template: "",
                    children: [],
                    isVoidTag: true
                })
                controllerHook(node)
            }
        }
        if (node) {
            nodes.push(node)
            text = text.slice(matchText.length)
        } else {
            break
        }
    } while (1);
    if (!recursive) {
        maps = {}
    }
    return nodes
}

var rnowhite = /\S+/g
var rnogutter = /\s*=\s*/g
var rquote = /&quot;/g
var ramp = /&amp;/g

function parseAttrs(str, attrs) {
    str.replace(rnogutter, "=").replace(rnowhite, function (el) {
        var arr = el.split("="), value = arr[1] || "",
                name = arr[0].toLowerCase()
        if (arr.length === 2) {
            value = value.replace(rfill, fill)
            //test的方法用到的正则不能出现g
            if (value.match(rstring)) { //if(rstring2.test(value)) {
                value = value.replace(ramp, "&").
                        replace(rquote, '"').
                        slice(1, -1)
            }

        }
        attrs[name] = value
    })
}
//form prototype.js
var rtrimHTML = /<\w+(\s+("[^"]*"|'[^']*'|[^>])+)?>|<\/\w+>/gi
function trimHTML(v) {
    return String(v).replace(rtrimHTML, "").trim()
}


module.exports = avalon.createVirtual = createVirtual
