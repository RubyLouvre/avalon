
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
//从元素的开标签中一个个分解属性值
var rattr2 = /\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
//判定是否有引号开头，IE有些属性没有用引号括起来
var rquote = /^['"]/

var rgtlt = /></

var ramp = /&amp;/g

var tagCache = {}// 缓存所有匹配开标签闭标签的正则
//=== === === === 创建虚拟DOM树 === === === === =
//依赖config
function parseVProps(node, str) {
    var props = node.props, change

    str.replace(rattr2, function (a, n, v) {
        if (v) {
            v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
        }
        var name = n.toLowerCase()
        var match = n.match(rmsAttr)
        if (match) {
            var type = match[1]
            switch (type) {
                case "controller":
                case "important":
                    change = addData(node, "changeAttrs")
                    //移除ms-controller, ms-important
                    //好让[ms-controller]样式生效,处理{{}}问题
                    change[name] = false
                    name = "data-" + type
                    //添加data-controller, data-controller
                    //方便收集vmodel
                    change[name] = v
                    addAttrHook(node)
                    break
                case "with":
                    change = addData(node, "changeAttrs")
                    change[name] = false
                    addAttrHook(node)
                    name = "each"
                    break
            }
        }
        props[name] = v || ""
    })

    return props
}

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
                var allAttrs = matchText.match(rattr1)[0]

                var innerHTML = matchText.slice((tagName + allAttrs).length + 1,
                        (tagName.length + 3) * -1)
                node = new VElement(tagName)
                node.template = innerHTML
                var props = allAttrs.slice(0, -1)
                //这里可能由VElement变成VComponent
                node = fixTag(node, props, matchText)
            }
        }

        if (!node) {
            match = text.match(rvoidTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]
                //不打算序列化的属性不要放在props中
                node = new VElement(match[1])
                node.template = ""

                props = matchText.slice(node.type.length + 1).replace(/\/?>$/, "")
                //这里可能由VElement变成VComponent
                node = fixTag(node, props, matchText)
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
var rmsskip = /\bms\-skip/
var rnocontent = /textarea|template|script|style/

//如果存在ms-if, ms-repeat, ms-html, ms-text指令,可能会生成<ms:repeat> 等自定义标签
function fixTag(node, attrs, outerHTML) {
    if (rmsskip.test(attrs)) {
        node.skip = true
        node.outerHTML = outerHTML
        return node
    }
    parseVProps(node, attrs)
    //如果不是那些装载模板的容器元素(script, noscript, template, textarea)
    //并且它的后代还存在绑定属性
    var innerHTML = node.template
    if (node.type === "option" || node.type === "xmp") {
        node.children.push(new VText(innerHTML))
    }else if (!rnocontent.test(node.type)) {// && rbind.test(outerHTML)
        pushArray(node.children, createVirtual(innerHTML))

    } else {
        if (node.type === "noscript") {
            innerHTML = escape(innerHTML)//这两个元素不能
        }
        node.skipContent = true
        node.__content = innerHTML
    }
    return node
}

