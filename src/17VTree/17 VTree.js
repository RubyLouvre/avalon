//不带VM,建立虚拟DOM树

var rfullTag = /^<(\S+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>([\s\S]*)<\/\1>/
var ropenTag = /^<(\S+)(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>/
var openStr = '(?:\\s+[^=\\s]+=?(?:"[^"]*"|\'[^\']*\'|[^\\s>]+)?)*>'
var rtext = /^[^<]+/
var rattr1 = /(\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?)*>/g
var rattr2 = /\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
var rquote = /^['"]/
var rgtlt = /></
var ramp = /&amp;/g
var rcomment = /^<\!--([\s\S]*)-->/
var rmsrepeatkey = /^ms-(repeat|each)-?(.*)/

var avalonID = 1
//=== === === === 创建虚拟DOM树 === === === === =
//依赖config
function parseVProps(node, str) {
    var obj = {}
    var change = addHooks(node, "changeAttrs")
    str.replace(rattr2, function (a, n, v) {
        if (v) {
            v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
        }
        var name = n.toLowerCase()
        var match = n.match(rmsAttr)
        if (match) {
            var type = match[1]
            var param = match[2] || ""
            var value = v
            switch (type) {
                case "controller":
                case "important":
                    change[name] = false
                    name = "data-" + type
                    change[name] = value
                    addAttrHook(node)

                    break
                case "each":
                case "with":
                case "repeat":
                    change[name] = false
                    addAttrHook(node)
                    if (name === "with")
                        name = "each"
                    value = value + "★" + (param || "el")
                    break
            }
        }
        obj[name] = v || ""
    })
    if (!obj["avalon-uuid"]) {
        change["avalon-uuid"] = obj["avalon-uuid"] = avalonID++
        addAttrHook(node)
    }
    return obj
}

var tagCache = {}// 缓存所有匹配开标签闭标签的正则
function buildVTree(text, force) {
    var nodes = []
    if (!force && !rbind.test(text) ){
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
                    var index = gutter //+ tagName.length+ 2
                    var findex = parseFloat(pos[index]) + tagName.length + 3
                    matchText = matchText.slice(0, findex)
                }

                var allAttrs = matchText.match(rattr1)[0]
                var innerHTML = matchText.slice((tagName + allAttrs).length + 1,
                        (tagName.length + 3) * -1)
                node = new VElement(tagName, innerHTML, matchText)

                var props = allAttrs.slice(0, -1)
                node = fixTag(node, props)
            }
        }
        if (!node) {
            match = text.match(ropenTag)
            if (match) {//尝试匹配自闭合标签及注释节点
                matchText = match[0]

                node = new VElement(match[1], "", matchText)

                props = matchText.slice(node.type.length + 1).replace(/\/>$/, "")
                node = fixTag(node, props)
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

var rmsskip = /\bms\-skip/
var rnocontent = /textarea|template|script|style/
//如果存在ms-if, ms-repeat, ms-html, ms-text指令,可能会生成<ms:repeat> 等自定义标签
function fixTag(node, str) {
    if (rmsskip.test(str)) {
        node.skip = true
        return node
    }
    var props = node.props = parseVProps(node, str)
    var outerHTML = node.outerHTML
    //如果不是那些装载模板的容器元素(script, noscript, template, textarea)
    //并且它的后代还存在绑定属性
   
    for (var i = 0, dir; dir = builtinComponents[i++]; ) {
        if (props[dir]) {
            var expr = props[dir]
            delete props[dir]
            var component = new VComponent(dir, {
                template: outerHTML,
                expr: expr
            })
            node.outerHTML = node.toHTML()
            node = component.construct(node)
        }
    }
    // node.children = buildVTree(node.innerHTML)
    // node.outerHTML = node.toHTML()
    if (node.type !== "#component") {
        if (!rnocontent.test(node.type) || rexpr.test(node.innerHTML)) {
            node.children = buildVTree(node.innerHTML)
            
        } else {
            node.skipContent = true
            node.__content = node.innerHTML
        }
    }

    return node
}

var builtinComponents = ["ms-repeat", "ms-html", "ms-text", "ms-if"]