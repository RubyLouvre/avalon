var Cache = require('../seed/cache')
var attrPool = new Cache(512)
var rattrs = /\s+([^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g,
        rquote = /^['"]/,
        rtag = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/i,
        ramp = /&amp;/g
//IE6-8解析HTML5新标签，会将它分解两个元素节点与一个文本节点
//<body><section>ddd</section></body>
//        window.onload = function() {
//            var body = document.body
//            for (var i = 0, el; el = body.children[i++]; ) {
//                avalon.log(el.outerHTML)
//            }
//        }
//依次输出<SECTION>, </SECTION>
var getAttributes = function (elem) {
    var html = elem.outerHTML
    //处理IE6-8解析HTML5新标签的情况，及<br>等半闭合标签outerHTML为空的情况
    if (html.slice(0, 2) === "</" || !html.trim()) {
        return []
    }
    var str = html.match(rtag)[0]
    if (str.slice(-1) === ">")
        str = str.slice(0, -1)
    var attributes = [],
            k, v
    var ret = attrPool.get(str)
    if (ret) {
        return ret
    }
    while (k = rattrs.exec(str)) {
        v = k[2]
        if (v) {
            v = (rquote.test(v) ? v.slice(1, -1) : v).replace(ramp, "&")
        }
        var name = k[1].toLowerCase()
        var binding = {
            name: name,
            specified: true,
            value: v || ""
        }
        attributes.push(binding)
    }
    return attrPool.put(str, attributes)
}

module.exports = getAttributes