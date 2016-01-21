
//匹配同时拥有开标签闭标签的元素节点
var rfullTag = /^<([^\s>]+)(\s+[^=\s]+(?:=(?:"[^"]*"|'[^']*'|[^>\s]+))?)*\s*>([\s\S]*)<\/\1>/
//匹配只有开标签的元素节点
var rvoidTag = /^<([^\s>]+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*\s*>/
//用于创建适配某一种标签的正则表达式
var openStr = "(?:\\s+[^=\\s]+(?:=(?:\"[^\"]*\"|'[^']*'|[^>\s]+))?)*\\s*>"
//匹配文本节点
var rtext = /^[^<]+/
//匹配注释节点
var rcomment = /^<\!--([\s\S]*)-->/
//从大片标签中匹想第一个标签的所有属性
var rallAttrs = /(\s+[^\s>\/\/=]+(?:=(?:("|')(?:\\\2|\\?(?!\2)[\w\W])*\2|[^\s'">=]+))?)*\s*\/?>/g


var tagCache = {}// 缓存所有匹配开标签闭标签的正则
//=== === === === 创建虚拟DOM树 === === === === =
//依赖config

//此阶段只会生成VElement,VText,VComment
function createVirtual(text, force) {
    var nodes = []
    if (!force && !rbind.test(text)) {
        return nodes
    }
    do {
        var matchText = ""

        var match = text.match(rtext)
        var node = false

        if (match) {//尝试匹配文本
            matchText = match[0]
            node = new VText(matchText)
        }

        if (!node) {//尝试匹配注释
            match = text.match(rcomment)
            if (match) {
                matchText = match[0]
                node = new VComment(match[1])
            }
        }

        if (!node) {//尝试匹配拥有闭标签的元素节点
            match = text.match(rfullTag)
            if (match) {
                matchText = match[0]//贪婪匹配 outerHTML,可能匹配过多
                var tagName = match[1]//nodeName
                var opens = []
                var closes = []

                var ropen = tagCache[tagName + "open"] ||
                        (tagCache[tagName + "open"] = new RegExp("<" + tagName + openStr, "g"))
                var rclose = tagCache[tagName + "close"] ||
                        (tagCache[tagName + "close"] = new RegExp("<\/" + tagName + ">", "g"))

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

                var findex = parseFloat(pos[last]) + tagName.length + 3 // (</>为三个字符)
                matchText = matchText.slice(0, findex) //取得正确的innerHTML

                var attrs = matchText.match(rallAttrs)[0] //抽取所有属性

                var innerHTML = matchText.slice((tagName + attrs).length + 1,
                        (tagName.length + 3) * -1) //抽取innerHTML

                node = new VElement(tagName, attrs.slice(0, -1), innerHTML)
            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]
                //不打算序列化的属性不要放在props中
                tagName = match[1]

                attrs = matchText.slice(tagName.length + 1).replace(/\/?>$/, "")
                //这里可能由VElement变成VComponent
                node = new VElement(tagName, attrs, "")
               
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

avalon.createVirtual = createVirtual
