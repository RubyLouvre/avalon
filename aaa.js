function heredoc(fn) {
    return fn.toString().
            replace(/^[^\/]+\/\*!?\s?/, '').
            replace(/\*\/[^\/]+$/, '')
}

//匹配文本节点
var rtext = /^[^<]+/
//匹配注释节点
var rcomment = /^<!--([\w\W]*?)-->/
var ramp = /&amp;/g
var rstring = /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/g

var tagCache = {}
var openStr = "(?:\\s+[^=\\s]+(?:\\=[^>\\s]+)?)*\\s*>"


var rfullTag = /^<([^\s>\/=.$<]+)(?:\s+[^=\s]+(?:=[^>\s]+)?)*\s*>(?:[\s\S]*)<\/\1>/
//匹配只有开标签的无内容元素（Void elements 或 self-contained tags）
//http://www.colorglare.com/2014/02/03/to-close-or-not-to-close.html
//http://blog.jobbole.com/61514/

var rvoidTag = /^<([^\s>\/=.$<]+)\s*([^>]*?)\/?>/

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
    delete maps[a]
    return val
}

function pushArray(target, other) {
    target.push.apply(target, other)
}

// /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
var rnocontent = /textarea|template|script|style/
function createVirtual(str, recursive) {

    var text = recursive == true ? str.replace(rstring, dig) : str

    var nodes = []
    do {
        var matchText = ""
        var match = text.match(rtext)
        var node = false
        var attrs = []
        if (match) {//尝试匹配文本
            matchText = match[0]
            node = {
                type: "#text",
                nodeValue: matchText.replace(rfill, fill)
            }
        }

        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                matchText = match[0]
                node = {
                    type: "#comment",
                    nodeValue: matchText.replace(rfill, fill)
                }
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
                    opens.push(("0000" + b + "<").slice(-4))//取得所有开标签的位置
                    return new Array(_.length + 1).join("1")
                }).replace(rclose, function (_, b) {
                    closes.push(("0000" + b + ">").slice(-4))//取得所有闭标签的位置
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
                if (match[2]) {
                    attrs = parseAttrs(match[2])
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
                } else if (type === "option" || type === "xmp") {
                    node.children.push({
                        type: "text",
                        template: innerHTML
                    })
                } else if (rnocontent.test(type)) {
                    node.skipContent = true
                } else {//script, noscript, template, textarea
                    pushArray(node.children, createVirtual(template, true))
                }

            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]
                type = match[1]

                if (match[2]) {
                    attrs = parseAttrs(match[2])
                }
                node = {
                    type: type,
                    props: attrs,
                    template: "",
                    children: [],
                    isVoidTag: true
                }
            }
        }
        if (node) {
            nodes.push(node)
            text = text.slice(matchText.length)
        } else {
            break
        }
    } while (1);
    return nodes
}
function parseAttrs(str) {
    var attrs = []
    str.replace(/\s*=\s*/g, "=").replace(/\S+/g, function (attr) {
        var arr = attr.split("=")
        if (arr.length === 2) {
            var value = arr[1].replace(rfill, fill)
            if (rstring.test(value)) {
                value = value.replace(ramp, "&").
                        replace(/&quot;/g, '"').
                        slice(1, -1)
            }

            attrs.push({
                name: arr[0],
                value: value
            })
        } else {
            attrs.push({
                name: arr[0],
                value: ""
            })
        }
    })
    return attrs
}

var str = heredoc(function () {
    /*
     
     <div ms-data-number="number"
     ms-data-number2="number2"
     ms-data-bool="bool"
     ms-data-bool2="bool2"
     ms-data-void="vv"
     ms-data-null="nn"
     ms-data-array="array"
     ms-data-date="date"
     ms-data-object="object"
     ms-data-fn="show"
     >点我</div><div id=aaa><div>1111<b></b></div></div><div>222</div>
     <br /><hr id=eee >
     */
}).trim()
console.log(str)
var nodes = createVirtual(str)
console.log(nodes)
