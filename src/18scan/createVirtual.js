
//匹配同时拥有开标签闭标签的元素节点
var rfullTag = /^<(\S+)(\s+[^=\s]+(?:=(?:"[^"]*"|'[^']*'|[^>\s]+))?)*\s*>([\s\S]*)<\/\1>/
//匹配只有开标签的元素节点
var rvoidTag = /^<(\S+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*\s*>/
//用于创建适配某一种标签的正则表达式
var openStr = "(?:\\s+[^=\\s]+(?:=(?:\"[^\"]*\"|'[^']*'|[^>\s]+))?)*\\s*>"
//匹配文本节点
var rtext = /^[^<]+/
//匹配注释节点
var rcomment = /^<\!--([\s\S]*)-->/
//从大片标签中匹想第一个标签的所有属性
var rattr1 = /(\s+[^\s>\/\/=]+(?:=(?:("|')(?:\\\2|\\?(?!\2)[\w\W])*\2|[^\s'">=]+))?)*\s*\/?>/g


var rgtlt = /></



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
                matchText = match[0]
                var tagName = match[1]
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

                var pos = opens.concat(closes).sort()
                var gtlt = pos.join("").replace(/\d+/g, "")
                //<<>><<>>
                var gutter = gtlt.indexOf("><")

                if (gutter !== -1) {
                    var index = gutter
                    var findex = parseFloat(pos[index]) + tagName.length + 3
                    matchText = matchText.slice(0, findex)
                }
                var attrs = matchText.match(rattr1)[0]

                var innerHTML = matchText.slice((tagName + attrs).length + 1,
                        (tagName.length + 3) * -1)
                        
                node = new VElement(tagName, attrs.slice(0, -1), innerHTML)
//                node.template = innerHTML
//                var props = allAttrs.slice(0, -1)
//                //这里可能由VElement变成VComponent
//                node = fixTag(node, props, matchText)
            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]
                //不打算序列化的属性不要放在props中
                tagName = match[1]
                //  node = new VElement(match[1])
                //   node.template = ""

                attrs = matchText.slice(node.type.length + 1).replace(/\/?>$/, "")
                //这里可能由VElement变成VComponent
                node = new VElement(tagName, attrs, "")
               
                //   node = fixTag(node, props, matchText)
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
